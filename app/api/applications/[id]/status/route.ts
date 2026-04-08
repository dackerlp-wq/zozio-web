import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendApplicationStatusEmail,
  sendAnimalAdoptedEmail,
} from '@/lib/email'

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
    const { status, staff_notes, meeting_at, meeting_options, institution_note } = body

    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'meeting_scheduled', 'adopted', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Neplatný stav' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: app } = await service
      .from('adoption_applications')
      .select('institution_id, applicant_email, applicant_name, animal_id, cancel_token')
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

    // Načti data instituce a zvířete pro emaily
    const [{ data: institution }, { data: animalData }] = await Promise.all([
      service.from('institutions').select('name, email, phone').eq('id', app.institution_id).single(),
      app.animal_id
        ? service.from('animals').select('name, adoption_fee, primary_photo, species:animal_species(name_cs, icon)').eq('id', app.animal_id).single()
        : Promise.resolve({ data: null }),
    ])
    const animalEmoji    = (animalData as any)?.species?.icon ?? '🐾'
    const animalName     = (animalData as any)?.name ?? 'zvíře'
    const animalFee      = (animalData as any)?.adoption_fee ? `${(animalData as any).adoption_fee} Kč` : 'neuvedeno'
    const animalPhotoUrl = (animalData as any)?.primary_photo ?? undefined

    // Aktualizuj žádost
    const { error } = await service
      .from('adoption_applications')
      .update({
        status,
        staff_notes:      staff_notes      ?? null,
        institution_note: institution_note ?? null,
        meeting_at:       meeting_at       ?? null,
        meeting_options:  meeting_options  ?? null,
        cancelled_at:     status === 'cancelled' ? new Date().toISOString() : null,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    // ── Při adoptování automaticky změň stav zvířete ──────────────
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

      // Zamítni ostatní pending žádosti o toto zvíře a pošli jim email
      const { data: otherApps } = await service
        .from('adoption_applications')
        .select('id, applicant_email, applicant_name')
        .eq('animal_id', app.animal_id)
        .in('status', ['pending', 'reviewing', 'meeting_scheduled'])
        .neq('id', id)

      if (otherApps?.length) {
        await service
          .from('adoption_applications')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .in('id', otherApps.map((a: any) => a.id))

        // Pošli zamítavé emaily ostatním žadatelům
        const { sendApplicationRejectedEmail } = await import('@/lib/email')
        await Promise.allSettled(
          otherApps.map((other: any) =>
            sendApplicationRejectedEmail({
              to:              other.applicant_email,
              applicantName:   other.applicant_name,
              animalName,
              institutionName: institution?.name ?? '',
              institutionMessage: 'Zvíře bylo adoptováno jiným zájemcem.',
            })
          )
        )
      }
    }

    // Emaily dle stavu
    if (['reviewing', 'approved', 'rejected', 'meeting_scheduled', 'adopted'].includes(status)) {
      try {
        await sendApplicationStatusEmail({
          applicantEmail:   app.applicant_email,
          applicantName:    app.applicant_name,
          animalName,
          animalEmoji,
          animalPhotoUrl,
          status,
          institutionName:  institution?.name  ?? '',
          institutionPhone: institution?.phone ?? '',
          institutionEmail: institution?.email ?? '',
          adoptionFee:      animalFee,
          applicationId:    id,
          detailUrl:        `https://zozio.cz/profil?tab=applications`,
          institutionNote:  institution_note ?? undefined,
          meetingOptions:   meeting_options ?? undefined,
          meetingAt:        meeting_at ?? undefined,
          cancelToken:      (app as any).cancel_token ?? undefined,
        })

        // Při adopci — pošli adoptorovi gratulační email
        if (status === 'adopted') {
          await sendAnimalAdoptedEmail({
            to:              app.applicant_email,
            adoptorName:     app.applicant_name,
            animalName,
            animalEmoji,
            institutionName: institution?.name ?? '',
            shareUrl:        `https://zozio.cz/articles`,
          })
        }
      } catch (emailError) {
        console.error('Email send error:', emailError)
      }
    }

    // Při změně stavu zvířete (adoptováno) invaliduj veřejné stránky
    if (status === 'adopted' && app.animal_id) {
      revalidatePath('/adopt')
      revalidatePath(`/animals/${app.animal_id}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/applications/[id]/status error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
