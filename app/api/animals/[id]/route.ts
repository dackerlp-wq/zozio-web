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
  // Podmíněná adopce
  'conditional_adopter_name', 'conditional_adopter_phone', 'conditional_adopter_email',
  'conditional_adoption_since', 'conditional_adoption_note',
  // Adopce (odchod)
  'adopter_name', 'adopter_phone', 'adopter_email', 'adopter_address',
  'adopter_id_number', 'adoption_contract_num', 'adoption_date', 'adopted_at',
  // Přemístění (odchod)
  'transfer_institution', 'transfer_date', 'transfer_doc_number',
  // Úhyn (odchod)
  'death_date', 'death_type', 'death_cause', 'death_vet',
  'disposal_method', 'disposal_doc_number', 'disposal_company',
])

// good_with_* jsou TEXT sloupce, hodnoty: 'yes'|'ok'|'no'|'unknown'|null
const GOOD_WITH_VALID = new Set(['yes', 'ok', 'no', 'unknown'])

function sanitizePayload(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_COLUMNS.has(key)) continue
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) continue
    // Normalize good_with_* — přijme i starý boolean formát z DB
    if (['good_with_kids','good_with_dogs','good_with_cats','good_with_other_animals'].includes(key)) {
      if (value === true  || value === 'true'  || value === 1) { payload[key] = 'yes'; continue }
      if (value === false || value === 'false' || value === 0) { payload[key] = 'no';  continue }
      payload[key] = GOOD_WITH_VALID.has(value as string) ? value : null
      continue
    }
    payload[key] = value
  }
  return payload
}

// ── Audit helpers ────────────────────────────────────────────────────────────

const TRACKED_FIELDS: Record<string, string> = {
  name:             'Jméno',
  sex:              'Pohlaví',
  breed:            'Plemeno',
  color:            'Barva',
  weight_kg:        'Váha (kg)',
  birth_year:       'Rok narození',
  size:             'Velikost',
  adoption_status:  'Status adopce',
  published:        'Zveřejnění',
  urgent:           'Urgentní',
  health_status:    'Zdravotní stav',
  neutered:         'Kastrace',
  vaccinated:       'Očkování',
  chip_number:      'Číslo čipu',
  passport_number:  'Číslo pasu',
  crz_registered:   'CRZ registrace',
  quarantine_start: 'Zahájení karantény',
  quarantine_end:   'Konec karantény',
  quarantine_vet:   'Veterinář karantény',
  in_quarantine:    'V karanténě',
  good_with_kids:   'Vztah k dětem',
  good_with_dogs:   'Vztah k psům',
  good_with_cats:   'Vztah ke kočkám',
  good_with_adults: 'Povaha k lidem',
  activity_level:   'Aktivita',
  care_difficulty:  'Náročnost péče',
  adoption_fee:     'Adopční poplatek',
  origin:           'Způsob příjmu',
  found_location:   'Místo nálezu',
  medical_notes:    'Zdravotní poznámky',
  description:      'Popis povahy',
  story:            'Příběh zvířete',
  internal_notes:   'Interní poznámky',
}

const VALUE_LABELS: Record<string, string> = {
  intake: 'V příjmu', available: 'K adopci', reserved: 'Rezervováno',
  adopted: 'Adoptováno', foster: 'Dočasná péče', not_for_adoption: 'Není k adopci',
  healthy: 'Zdravý', sick: 'Nemocný', injured: 'Zraněný',
  recovering: 'Rekonvalescence', chronic: 'Chronické',
  male: 'Samec', female: 'Samice', unknown: 'Netestováno',
  low: 'Nízká', medium: 'Střední', high: 'Vysoká', very_high: 'Velmi vysoká',
  easy: 'Nenáročný', demanding: 'Náročný', hard: 'Náročný', expert: 'Expert',
  found: 'Nalezeno', municipal_capture: 'Odchyceno obcí', surrendered: 'Odevzdáno',
  seized: 'Odebráno', transferred: 'Přemístěno', other: 'Jiné',
  friendly: 'Přátelský', shy: 'Ostýchavý', fearful: 'Bojácný', distrustful: 'Nedůvěřivý',
  yes: 'Miluje', ok: 'Toleruje', no: 'Nevhodné',
}

function fmtAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (value === true  || value === 'true'  || value === 1) return 'Ano'
  if (value === false || value === 'false' || value === 0) return 'Ne'
  const s = String(value)
  return VALUE_LABELS[s] ?? s
}

interface AuditChange { field: string; label: string; old_value: string; new_value: string }

function buildAuditChanges(
  current: Record<string, unknown>,
  payload:  Record<string, unknown>,
): AuditChange[] {
  const changes: AuditChange[] = []
  for (const field of Object.keys(TRACKED_FIELDS)) {
    if (!(field in payload)) continue
    const oldRaw = current[field]
    const newRaw = payload[field]
    const oldStr = fmtAuditValue(oldRaw)
    const newStr = fmtAuditValue(newRaw)
    if (oldStr === newStr) continue
    changes.push({ field, label: TRACKED_FIELDS[field], old_value: oldStr, new_value: newStr })
  }
  return changes
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

    // 1. Načti aktuální stav pro diff
    const { data: currentAnimal } = await service
      .from('animals')
      .select('name,sex,breed,color,weight_kg,birth_year,size,adoption_status,published,urgent,health_status,neutered,vaccinated,chip_number,passport_number,crz_registered,quarantine_start,quarantine_end,quarantine_vet,in_quarantine,good_with_kids,good_with_dogs,good_with_cats,good_with_adults,activity_level,care_difficulty,adoption_fee,origin,found_location,medical_notes,description,story,internal_notes')
      .eq('id', id)
      .single()

    // Auto-sync in_quarantine boolean z dat karantény
    if ('quarantine_start' in payload || 'quarantine_end' in payload) {
      const qs = (payload.quarantine_start ?? currentAnimal?.quarantine_start) as string | null
      const qe = (payload.quarantine_end ?? currentAnimal?.quarantine_end) as string | null
      if (qs) {
        const endDate = qe ? new Date(qe) : new Date(new Date(qs).getTime() + 14 * 86400000)
        payload.in_quarantine = endDate > new Date()
      }
    }

    // Auto-sync microchipped z chip_number
    if ('chip_number' in payload) {
      payload.microchipped = payload.chip_number ? true : false
    }

    const { error } = await service
      .from('animals')
      .update(payload)
      .eq('id', id)

    if (error) {
      console.error('Supabase update error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message ?? 'DB chyba', detail: error.details }, { status: 400 })
    }

    revalidatePath('/adopt')
    revalidatePath('/rescue')
    revalidatePath(`/animals/${id}`)

    // 2. Build a ulož audit log
    if (currentAnimal) {
      const changes = buildAuditChanges(currentAnimal as Record<string,unknown>, payload)
      if (changes.length > 0 || change_note) {
        service.from('animal_audit_log').insert({
          animal_id:   id,
          changed_by:  user.id,
          change_note: change_note || null,
          changes,
        }).then(({ error: aErr }) => {
          if (aErr) console.error('audit log insert error:', aErr)
        })
      }
    }

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
