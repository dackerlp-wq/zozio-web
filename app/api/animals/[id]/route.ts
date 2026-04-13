import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function checkAccess(userId: string, animalId: string, service: ReturnType<typeof createServiceClient>) {
  const { data: animal } = await service
    .from('animals')
    .select('institution_id')
    .eq('id', animalId)
    .single()

  if (!animal) return null

  const { data: membership } = await service
    .from('institution_members')
    .select('role')
    .eq('user_id', userId)
    .eq('institution_id', animal.institution_id)
    .single()

  return membership ? animal : null
}

// Whitelist — pouze skutečné sloupce tabulky animals
const ALLOWED_COLUMNS = new Set([
  // Základní info
  'name', 'species_id', 'sex', 'birth_year', 'birth_month', 'size', 'breed', 'color',
  'weight_kg', 'description', 'published', 'adoption_status', 'urgent',
  'adoption_fee', 'story', 'adopter_requirements',
  'is_crossbreed', 'breed2', 'breed2_id', 'breed_id', 'breed_custom',
  'age_months', 'origin',
  // Příjem
  'intake_date', 'intake_time', 'intake_worker', 'intake_reason', 'intake_notes',
  'found_location', 'found_date',
  'intake_finder_name', 'intake_finder_phone', 'intake_finder_address',
  'intake_finder_email', 'intake_finder_id',
  'finder_name', 'finder_phone',
  'previous_owner', 'previous_owner_phone',
  'evidence_number',
  // Identifikace
  'chip_number', 'chip_date', 'chip_implanter', 'chip_location',
  'passport_number', 'passport_issued',
  'crz_registered', 'crz_reg_date',
  'microchipped',
  // Karanténa
  'in_quarantine', 'quarantine_start', 'quarantine_end', 'quarantine_until',
  'quarantine_reason', 'quarantine_vet', 'quarantine_result', 'quarantine_box',
  // Zdraví
  'health_status', 'vaccinated', 'neutered', 'special_needs',
  'vet_name', 'vet_phone', 'last_vet_visit', 'medications', 'medical_notes',
  'vaccination_records', 'medications_data',
  // Dočasná péče
  'in_foster', 'foster_name', 'foster_phone', 'foster_since',
  // Charakter & adopce
  'good_with_kids', 'good_with_dogs', 'good_with_cats', 'good_with_cats',
  'good_with_other_animals', 'good_with_adults',
  'suitable_for_flat', 'suitable_for_house', 'activity_level', 'care_difficulty',
  'rescue_find_type', 'rescue_prognosis', 'rescue_public_description',
  // Fotky & zveřejnění
  'photos', 'primary_photo',
  // Interní
  'internal_notes', 'staff_assigned', 'institution_id',
  // Odchod
  'exit_type', 'exit_date', 'exit_notes', 'exit_worker',
  // Adopce (odchod)
  'adopter_name', 'adopter_phone', 'adopter_email', 'adopter_address',
  'adopter_id_number', 'adoption_contract_num', 'adoption_date', 'adopted_at',
  // Přemístění (odchod)
  'transfer_institution', 'transfer_date', 'transfer_doc_number',
  // Úhyn (odchod)
  'death_date', 'death_type', 'death_cause', 'death_vet',
  'disposal_method', 'disposal_doc_number', 'disposal_company',
])

// good_with_* jsou v DB boolean, formulář posílá 'yes'/'ok'/'no'/'unknown'
function convertGoodWith(value: unknown): boolean | null {
  if (value === 'yes' || value === 'ok') return true
  if (value === 'no') return false
  return null
}

const GOOD_WITH_COLS = ['good_with_kids', 'good_with_dogs', 'good_with_cats', 'good_with_other_animals']

function sanitizePayload(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_COLUMNS.has(key)) continue
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) continue
    payload[key] = GOOD_WITH_COLS.includes(key) ? convertGoodWith(value) : value
  }
  return payload
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    const animal = await checkAccess(user.id, id, service)
    if (!animal) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const body = await request.json()
    const { change_note, ...rest } = body as Record<string, unknown>
    const payload = sanitizePayload(rest)
    payload.updated_at = new Date().toISOString()

    const { error } = await service
      .from('animals')
      .update(payload)
      .eq('id', id)

    if (error) {
      console.error('Supabase update error:', JSON.stringify(error))
      throw error
    }

    revalidatePath('/adopt')
    revalidatePath('/rescue')
    revalidatePath(`/animals/${id}`)

    // Zaeviduj do historie pokud je zadána poznámka (neblokující)
    if (change_note) {
      service.from('animal_status_history').insert({
        animal_id:  id,
        new_status: payload.adoption_status ?? null,
        note:       change_note,
        changed_by: user.id,
      }).then(({ error: hErr }) => {
        if (hErr) console.error('history insert error:', hErr)
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/animals/[id] error:', error instanceof Error ? error.message : JSON.stringify(error))
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    const animal = await checkAccess(user.id, id, service)
    if (!animal) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { error } = await service.from('animals').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/adopt')
    revalidatePath('/rescue')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/animals/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
