import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendApplicationStatusEmail } from '@/lib/email'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const body = await request.json()
    const { status, staff_notes, meeting_at } = body

    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'meeting_scheduled', 'adopted']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Neplatný stav' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: app } = await service
      .from('adoption_applications')
      .select('institution_id, applicant_email, applicant_name, animal_id')
      .eq('id', id)
      .single()

    if (!app) return NextResponse.json({ error: 'Žádost nenalezena' }, { status: 404 })

    // Ověř přístup
    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('institution_id', app.institution_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    // Aktualizuj žádost
    const { error } = await service
      .from('adoption_applications')
      .update({
        status,
        staff_notes: staff_notes ?? null,
        meeting_at:  meeting_at  ?? null,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    // ── FIX 1: Při adoptování automaticky změň stav zvířete ──────────────
    if (status === 'adopted' && app.animal_id) {
      await service
        .from('animals')
        .update({
          adoption_status: 'adopted',
          updated_at:      new Date().toISOString(),
        })
        .eq('id', app.animal_id)

      // Zaznamenej do historie
      await service.from('animal_status_history').insert({
        animal_id:  app.animal_id,
        old_status: 'available',
        new_status: 'adopted',
        note:       `Automaticky po schválení žádosti ${id}`,
        action:     'status_change',
        changed_by: user.id,
      })

      // Zamítni ostatní pending žádosti o toto zvíře
      await service
        .from('adoption_applications')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('animal_id', app.animal_id)
        .in('status', ['pending', 'reviewing', 'meeting_scheduled'])
        .neq('id', id)
    }

    // ── FIX 2: E-mail i při stavu 'adopted' ──────────────────────────────
    if (['approved', 'rejected', 'meeting_scheduled', 'adopted'].includes(status)) {
      try {
        // Načti jméno zvířete
        const { data: appFull } = await service
          .from('adoption_applications')
          .select('animal:animals(name)')
          .eq('id', id)
          .single()

        const animalName = (appFull?.animal as any)?.name ?? 'zvíře'

        await sendApplicationStatusEmail({
          applicantEmail: app.applicant_email,
          applicantName:  app.applicant_name,
          animalName,
          status,
        })
      } catch (emailError) {
        console.error('Email send error:', emailError)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/applications/[id]/status error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
