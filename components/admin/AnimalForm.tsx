'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import {
  ADOPTION_STATUS_LABEL, RESCUE_STATUS_LABEL,
  HEALTH_STATUS_LABEL, INTAKE_REASON_LABEL, SIZE_LABEL,
} from '@/lib/animal-labels'

interface AnimalFormProps {
  institutionId: string
  institutionType: string
  species: { id: string; name_cs: string; icon: string | null }[]
  mode: 'create' | 'edit'
  animal?: any
  statusHistory?: any[]
  currentUser?: { id: string; email: string }
}

type Tab = 'basic' | 'health' | 'origin' | 'internal' | 'history'

export function AnimalForm({
  institutionId, institutionType, species, mode, animal, statusHistory = [], currentUser
}: AnimalFormProps) {
  const router    = useRouter()
  const isShelter = institutionType === 'shelter'
  const fileRef   = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('basic')

  const [form, setForm] = useState({
    name:               animal?.name               ?? '',
    species_id:         animal?.species_id         ?? '',
    sex:                animal?.sex                ?? '',
    birth_year:         animal?.birth_year         ?? '',
    size:               animal?.size               ?? '',
    breed:              animal?.breed              ?? '',
    color:              animal?.color              ?? '',
    weight_kg:          animal?.weight_kg          ?? '',
    description:        animal?.description        ?? '',
    published:          animal?.published          ?? true,
    adoption_status:    animal?.adoption_status    ?? 'available',
    urgent:             animal?.urgent             ?? false,
    adoption_fee:       animal?.adoption_fee       ?? 0,
    status:             animal?.status             ?? 'intake',
    health_status:      animal?.health_status      ?? 'healthy',
    in_quarantine:      animal?.in_quarantine      ?? false,
    quarantine_until:   animal?.quarantine_until   ?? '',
    quarantine_reason:  animal?.quarantine_reason  ?? '',
    in_foster:          animal?.in_foster          ?? false,
    foster_name:        animal?.foster_name        ?? '',
    foster_phone:       animal?.foster_phone       ?? '',
    foster_since:       animal?.foster_since       ?? '',
    vaccinated:         animal?.vaccinated         ?? false,
    neutered:           animal?.neutered           ?? false,
    microchipped:       animal?.microchipped       ?? false,
    chip_number:        animal?.chip_number        ?? '',
    chip_date:          animal?.chip_date          ?? '',
    passport_number:    animal?.passport_number    ?? '',
    vet_name:           animal?.vet_name           ?? '',
    vet_phone:          animal?.vet_phone          ?? '',
    last_vet_visit:     animal?.last_vet_visit     ?? '',
    medications:        animal?.medications        ?? '',
    medical_notes:      animal?.medical_notes      ?? '',
    good_with_kids:     animal?.good_with_kids     ?? false,
    good_with_dogs:     animal?.good_with_dogs     ?? false,
    good_with_cats:     animal?.good_with_cats     ?? false,
    special_needs:      animal?.special_needs      ?? '',
    case_number:        animal?.case_number        ?? '',
    estimated_age:      animal?.estimated_age      ?? '',
    cause_of_injury:    animal?.cause_of_injury    ?? '',
    diagnosis:          animal?.diagnosis          ?? '',
    treatment_notes:    animal?.treatment_notes    ?? '',
    public_description: animal?.public_description ?? '',
    weight_g:           animal?.weight_g           ?? '',
    ring_number:        animal?.ring_number        ?? '',
    release_location:   animal?.release_location   ?? '',
    intake_reason:      animal?.intake_reason      ?? '',
    intake_date:        animal?.intake_date        ?? '',
    intake_notes:       animal?.intake_notes       ?? '',
    found_location:     animal?.found_location     ?? '',
    found_date:         animal?.found_date         ?? '',
    finder_name:        animal?.finder_name        ?? '',
    finder_phone:       animal?.finder_phone       ?? '',
    previous_owner:     animal?.previous_owner     ?? '',
    previous_owner_phone: animal?.previous_owner_phone ?? '',
    internal_notes:     animal?.internal_notes     ?? '',
    staff_assigned:     animal?.staff_assigned     ?? '',
    // Nová pole — aktivita, náročnost, bydlení
    activity_level:          animal?.activity_level          ?? '',
    care_difficulty:          animal?.care_difficulty          ?? '',
    suitable_for_flat:        animal?.suitable_for_flat        ?? null,
    suitable_for_house:       animal?.suitable_for_house       ?? null,
    good_with_other_animals:  animal?.good_with_other_animals  ?? null,
  })

  const [photos, setPhotos]             = useState<string[]>(animal?.photos ?? [])
  const [primaryPhoto, setPrimaryPhoto] = useState<string>(animal?.primary_photo ?? '')
  const [uploading, setUploading]       = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [changeNote, setChangeNote]     = useState('')  // poznámka ke každé změně
  const [localHistory, setLocalHistory] = useState<any[]>(statusHistory)

  const update = (key: string, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // Upload fotek
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const supabase = createClient()
    const newPhotos: string[] = []
    for (const file of files) {
      const ext  = file.name.split('.').pop()
      const path = `animals/${institutionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('animal-photos').upload(path, file, { upsert: true })
      if (uploadError) continue
      const { data: { publicUrl } } = supabase.storage.from('animal-photos').getPublicUrl(path)
      newPhotos.push(publicUrl)
    }
    const updated = [...photos, ...newPhotos]
    setPhotos(updated)
    if (!primaryPhoto && updated.length > 0) setPrimaryPhoto(updated[0])
    setUploading(false)
  }

  const removePhoto = (url: string) => {
    const updated = photos.filter(p => p !== url)
    setPhotos(updated)
    if (primaryPhoto === url) setPrimaryPhoto(updated[0] ?? '')
  }

  const handleSubmit = async () => {
    if (isShelter && !form.name) { setError('Zadej jméno zvířete'); return }
    setLoading(true)
    setError(null)

    const table  = isShelter ? 'animals' : 'rescue_cases'
    const url    = mode === 'create' ? `/api/${table}` : `/api/${table}/${animal.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const oldStatus = isShelter ? animal?.adoption_status : animal?.status
    const newStatus = isShelter ? form.adoption_status    : form.status
    const statusChanged = mode === 'edit' && oldStatus !== newStatus

    const payload = isShelter ? {
      institution_id:      institutionId,
      name:                form.name,
      species_id:          form.species_id          || null,
      sex:                 form.sex                 || null,
      birth_year:          form.birth_year          ? parseInt(form.birth_year)    : null,
      size:                form.size                || null,
      breed:               form.breed               || null,
      color:               form.color               || null,
      weight_kg:           form.weight_kg           ? parseFloat(form.weight_kg)  : null,
      description:         form.description         || null,
      adoption_status:     form.adoption_status,
      urgent:              form.urgent,
      adoption_fee:        parseInt(form.adoption_fee) || 0,
      vaccinated:          form.vaccinated,
      neutered:            form.neutered,
      microchipped:        form.microchipped,
      chip_number:         form.chip_number         || null,
      chip_date:           form.chip_date           || null,
      passport_number:     form.passport_number     || null,
      good_with_kids:      form.good_with_kids,
      good_with_dogs:      form.good_with_dogs,
      good_with_cats:      form.good_with_cats,
      special_needs:       form.special_needs       || null,
      vet_name:            form.vet_name            || null,
      vet_phone:           form.vet_phone           || null,
      last_vet_visit:      form.last_vet_visit      || null,
      medications:         form.medications         || null,
      medical_notes:       form.medical_notes       || null,
      in_quarantine:       form.in_quarantine,
      quarantine_until:    form.quarantine_until    || null,
      quarantine_reason:   form.quarantine_reason   || null,
      in_foster:           form.in_foster,
      foster_name:         form.foster_name         || null,
      foster_phone:        form.foster_phone        || null,
      foster_since:        form.foster_since        || null,
      found_location:      form.found_location      || null,
      found_date:          form.found_date          || null,
      finder_name:         form.finder_name         || null,
      finder_phone:        form.finder_phone        || null,
      previous_owner:      form.previous_owner      || null,
      previous_owner_phone: form.previous_owner_phone || null,
      internal_notes:      form.internal_notes      || null,
      staff_assigned:      form.staff_assigned      || null,
      activity_level:          form.activity_level          || null,
      care_difficulty:          form.care_difficulty          || null,
      suitable_for_flat:        form.suitable_for_flat        ?? null,
      suitable_for_house:       form.suitable_for_house       ?? null,
      good_with_other_animals:  form.good_with_other_animals  ?? null,
      photos,
      primary_photo:       primaryPhoto             || null,
      published:           form.published,
    } : {
      institution_id:      institutionId,
      name:                form.name                || null,
      species_id:          form.species_id          || null,
      sex:                 form.sex                 || null,
      estimated_age:       form.estimated_age       || null,
      status:              form.status,
      health_status:       form.health_status,
      cause_of_injury:     form.cause_of_injury     || null,
      diagnosis:           form.diagnosis           || null,
      treatment_notes:     form.treatment_notes     || null,
      medical_notes:       form.medical_notes       || null,
      public_description:  form.public_description  || null,
      found_location:      form.found_location      || null,
      found_date:          form.found_date          || null,
      found_by:            form.finder_name         || null,
      vet_name:            form.vet_name            || null,
      intake_date:         form.intake_date         || null,
      photos,
      primary_photo:       primaryPhoto             || null,
      published:           form.published,
    }

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Interní chyba serveru')
      setLoading(false)
      return
    }

    // Zaznamenej do historie — VŽDY při uložení (ne jen při změně stavu)
    const animalId = mode === 'create' ? data.id : animal.id

    await fetch('/api/animal-status-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animal_id:      isShelter ? animalId : null,
        rescue_case_id: !isShelter ? animalId : null,
        old_status:     statusChanged ? oldStatus : null,
        new_status:     newStatus,
        status_changed: statusChanged,
        note:           changeNote || null,
        action:         mode === 'create' ? 'create' : statusChanged ? 'status_change' : 'update',
      }),
    })

    // Aktualizuj lokální historii okamžitě
    const newEntry = {
      id:          Date.now().toString(),
      old_status:  statusChanged ? oldStatus : null,
      new_status:  newStatus,
      note:        changeNote || null,
      action:      mode === 'create' ? 'create' : statusChanged ? 'status_change' : 'update',
      changed_at:  new Date().toISOString(),
    }
    setLocalHistory(prev => [newEntry, ...prev])
    setChangeNote('')

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)

    if (mode === 'create') {
      // Po vytvoření přejdi na editaci nového zvířete
      router.push(`/admin/animals/${animalId}`)
    } else {
      // Zůstaň na stránce — jen refresh dat
      router.refresh()
    }
  }

  const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors w-full bg-white'
  const checkCls = 'w-4 h-4 accent-coral cursor-pointer flex-shrink-0'

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'basic',    label: 'Základní',  icon: '🐾' },
    { key: 'health',   label: 'Zdraví',    icon: '🩺' },
    { key: 'origin',   label: 'Původ',     icon: '📍' },
    { key: 'internal', label: 'Interní',   icon: '🔒' },
    { key: 'history',  label: `Historie${localHistory.length > 0 ? ` (${localHistory.length})` : ''}`, icon: '📋' },
  ]

  const actionLabel: Record<string, string> = {
    create:        '✨ Záznam vytvořen',
    status_change: '🔄 Změna stavu',
    update:        '✏️ Aktualizace záznamu',
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">

      {/* Levý panel */}
      <div className="lg:col-span-2 space-y-4">

        {/* Tab navigace */}
        <div className="flex gap-1 bg-white rounded-lg p-1.5 border border-gray-pale shadow-sm flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-display font-bold text-sm transition-all cursor-pointer border-none
                ${tab === t.key ? 'bg-espresso text-white' : 'text-gray hover:bg-sand bg-transparent'}`}>
              <span>{t.icon}</span>
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: Základní ── */}
        {tab === 'basic' && (
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm space-y-4">
            <h2 className="font-display font-extrabold text-xl text-espresso">Základní informace</h2>

            {isShelter ? (
              <Field label="Jméno zvířete *">
                <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Max" className={inputCls} />
              </Field>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Jméno (volitelné)">
                  <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Vocálko" className={inputCls} />
                </Field>
                <Field label="Číslo případu">
                  <input value={form.case_number} onChange={e => update('case_number', e.target.value)} placeholder="ZS-2026-001" className={inputCls} />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Druh">
                <select value={form.species_id} onChange={e => update('species_id', e.target.value)} className={inputCls}>
                  <option value="">Vybrat druh...</option>
                  {species.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name_cs}</option>)}
                </select>
              </Field>
              <Field label="Pohlaví">
                <select value={form.sex} onChange={e => update('sex', e.target.value)} className={inputCls}>
                  <option value="">Neznámé</option>
                  <option value="male">♂ Samec</option>
                  <option value="female">♀ Samice</option>
                </select>
              </Field>
            </div>

            {isShelter ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Rok narození">
                    <input type="number" value={form.birth_year} onChange={e => update('birth_year', e.target.value)} placeholder="2021" className={inputCls} />
                  </Field>
                  <Field label="Velikost">
                    <select value={form.size} onChange={e => update('size', e.target.value)} className={inputCls}>
                      <option value="">—</option>
                      {Object.entries(SIZE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Váha (kg)">
                    <input type="number" step="0.1" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} placeholder="15.5" className={inputCls} />
                  </Field>
                  <Field label="Poplatek (Kč)">
                    <input type="number" value={form.adoption_fee} onChange={e => update('adoption_fee', e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Plemeno / rasa">
                    <input value={form.breed} onChange={e => update('breed', e.target.value)} placeholder="Labrador kříženec" className={inputCls} />
                  </Field>
                  <Field label="Barva / zbarvení">
                    <input value={form.color} onChange={e => update('color', e.target.value)} placeholder="Zlatohnědý" className={inputCls} />
                  </Field>
                </div>
                <Field label="Popis pro adoptivní rodiny">
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} placeholder="Popis charakteru, potřeb..." className={`${inputCls} resize-none`} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'good_with_kids', label: '🧒 Vychází s dětmi' },
                    { key: 'good_with_dogs', label: '🐕 Vychází se psy' },
                    { key: 'good_with_cats', label: '🐈 Vychází s kočkami' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer bg-sand rounded-md p-3">
                      <input type="checkbox" checked={(form as any)[key]} onChange={e => update(key, e.target.checked)} className={checkCls} />
                      <span className="text-sm font-semibold text-espresso">{label}</span>
                    </label>
                  ))}
                </div>
                <Field label="Speciální potřeby">
                  <input value={form.special_needs} onChange={e => update('special_needs', e.target.value)} placeholder="Dieta, léky, alergie..." className={inputCls} />
                </Field>

                {/* ── Nová pole ── */}
                <div className="pt-4 border-t border-gray-pale">
                  <h3 className="font-display font-bold text-base text-espresso mb-4">Povaha a potřeby</h3>

                  {/* Bydlení */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-brown uppercase tracking-wider block mb-2">Vhodný pro</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'suitable_for_flat',  label: '🏢 Byt',          desc: 'Bez zahrady' },
                        { key: 'suitable_for_house', label: '🏡 Dům / zahrada', desc: 'Se zahradou' },
                      ].map(({ key, label, desc }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer p-3 rounded-md border-2 transition-all"
                          style={(form as any)[key] === true
                            ? { borderColor: '#E8634A', background: '#FAECE7' }
                            : { borderColor: '#F0EDE8', background: 'white' }
                          }>
                          <input type="checkbox"
                            checked={(form as any)[key] === true}
                            onChange={e => update(key, e.target.checked ? true : null)}
                            className={checkCls} />
                          <div>
                            <div className="text-sm font-bold text-espresso">{label}</div>
                            <div className="text-xs text-gray">{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* S jinými zvířaty */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-brown uppercase tracking-wider block mb-2">S jinými zvířaty</label>
                    <div className="flex gap-2">
                      {[
                        { value: true,  label: '✓ Ano' },
                        { value: false, label: '✗ Ne' },
                        { value: null,  label: '? Neznámo' },
                      ].map(({ value, label }) => (
                        <button key={String(value)} type="button"
                          onClick={() => update('good_with_other_animals', value)}
                          className="flex-1 py-2 rounded-md border-2 text-xs font-bold cursor-pointer transition-all"
                          style={form.good_with_other_animals === value
                            ? { borderColor: '#E8634A', background: '#FAECE7', color: '#993C1D' }
                            : { borderColor: '#F0EDE8', background: 'white', color: '#6B4030' }
                          }>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aktivita */}
                  <div className="mb-4">
                    <Field label="Úroveň aktivity">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'low',       label: '😴 Nízká',       desc: 'Klidná povaha' },
                          { value: 'medium',    label: '🚶 Střední',      desc: 'Denní vycházky' },
                          { value: 'high',      label: '🏃 Vysoká',       desc: 'Sport a pohyb' },
                          { value: 'very_high', label: '⚡ Velmi vysoká', desc: 'Intenzivní sport' },
                        ].map(({ value, label, desc }) => (
                          <button key={value} type="button"
                            onClick={() => update('activity_level', form.activity_level === value ? '' : value)}
                            className="text-left p-2.5 rounded-md border-2 cursor-pointer transition-all"
                            style={form.activity_level === value
                              ? { borderColor: '#E8634A', background: '#FAECE7' }
                              : { borderColor: '#F0EDE8', background: 'white' }
                            }>
                            <div className="text-xs font-bold text-espresso">{label}</div>
                            <div className="text-[10px] text-gray mt-0.5">{desc}</div>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  {/* Náročnost chovu */}
                  <div>
                    <Field label="Náročnost chovu">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'easy',      label: '⭐ Nenáročný',   desc: 'Pro začátečníky' },
                          { value: 'medium',    label: '⭐⭐ Střední',    desc: 'Mírná zkušenost' },
                          { value: 'demanding', label: '⭐⭐⭐ Náročný',  desc: 'Pro zkušené' },
                          { value: 'expert',    label: '⭐⭐⭐⭐ Expert', desc: 'Odborná péče' },
                        ].map(({ value, label, desc }) => (
                          <button key={value} type="button"
                            onClick={() => update('care_difficulty', form.care_difficulty === value ? '' : value)}
                            className="text-left p-2.5 rounded-md border-2 cursor-pointer transition-all"
                            style={form.care_difficulty === value
                              ? { borderColor: '#E8634A', background: '#FAECE7' }
                              : { borderColor: '#F0EDE8', background: 'white' }
                            }>
                            <div className="text-xs font-bold text-espresso">{label}</div>
                            <div className="text-[10px] text-gray mt-0.5">{desc}</div>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field label="Odhadovaný věk">
                  <input value={form.estimated_age} onChange={e => update('estimated_age', e.target.value)} placeholder="Dospělý, Mládě, 2 roky..." className={inputCls} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Váha (g)">
                    <input type="number" value={form.weight_g} onChange={e => update('weight_g', e.target.value)} placeholder="320" className={inputCls} />
                  </Field>
                  <Field label="Číslo kroužku / značení">
                    <input value={form.ring_number} onChange={e => update('ring_number', e.target.value)} placeholder="CZ-12345" className={inputCls} />
                  </Field>
                </div>
                <Field label="Příčina zranění / nemoci">
                  <input value={form.cause_of_injury} onChange={e => update('cause_of_injury', e.target.value)} placeholder="Střet s vozidlem" className={inputCls} />
                </Field>
                <Field label="Diagnóza">
                  <input value={form.diagnosis} onChange={e => update('diagnosis', e.target.value)} placeholder="Zlomené pravé křídlo" className={inputCls} />
                </Field>
                <Field label="Průběh léčby">
                  <textarea value={form.treatment_notes} onChange={e => update('treatment_notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Veřejný popis (web / sbírky)">
                  <textarea value={form.public_description} onChange={e => update('public_description', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Místo propuštění">
                  <input value={form.release_location} onChange={e => update('release_location', e.target.value)} placeholder="Les u Jihlavy" className={inputCls} />
                </Field>
              </>
            )}

            {/* Fotky */}
            <div className="pt-4 border-t border-gray-pale">
              <h3 className="font-display font-bold text-base text-espresso mb-3">Fotografie</h3>
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 cursor-pointer transition-all"
                        onClick={() => setPrimaryPhoto(url)}
                        style={{ borderColor: primaryPhoto === url ? 'var(--coral)' : 'transparent' }}>
                        <Image src={url} alt="" fill className="object-cover" />
                        {primaryPhoto === url && (
                          <div className="absolute inset-0 bg-coral/20 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">Hlavní</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removePhoto(url)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-coral text-white rounded-full text-xs font-bold hidden group-hover:flex items-center justify-center cursor-pointer border-none">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              <Button variant="sand" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Nahrávám...' : '📷 Přidat fotky'}
              </Button>
              {photos.length > 0 && <p className="text-xs text-gray mt-2">Klikni na fotku pro nastavení jako hlavní</p>}
            </div>
          </div>
        )}

        {/* ── TAB: Zdraví ── */}
        {tab === 'health' && (
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm space-y-4">
            <h2 className="font-display font-extrabold text-xl text-espresso">Zdravotní záznamy</h2>
            <Field label="Zdravotní stav">
              <select value={form.health_status} onChange={e => update('health_status', e.target.value)} className={inputCls}>
                {Object.entries(HEALTH_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            {isShelter && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'vaccinated',   label: '💉 Očkovaný' },
                  { key: 'neutered',     label: '✂️ Kastrovaný' },
                  { key: 'microchipped', label: '📡 Čipovaný' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer bg-sand rounded-md p-3">
                    <input type="checkbox" checked={(form as any)[key]} onChange={e => update(key, e.target.checked)} className={checkCls} />
                    <span className="text-sm font-semibold text-espresso">{label}</span>
                  </label>
                ))}
              </div>
            )}
            {isShelter && form.microchipped && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Číslo čipu">
                  <input value={form.chip_number} onChange={e => update('chip_number', e.target.value)} placeholder="900182000123456" className={inputCls} />
                </Field>
                <Field label="Datum čipování">
                  <input type="date" value={form.chip_date} onChange={e => update('chip_date', e.target.value)} className={inputCls} />
                </Field>
              </div>
            )}
            {isShelter && (
              <Field label="Číslo pasu">
                <input value={form.passport_number} onChange={e => update('passport_number', e.target.value)} placeholder="CZ123456789" className={inputCls} />
              </Field>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ošetřující veterinář">
                <input value={form.vet_name} onChange={e => update('vet_name', e.target.value)} placeholder="MVDr. Novák" className={inputCls} />
              </Field>
              <Field label="Telefon na veterináře">
                <input value={form.vet_phone} onChange={e => update('vet_phone', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Poslední veterinární návštěva">
              <input type="date" value={form.last_vet_visit} onChange={e => update('last_vet_visit', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Aktuální léky">
              <input value={form.medications} onChange={e => update('medications', e.target.value)} placeholder="Antibiotika 2× denně..." className={inputCls} />
            </Field>
            <Field label="Zdravotní poznámky">
              <textarea value={form.medical_notes} onChange={e => update('medical_notes', e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </Field>
            <div className="pt-3 border-t border-gray-pale">
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={form.in_quarantine} onChange={e => update('in_quarantine', e.target.checked)} className={checkCls} />
                <span className="font-display font-bold text-base text-espresso">🚧 V karanténě / izolaci</span>
              </label>
              {form.in_quarantine && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-light/50 rounded-md p-4">
                  <Field label="Karanténa do">
                    <input type="date" value={form.quarantine_until} onChange={e => update('quarantine_until', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Důvod karantény">
                    <input value={form.quarantine_reason} onChange={e => update('quarantine_reason', e.target.value)} placeholder="Nové zvíře, nemoc..." className={inputCls} />
                  </Field>
                </div>
              )}
            </div>
            {isShelter && (
              <div className="pt-3 border-t border-gray-pale">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.in_foster} onChange={e => update('in_foster', e.target.checked)} className={checkCls} />
                  <span className="font-display font-bold text-base text-espresso">🏠 Ve foster péči</span>
                </label>
                {form.in_foster && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-rescue-bg/50 rounded-md p-4">
                    <Field label="Jméno foster rodiny">
                      <input value={form.foster_name} onChange={e => update('foster_name', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Telefon">
                      <input value={form.foster_phone} onChange={e => update('foster_phone', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Foster od">
                      <input type="date" value={form.foster_since} onChange={e => update('foster_since', e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Původ ── */}
        {tab === 'origin' && (
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm space-y-4">
            <h2 className="font-display font-extrabold text-xl text-espresso">Původ a příjem</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Datum příjmu">
                <input type="date" value={form.intake_date} onChange={e => update('intake_date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Důvod příjmu">
                <select value={form.intake_reason} onChange={e => update('intake_reason', e.target.value)} className={inputCls}>
                  <option value="">Vybrat...</option>
                  {Object.entries(INTAKE_REASON_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Poznámky k příjmu">
              <textarea value={form.intake_notes} onChange={e => update('intake_notes', e.target.value)} rows={3} placeholder="Okolnosti příjmu, stav zvířete..." className={`${inputCls} resize-none`} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Místo nálezu">
                <input value={form.found_location} onChange={e => update('found_location', e.target.value)} placeholder="Ulice, město..." className={inputCls} />
              </Field>
              <Field label="Datum nálezu">
                <input type="date" value={form.found_date} onChange={e => update('found_date', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="pt-3 border-t border-gray-pale">
              <h3 className="font-display font-bold text-base text-espresso mb-3">Nalézatel / předávající</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Jméno">
                  <input value={form.finder_name} onChange={e => update('finder_name', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Telefon">
                  <input value={form.finder_phone} onChange={e => update('finder_phone', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
            {isShelter && (
              <div className="pt-3 border-t border-gray-pale">
                <h3 className="font-display font-bold text-base text-espresso mb-3">Předchozí majitel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Jméno">
                    <input value={form.previous_owner} onChange={e => update('previous_owner', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Telefon">
                    <input value={form.previous_owner_phone} onChange={e => update('previous_owner_phone', e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Interní ── */}
        {tab === 'internal' && (
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm space-y-4">
            <h2 className="font-display font-extrabold text-xl text-espresso">🔒 Interní záznamy</h2>
            <p className="text-xs text-gray bg-amber-light rounded-md px-3 py-2">
              ⚠️ Tyto informace se nezobrazují na veřejném webu ani adoptivním rodinám.
            </p>
            <Field label="Interní poznámky">
              <textarea value={form.internal_notes} onChange={e => update('internal_notes', e.target.value)} rows={6}
                placeholder="Poznámky pouze pro štáb, behaviorální záznamy, zvláštní požadavky..." className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Zodpovědný pracovník">
              <input value={form.staff_assigned} onChange={e => update('staff_assigned', e.target.value)} placeholder="Jana Nováková" className={inputCls} />
            </Field>
          </div>
        )}

        {/* ── TAB: Historie ── */}
        {tab === 'history' && (
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-xl text-espresso mb-5">📋 Historie změn</h2>
            {localHistory.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray text-sm">Zatím žádné změny — uložení záznamu se zapíše do historie</p>
              </div>
            ) : (
              <div className="space-y-3">
                {localHistory.map((h: any, i: number) => {
                  const labelMap = isShelter ? ADOPTION_STATUS_LABEL : RESCUE_STATUS_LABEL
                  const isStatusChange = h.action === 'status_change' || (h.old_status && h.old_status !== h.new_status)
                  const isCreate = h.action === 'create'
                  return (
                    <div key={h.id ?? i} className={`flex items-start gap-3 p-3 rounded-md border
                      ${isCreate ? 'bg-success-bg border-success/20' : isStatusChange ? 'bg-coral-light border-coral/20' : 'bg-sand border-gray-pale'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5
                        ${isCreate ? 'bg-success' : isStatusChange ? 'bg-coral' : 'bg-gray'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-body text-xs font-bold text-espresso">
                            {actionLabel[h.action ?? (isStatusChange ? 'status_change' : 'update')] ?? '✏️ Aktualizace'}
                          </span>
                          {isStatusChange && h.old_status && (
                            <span className="text-xs text-gray">
                              {labelMap[h.old_status] ?? h.old_status}
                              {' → '}
                              <strong className="text-espresso">{labelMap[h.new_status] ?? h.new_status}</strong>
                            </span>
                          )}
                        </div>
                        {h.note && (
                          <p className="text-xs text-brown-mid bg-white/70 rounded px-2 py-1 mt-1">
                            💬 {h.note}
                          </p>
                        )}
                        <p className="text-[11px] text-gray mt-1">
                          {new Date(h.changed_at).toLocaleString('cs-CZ', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pravý panel */}
      <div className="space-y-5">

        {/* Stav */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-espresso mb-4">Stav</h3>
          {isShelter ? (
            <div className="space-y-3">
              <Field label="Stav adopce">
                <select value={form.adoption_status} onChange={e => update('adoption_status', e.target.value)} className={inputCls}>
                  {Object.entries(ADOPTION_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.urgent} onChange={e => update('urgent', e.target.checked)} className={checkCls} />
                <span className="text-sm font-bold text-coral">🆘 Urgentní adopce</span>
              </label>
            </div>
          ) : (
            <Field label="Stav léčby">
              <select value={form.status} onChange={e => update('status', e.target.value)} className={inputCls}>
                {Object.entries(RESCUE_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          )}
          <label className="flex items-center gap-3 cursor-pointer mt-3">
            <input type="checkbox" checked={form.published} onChange={e => update('published', e.target.checked)} className={checkCls} />
            <span className="text-sm font-semibold text-espresso">Zveřejněno na webu</span>
          </label>
        </div>

        {/* Poznámka ke změně — vždy viditelná */}
        <div className="bg-amber-light/60 rounded-lg p-4 border border-amber/20">
          <h3 className="font-display font-bold text-sm text-espresso mb-2">
            💬 Poznámka k tomuto uložení
          </h3>
          <textarea
            value={changeNote}
            onChange={e => setChangeNote(e.target.value)}
            placeholder="Proč se tato změna provádí? (zapíše se do historie)"
            rows={3}
            className={`${inputCls} resize-none text-xs`}
          />
        </div>

        {/* PDF karta */}
        {mode === 'edit' && (
          <div className="bg-sand rounded-lg p-4">
            <h3 className="font-display font-bold text-sm text-espresso mb-2 uppercase tracking-wider">Karta zvířete</h3>
            <a href={`/admin/animals/${animal?.id}/pdf`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-espresso text-white font-display font-bold text-sm rounded-sm hover:bg-brown transition-colors no-underline">
              📄 Stáhnout PDF kartu
            </a>
          </div>
        )}

        {/* Chyba / úspěch */}
        {error && (
          <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">⚠️ {error}</div>
        )}
        {success && (
          <div className="bg-success-bg text-success text-sm font-semibold px-4 py-3 rounded-sm">
            ✓ Uloženo! Zůstáváte na záznamu.
          </div>
        )}

        <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleSubmit}>
          {mode === 'create' ? '✓ Vytvořit záznam' : '✓ Uložit změny'}
        </Button>

        {mode === 'edit' && (
          <button onClick={async () => {
            if (!confirm('Opravdu smazat?')) return
            const table = isShelter ? 'animals' : 'rescue_cases'
            await fetch(`/api/${table}/${animal.id}`, { method: 'DELETE' })
            router.push('/admin/animals')
          }}
            className="w-full py-2.5 text-sm text-gray hover:text-coral transition-colors font-semibold cursor-pointer bg-transparent border-none">
            🗑 Smazat záznam
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-brown uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
