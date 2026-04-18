import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Whitelist povolených sloupců pro POST /api/animals.
// Bezpečnostní bariéra proti pass-through `insert(body)` —
// klient nesmí nastavit libovolný sloupec (např. `published`, `evidence_number`, staré cizí FK).
const ALLOWED_COLUMNS = new Set<string>([
  // identifikace
  'institution_id',
  'species_id',
  'name',
  'breed',
  'color',
  // základní údaje
  'sex',
  'birth_year',
  'birth_month',
  'age_months',
  'size',
  'weight_kg',
  // status
  'adoption_status',
  'urgent',
  'published',
  'adoption_fee',
  // příjem
  'intake_date',
  'intake_time',
  'intake_worker',
  'intake_reason',
  'intake_notes',
  'origin',
  'found_date',
  'found_location',
  'intake_finder_name',
  'intake_finder_phone',
  'intake_finder_email',
  'intake_finder_address',
  // identifikace zvířete
  'chip_number',
  'passport_number',
  'crz_registered',
  // zdraví
  'health_status',
  'vaccinated',
  'neutered',
  'microchipped',
  'special_needs',
  'medical_notes',
  'medications',
  // karanténa
  'in_quarantine',
  'quarantine_start',
  'quarantine_end',
  'quarantine_vet',
  'quarantine_box',
  'quarantine_reason',
  // povaha / doporučení
  'good_with_kids',
  'good_with_dogs',
  'good_with_cats',
  'good_with_adults',
  'good_with_other_animals',
  'suitable_for_flat',
  'suitable_for_house',
  'activity_level',
  'care_difficulty',
  'adopter_requirements',
  // obsah
  'description',
  'story',
  'primary_photo',
  'photos',
  // interní
  'internal_notes',
  'staff_assigned',
])

function pickAllowed(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(input)) {
    if (ALLOWED_COLUMNS.has(key)) {
      out[key] = input[key]
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const rawBody = await request.json() as Record<string, unknown>

    if (!rawBody.name || !rawBody.institution_id) {
      return NextResponse.json({ error: 'Chybí povinná pole (name, institution_id)' }, { status: 400 })
    }

    const institutionId = String(rawBody.institution_id)

    const service = createServiceClient()

    // Ověř přístup
    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', institutionId)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup k této instituci' }, { status: 403 })

    // Whitelist — odfiltruj sloupce, které klient nesmí ovlivnit
    const payload = pickAllowed(rawBody)

    // Auto-karanténa: nalezené/odchycené zvíře → 14 dní karantény automaticky
    const foundOrigins = ['found', 'municipal_capture']
    if (foundOrigins.includes(String(payload.origin ?? ''))) {
      const intakeDate = String(payload.intake_date ?? new Date().toISOString().slice(0, 10))
      const qEnd = new Date(intakeDate)
      qEnd.setDate(qEnd.getDate() + 14)
      payload.in_quarantine    = true
      payload.quarantine_start = intakeDate
      payload.quarantine_end   = qEnd.toISOString().slice(0, 10)
      // adoption_status zůstane 'intake' pokud není explicitně nastaveno jinak
      if (!payload.adoption_status) payload.adoption_status = 'intake'
    }

    const { data, error } = await service
      .from('animals')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('POST /api/animals insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    revalidatePath('/adopt')
    revalidatePath('/rescue')

    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/animals error:', error)
    const message = error instanceof Error ? error.message : 'Interní chyba'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
