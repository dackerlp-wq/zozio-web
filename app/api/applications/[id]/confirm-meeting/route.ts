import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { token, optionIndex } = await request.json() as { token?: string; optionIndex: number }

    const service = createServiceClient()

    const { data: app } = await service
      .from('adoption_applications')
      .select('id, status, cancel_token, meeting_options, applicant_name, applicant_email, applicant_phone, user_id, institution_id')
      .eq('id', id)
      .single()

    if (!app) return NextResponse.json({ error: 'Žádost nenalezena' }, { status: 404 })
    if (app.status !== 'meeting_scheduled') {
      return NextResponse.json({ error: 'Schůzka nebyla naplánována' }, { status: 400 })
    }

    // Autorizace: platný token (e-mail odkaz) nebo přihlášený žadatel
    let authorized = false

    if (token && token === app.cancel_token) {
      authorized = true
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (app.user_id === user.id || app.applicant_email === user.email) {
          authorized = true
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Neoprávněný přístup' }, { status: 403 })
    }

    const meetingOptions: string[] = Array.isArray(app.meeting_options) ? app.meeting_options : []
    const confirmedDate = meetingOptions[optionIndex]

    if (!confirmedDate) {
      return NextResponse.json({ error: 'Neplatný termín' }, { status: 400 })
    }

    const { error } = await service
      .from('adoption_applications')
      .update({
        meeting_at:  confirmedDate,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    // Informovat útulek e-mailem
    try {
      const { data: institution } = await service
        .from('institutions')
        .select('email, name')
        .eq('id', app.institution_id)
        .single()

      if (institution?.email) {
        const animalRes = await service
          .from('animals')
          .select('name, species:animal_species(icon)')
          .eq('institution_id', app.institution_id)
          .single()
        const animal = animalRes.data

        const { sendMeetingConfirmedEmail } = await import('@/lib/email/send')
        await sendMeetingConfirmedEmail({
          to:                     institution.email,
          institutionContactName: institution.name,
          applicantName:          app.applicant_name,
          applicantEmail:         app.applicant_email,
          applicantPhone:         app.applicant_phone ?? undefined,
          animalName:             (animal as any)?.name  ?? 'zvíře',
          animalEmoji:            (animal as any)?.species?.icon ?? '🐾',
          confirmedDate,
          applicationId:          id,
        })
      }
    } catch (emailError) {
      console.error('Meeting confirmed email error:', emailError)
    }

    return NextResponse.json({ success: true, confirmedDate })

  } catch (error) {
    console.error('POST /api/applications/[id]/confirm-meeting error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
