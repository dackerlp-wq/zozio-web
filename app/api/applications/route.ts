import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendNewApplicationEmail, sendApplicationConfirmationEmail } from '@/lib/email'

// Jednoduchý in-memory rate limiter (reset při deployi — stačí pro základní ochranu)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now     = Date.now()
  const window  = 60 * 60 * 1000  // 1 hodina
  const limit   = 5                // max 5 žádostí za hodinu z jedné IP

  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Volitelná autentizace — ulož user_id pokud je přihlášen
    const supabaseAuth = await createClient()
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser()

    // ── FIX 4: Rate limiting ──────────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Příliš mnoho žádostí. Zkus to znovu za hodinu.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    if (!body.animal_id || !body.applicant_name || !body.applicant_email || !body.motivation) {
      return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: animal } = await supabase
      .from('animals')
      .select('id, institution_id, adoption_status, name, primary_photo, species:animal_species(name_cs, icon)')
      .eq('id', body.animal_id)
      .single()

    if (!animal) return NextResponse.json({ error: 'Zvíře nenalezeno' }, { status: 404 })

    if (animal.adoption_status !== 'available') {
      return NextResponse.json(
        { error: `${animal.name} již není dostupný k adopci` },
        { status: 409 }
      )
    }

    // ── FIX 5: Cooldown — 7 dní po zamítnutí ─────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: recentRejected } = await supabase
      .from('adoption_applications')
      .select('id, updated_at')
      .eq('animal_id', body.animal_id)
      .eq('applicant_email', body.applicant_email)
      .eq('status', 'rejected')
      .gte('updated_at', sevenDaysAgo)
      .single()

    if (recentRejected) {
      return NextResponse.json(
        { error: 'Tvoje žádost byla nedávno zamítnuta. Počkej prosím 7 dní před opětovným podáním.' },
        { status: 429 }
      )
    }

    // Duplicitní aktivní žádost
    const { data: existing } = await supabase
      .from('adoption_applications')
      .select('id')
      .eq('animal_id', body.animal_id)
      .eq('applicant_email', body.applicant_email)
      .in('status', ['pending', 'reviewing', 'approved', 'meeting_scheduled'])
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Na toto zvíře jsi již žádost podal/a' },
        { status: 409 }
      )
    }

    const purpose = ['family', 'sport', 'guard', 'other'].includes(body.purpose) ? body.purpose : null
    const hoursWeekday = Number.isFinite(body.hours_alone_weekday) && body.hours_alone_weekday >= 0 && body.hours_alone_weekday <= 24
      ? body.hours_alone_weekday : null
    const hoursWeekend = Number.isFinite(body.hours_alone_weekend) && body.hours_alone_weekend >= 0 && body.hours_alone_weekend <= 24
      ? body.hours_alone_weekend : null

    const { data, error } = await supabase
      .from('adoption_applications')
      .insert({
        animal_id:           body.animal_id,
        institution_id:      animal.institution_id,
        applicant_name:      body.applicant_name,
        applicant_email:     body.applicant_email,
        applicant_phone:     body.applicant_phone     ?? null,
        applicant_city:      body.applicant_city      ?? null,
        housing_type:        body.housing_type        ?? null,
        has_garden:          body.has_garden          ?? null,
        has_children:        body.has_children        ?? null,
        children_ages:       body.children_ages       ?? null,
        other_pets:          body.other_pets          ?? null,
        backup_caregiver:    body.backup_caregiver    ?? null,
        purpose,
        hours_alone_weekday: hoursWeekday,
        hours_alone_weekend: hoursWeekend,
        experience:          body.experience          ?? null,
        motivation:          body.motivation,
        application_message: body.application_message ?? null,
        status:              'pending',
        user_id:             authUser?.id ?? null,
      })
      .select('id')
      .single()

    if (error) throw error

    // cancel_token načti zvlášť — odolné vůči chybějící migraci
    const { data: tokenRow } = await supabase
      .from('adoption_applications')
      .select('cancel_token')
      .eq('id', data.id)
      .single()
    const cancelToken: string | undefined = (tokenRow as any)?.cancel_token ?? undefined

    // E-maily
    try {
      const { data: institution } = await supabase
        .from('institutions')
        .select('email, name')
        .eq('id', animal.institution_id)
        .single()

      const animalEmoji    = (animal as any).species?.icon ?? '🐾'
      const animalSpecies  = (animal as any).species?.name_cs ?? 'zvíře'
      const animalPhotoUrl = (animal as any).primary_photo ?? undefined

      if (institution?.email) {
        await sendNewApplicationEmail({
          institutionEmail:  institution.email,
          institutionName:   institution.name,
          animalName:        animal.name,
          applicantName:     body.applicant_name,
          applicantEmail:    body.applicant_email,
          applicationId:     data.id,
          applicantPhone:    body.applicant_phone  ?? undefined,
          applicantCity:     body.applicant_city   ?? undefined,
          applicantHasOtherAnimals: body.other_pets ? true : undefined,
          backupCaregiver:   body.backup_caregiver ?? undefined,
          purpose,
          hoursAloneWeekday: hoursWeekday ?? undefined,
          hoursAloneWeekend: hoursWeekend ?? undefined,
          animalEmoji,
          animalSpecies,
          applicationMessage: body.application_message ?? '',
        })
      }

      await sendApplicationConfirmationEmail({
        applicantEmail:  body.applicant_email,
        applicantName:   body.applicant_name,
        animalName:      animal.name,
        institutionName: institution?.name ?? '',
        animalEmoji,
        animalSpecies,
        applicationId:   data.id,
        animalPhotoUrl,
        cancelToken:     cancelToken,
      })
    } catch (emailError) {
      console.error('Email error:', emailError)
    }

    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/applications error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
