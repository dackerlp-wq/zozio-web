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
      .select('institution_id, applicant_email, applicant_name')
      .eq('id', id)
      .single()

    if (!app) return NextResponse.json({ error: 'Žádost nenalezena' }, { status: 404 })

    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('institution_id', app.institution_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

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

    // Načti jméno zvířete pro e-mail
    const { data: appFull } = await service
      .from('adoption_applications')
      .select('animal:animals(name)')
      .eq('id', id)
      .single()

    const animalName = (appFull?.animal as any)?.name ?? 'zvíře'

    // Pošli e-mail při relevantních stavech
    if (['approved', 'rejected', 'meeting_scheduled'].includes(status)) {
      await sendApplicationStatusEmail({
        applicantEmail: app.applicant_email,
        applicantName:  app.applicant_name,
        animalName,
        status,
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/applications/[id]/status error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
