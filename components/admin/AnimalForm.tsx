'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Species { id: string; name_cs: string }
interface StatusHistoryEntry { status: string; changed_at: string; note?: string; changed_by?: string }

interface AnimalFormProps {
  institutionId: string
  institutionType: 'shelter' | 'rescue_station'
  species: Species[]
  mode: 'create' | 'edit'
  initialData?: Record<string, unknown>
  animal?: Record<string, unknown>
  statusHistory?: StatusHistoryEntry[]
  currentUser?: { id: string; name: string }
}

type Tab = 'basic' | 'health' | 'behavior' | 'photos' | 'rescue'

interface PendingPhoto { file: File; preview: string }

// ── Constants ──────────────────────────────────────────────────────────────────
const ADOPTION_STATUS_OPTIONS = [
  { value: 'available',       label: 'Dostupný k adopci' },
  { value: 'reserved',        label: 'Rezervován' },
  { value: 'adopted',         label: 'Adoptován' },
  { value: 'foster',          label: 'Ve foster péči' },
  { value: 'intake',          label: 'V příjmu' },
  { value: 'treatment',       label: 'V léčbě' },
  { value: 'rehabilitation',  label: 'V rehabilitaci' },
  { value: 'released',        label: 'Vypuštěn' },
  { value: 'deceased',        label: 'Uhynul' },
]

const RESCUE_STATUS_OPTIONS = [
  { value: 'intake',          label: 'V příjmu' },
  { value: 'treatment',       label: 'V léčbě' },
  { value: 'rehabilitation',  label: 'V rehabilitaci' },
  { value: 'released',        label: 'Vypuštěn' },
  { value: 'available',       label: 'K adopci' },
  { value: 'deceased',        label: 'Uhynul' },
]

const HEALTH_STATUS_OPTIONS = [
  { value: 'healthy',         label: 'Zdravý' },
  { value: 'in_treatment',    label: 'V léčbě' },
  { value: 'post_surgery',    label: 'Po operaci' },
  { value: 'chronic',         label: 'Chronické onemocnění' },
  { value: 'unknown',         label: 'Neznámý' },
]

const ORIGIN_OPTIONS = [
  { value: 'municipal_capture', label: 'Odchyt' },
  { value: 'seized',            label: 'Odebrání z péče' },
  { value: 'found',             label: 'Nalezeno' },
  { value: 'surrendered',       label: 'Odevzdáno majitelem' },
  { value: 'transferred',       label: 'Převedeno z jiného útulku' },
  { value: 'other',             label: 'Jiné' },
]

const GOOD_WITH_OPTIONS = [
  { value: 'yes',   label: 'Ano' },
  { value: 'no',    label: 'Ne' },
  { value: 'unknown', label: 'Nevím' },
]

const GOOD_WITH_ADULTS_OPTIONS = [
  { value: 'friendly',    label: 'Přátelský' },
  { value: 'shy',         label: 'Plaší' },
  { value: 'fearful',     label: 'Bázlivý' },
  { value: 'distrustful', label: 'Nedůvěřivý' },
  { value: 'unknown',     label: 'Nevím' },
]

const RESCUE_PROGNOSIS_OPTIONS = [
  { value: 'release',            label: 'Vypuštění do přírody' },
  { value: 'permanent_handicap', label: 'Trvalý handicap' },
  { value: 'unknown',            label: 'Neznámá' },
]

const SIZE_OPTIONS = [
  { value: 'small',   label: 'Malé (< 10 kg)' },
  { value: 'medium',  label: 'Střední (10–25 kg)' },
  { value: 'large',   label: 'Velké (25–45 kg)' },
  { value: 'xlarge',  label: 'Obří (> 45 kg)' },
]

// ── Helper components ──────────────────────────────────────────────────────────
function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#3D2010] mb-1">
        {label}{required && <span className="text-[#E8634A] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[#8B6550] mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#E8634A]' : 'bg-[#D5CFC8]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm text-[#3D2010]">{label}</span>
    </label>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#E0DDD8] bg-white text-sm text-[#1A0F0A] focus:outline-none focus:border-[#E8634A] focus:ring-1 focus:ring-[#E8634A]'
const selectCls = inputCls + ' appearance-none'
const textareaCls = inputCls + ' resize-y min-h-[80px]'

// ── initFormData ───────────────────────────────────────────────────────────────
function initFormData(data?: Record<string, unknown>) {
  const d = data ?? {}
  return {
    name:                    String(d.name ?? ''),
    species_id:              String(d.species_id ?? ''),
    sex:                     String(d.sex ?? ''),
    birth_year:              d.birth_year != null ? String(d.birth_year) : '',
    age_months:              d.age_months != null ? String(d.age_months) : '',
    breed:                   String(d.breed ?? ''),
    color:                   String(d.color ?? ''),
    size:                    String(d.size ?? ''),
    weight_kg:               d.weight_kg != null ? String(d.weight_kg) : '',
    intake_date:             String(d.intake_date ?? new Date().toISOString().slice(0, 10)),
    origin:                  String(d.origin ?? ''),
    adoption_status:         String(d.adoption_status ?? 'intake'),
    health_status:           String(d.health_status ?? 'unknown'),
    vaccinated:              Boolean(d.vaccinated),
    neutered:                Boolean(d.neutered),
    microchipped:            Boolean(d.microchipped),
    chip_number:             String(d.chip_number ?? ''),
    chip_date:               String(d.chip_date ?? ''),
    passport_number:         String(d.passport_number ?? ''),
    in_quarantine:           Boolean(d.in_quarantine),
    quarantine_until:        String(d.quarantine_until ?? ''),
    quarantine_reason:       String(d.quarantine_reason ?? ''),
    medications:             String(d.medications ?? ''),
    medical_notes:           String(d.medical_notes ?? ''),
    vet_name:                String(d.vet_name ?? ''),
    vet_phone:               String(d.vet_phone ?? ''),
    last_vet_visit:          String(d.last_vet_visit ?? ''),
    good_with_kids:          String(d.good_with_kids ?? 'unknown'),
    good_with_dogs:          String(d.good_with_dogs ?? 'unknown'),
    good_with_cats:          String(d.good_with_cats ?? 'unknown'),
    good_with_other_animals: String(d.good_with_other_animals ?? 'unknown'),
    good_with_adults:        String(d.good_with_adults ?? 'unknown'),
    activity_level:          String(d.activity_level ?? ''),
    care_difficulty:         String(d.care_difficulty ?? ''),
    special_needs:           Boolean(d.special_needs),
    suitable_for_flat:       d.suitable_for_flat !== undefined ? Boolean(d.suitable_for_flat) : true,
    suitable_for_house:      d.suitable_for_house !== undefined ? Boolean(d.suitable_for_house) : true,
    urgent:                  Boolean(d.urgent),
    adoption_fee:            d.adoption_fee != null ? String(d.adoption_fee) : '',
    story:                   String(d.story ?? ''),
    adopter_requirements:    String(d.adopter_requirements ?? ''),
    description:             String(d.description ?? ''),
    internal_notes:          String(d.internal_notes ?? ''),
    found_location:          String(d.found_location ?? ''),
    found_date:              String(d.found_date ?? ''),
    rescue_find_type:        String(d.rescue_find_type ?? ''),
    rescue_prognosis:        String(d.rescue_prognosis ?? 'unknown'),
    rescue_public_description: String(d.rescue_public_description ?? ''),
    published:               Boolean(d.published),
  }
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AnimalForm({
  institutionId,
  institutionType,
  species,
  mode,
  initialData,
  animal,
}: AnimalFormProps) {
  const router   = useRouter()
  const isShelter = institutionType === 'shelter'
  const sourceData = initialData ?? animal

  const [form, setForm] = useState(() => initFormData(sourceData))
  const [activeTab, setActiveTab]     = useState<Tab>('basic')
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)
  const [errors, setErrors]           = useState<Record<string, string>>({})

  // Photos
  const [pendingPhotos, setPendingPhotos]   = useState<PendingPhoto[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    Array.isArray(sourceData?.photos) ? (sourceData.photos as string[]) : []
  )
  const [removedPhotos, setRemovedPhotos]   = useState<string[]>([])
  const [primaryIdx, setPrimaryIdx]         = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const animalId = sourceData?.id as string | undefined

  const set = useCallback((field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Photo handlers ─────────────────────────────────────────────────────────
  function handleFileDrop(files: FileList | null) {
    if (!files) return
    const newPhotos: PendingPhoto[] = []
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue
      if (f.size > 8 * 1024 * 1024) { showToast(`Soubor ${f.name} je příliš velký (max 8 MB)`, false); continue }
      newPhotos.push({ file: f, preview: URL.createObjectURL(f) })
    }
    setPendingPhotos(prev => [...prev, ...newPhotos])
  }

  function removeExisting(url: string) {
    setExistingPhotos(prev => prev.filter(u => u !== url))
    setRemovedPhotos(prev => [...prev, url])
    if (primaryIdx >= existingPhotos.length - 1) setPrimaryIdx(0)
  }

  function removePending(idx: number) {
    setPendingPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function uploadPendingPhotos(aid: string): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (const p of pendingPhotos) {
      const ext  = p.file.name.split('.').pop() ?? 'jpg'
      const path = `${institutionId}/${aid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('animal-photos').upload(path, p.file, { upsert: false })
      if (error) { showToast(`Chyba uploadu: ${p.file.name}`, false); continue }
      const { data } = supabase.storage.from('animal-photos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(publish: boolean) {
    const errs: Record<string, string> = {}
    if (!form.name.trim())       errs.name        = 'Jméno je povinné'
    if (!form.species_id)        errs.species_id  = 'Druh je povinný'
    if (!form.sex)               errs.sex         = 'Pohlaví je povinné'
    if (!form.adoption_status)   errs.adoption_status = 'Stav je povinný'
    if (!form.intake_date)       errs.intake_date = 'Datum příjmu je povinné'
    if (publish && existingPhotos.length === 0 && pendingPhotos.length === 0) {
      errs.photos = 'Pro zveřejnění je potřeba alespoň jedna fotka'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(publish: boolean) {
    if (!validate(publish)) {
      showToast('Oprav chyby ve formuláři', false)
      setActiveTab('basic')
      return
    }
    setSaving(true)
    try {
      // Build payload
      const payload: Record<string, unknown> = {
        name:              form.name.trim(),
        species_id:        form.species_id,
        sex:               form.sex,
        birth_year:        form.birth_year ? parseInt(form.birth_year) : null,
        age_months:        form.age_months ? parseInt(form.age_months) : null,
        breed:             form.breed || null,
        color:             form.color || null,
        size:              form.size || null,
        weight_kg:         form.weight_kg ? parseFloat(form.weight_kg) : null,
        intake_date:       form.intake_date || null,
        origin:            form.origin || null,
        adoption_status:   form.adoption_status,
        health_status:     form.health_status,
        vaccinated:        form.vaccinated,
        neutered:          form.neutered,
        microchipped:      form.microchipped,
        chip_number:       form.chip_number || null,
        chip_date:         form.chip_date || null,
        passport_number:   form.passport_number || null,
        in_quarantine:     form.in_quarantine,
        quarantine_until:  form.quarantine_until || null,
        quarantine_reason: form.quarantine_reason || null,
        medications:       form.medications || null,
        medical_notes:     form.medical_notes || null,
        vet_name:          form.vet_name || null,
        vet_phone:         form.vet_phone || null,
        last_vet_visit:    form.last_vet_visit || null,
        good_with_kids:    form.good_with_kids || null,
        good_with_dogs:    form.good_with_dogs || null,
        good_with_cats:    form.good_with_cats || null,
        good_with_other_animals: form.good_with_other_animals || null,
        good_with_adults:  form.good_with_adults || null,
        activity_level:    form.activity_level || null,
        care_difficulty:   form.care_difficulty || null,
        special_needs:     form.special_needs,
        suitable_for_flat: form.suitable_for_flat,
        suitable_for_house: form.suitable_for_house,
        urgent:            form.urgent,
        adoption_fee:      form.adoption_fee ? parseInt(form.adoption_fee) : null,
        story:             form.story || null,
        adopter_requirements: form.adopter_requirements || null,
        description:       form.description || null,
        internal_notes:    form.internal_notes || null,
        found_location:    form.found_location || null,
        found_date:        form.found_date || null,
        rescue_find_type:  form.rescue_find_type || null,
        rescue_prognosis:  form.rescue_prognosis || null,
        rescue_public_description: form.rescue_public_description || null,
        published:         publish,
      }

      let savedId = animalId

      if (mode === 'create') {
        const res = await fetch('/api/animals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, institution_id: institutionId }),
        })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        savedId = json.id
      } else {
        const res = await fetch(`/api/animals/${animalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(await res.text())
      }

      // Upload new photos
      if (pendingPhotos.length > 0 && savedId) {
        const newUrls = await uploadPendingPhotos(savedId)
        const allPhotos = [...existingPhotos, ...newUrls]
        const primary   = allPhotos[primaryIdx] ?? allPhotos[0] ?? null
        await fetch(`/api/animals/${savedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos: allPhotos, primary_photo: primary }),
        })
      } else if (savedId) {
        const primary = existingPhotos[primaryIdx] ?? existingPhotos[0] ?? null
        if (existingPhotos.length > 0 || removedPhotos.length > 0) {
          await fetch(`/api/animals/${savedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photos: existingPhotos, primary_photo: primary }),
          })
        }
      }

      showToast(publish ? 'Uloženo a zveřejněno' : 'Uloženo jako draft')
      setTimeout(() => router.push('/admin/animals'), 1200)
    } catch (err) {
      showToast(`Chyba: ${err instanceof Error ? err.message : 'Neznámá chyba'}`, false)
    } finally {
      setSaving(false)
    }
  }

  // ── Tabs config ────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: 'basic',    label: '📋 Základní údaje' },
    { id: 'health',   label: '🏥 Zdraví' },
    ...(isShelter ? [{ id: 'behavior' as Tab, label: '🐾 Chování' }] : []),
    { id: 'photos',   label: '📷 Fotky' },
    ...(!isShelter ? [{ id: 'rescue' as Tab, label: '🦉 Záchrana' }] : []),
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-0">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.ok ? 'bg-[#2D7A4F]' : 'bg-[#C0392B]'}`}>
          {toast.msg}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[#E0DDD8] mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
              activeTab === t.id
                ? 'border-[#E8634A] text-[#E8634A] bg-[#FFF5F2]'
                : 'border-transparent text-[#6B4030] hover:text-[#E8634A] hover:bg-[#FFF5F2]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="flex-1 pb-24">

        {/* ── BASIC ── */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Jméno" required>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Např. Azor" />
              {errors.name && <p className="text-xs text-[#E8634A] mt-1">{errors.name}</p>}
            </Field>

            <Field label="Druh" required>
              <select className={selectCls} value={form.species_id} onChange={e => set('species_id', e.target.value)}>
                <option value="">— vyberte druh —</option>
                {species.map(s => <option key={s.id} value={s.id}>{s.name_cs}</option>)}
              </select>
              {errors.species_id && <p className="text-xs text-[#E8634A] mt-1">{errors.species_id}</p>}
            </Field>

            <Field label="Pohlaví" required>
              <select className={selectCls} value={form.sex} onChange={e => set('sex', e.target.value)}>
                <option value="">— vyberte —</option>
                <option value="male">Samec</option>
                <option value="female">Samice</option>
                <option value="unknown">Neznámé</option>
              </select>
              {errors.sex && <p className="text-xs text-[#E8634A] mt-1">{errors.sex}</p>}
            </Field>

            <Field label="Stav" required>
              <select className={selectCls} value={form.adoption_status} onChange={e => set('adoption_status', e.target.value)}>
                {(isShelter ? ADOPTION_STATUS_OPTIONS : RESCUE_STATUS_OPTIONS).map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.adoption_status && <p className="text-xs text-[#E8634A] mt-1">{errors.adoption_status}</p>}
            </Field>

            <Field label="Datum příjmu" required>
              <input type="date" className={inputCls} value={form.intake_date} onChange={e => set('intake_date', e.target.value)} />
              {errors.intake_date && <p className="text-xs text-[#E8634A] mt-1">{errors.intake_date}</p>}
            </Field>

            <Field label="Původ">
              <select className={selectCls} value={form.origin} onChange={e => set('origin', e.target.value)}>
                <option value="">— vyberte původ —</option>
                {ORIGIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Rok narození" hint="Zadej celý rok (např. 2021)">
              <input type="number" className={inputCls} value={form.birth_year} onChange={e => set('birth_year', e.target.value)} placeholder="2021" min="2000" max={new Date().getFullYear()} />
            </Field>

            <Field label="Věk v měsících" hint="Pro mláďata mladší 1 roku">
              <input type="number" className={inputCls} value={form.age_months} onChange={e => set('age_months', e.target.value)} placeholder="4" min="0" max="11" />
            </Field>

            <Field label="Plemeno / rasa">
              <input className={inputCls} value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="Např. Labrador" />
            </Field>

            <Field label="Barva / zbarvení">
              <input className={inputCls} value={form.color} onChange={e => set('color', e.target.value)} placeholder="Např. hnědá s bílou" />
            </Field>

            <Field label="Velikost">
              <select className={selectCls} value={form.size} onChange={e => set('size', e.target.value)}>
                <option value="">— vyberte —</option>
                {SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Hmotnost (kg)">
              <input type="number" className={inputCls} value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="12.5" step="0.1" min="0" />
            </Field>

            {isShelter && (
              <Field label="Poplatek za adopci (Kč)" hint="0 = bez poplatku">
                <input type="number" className={inputCls} value={form.adoption_fee} onChange={e => set('adoption_fee', e.target.value)} placeholder="0" min="0" />
              </Field>
            )}

            <Field label="Místo nálezu">
              <input className={inputCls} value={form.found_location} onChange={e => set('found_location', e.target.value)} placeholder="Např. Praha 5" />
            </Field>

            <Field label="Datum nálezu">
              <input type="date" className={inputCls} value={form.found_date} onChange={e => set('found_date', e.target.value)} />
            </Field>

            <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
              {isShelter && (
                <Toggle checked={form.urgent} onChange={v => set('urgent', v)} label="Urgentní adopce" />
              )}
            </div>
          </div>
        )}

        {/* ── HEALTH ── */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Zdravotní stav">
              <select className={selectCls} value={form.health_status} onChange={e => set('health_status', e.target.value)}>
                {HEALTH_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <div className="flex flex-wrap gap-6 items-end">
              <Toggle checked={form.vaccinated}   onChange={v => set('vaccinated', v)}   label="Očkováno" />
              <Toggle checked={form.neutered}     onChange={v => set('neutered', v)}     label="Kastrováno" />
              <Toggle checked={form.microchipped} onChange={v => set('microchipped', v)} label="Čipováno" />
            </div>

            {form.microchipped && (
              <>
                <Field label="Číslo čipu">
                  <input className={inputCls} value={form.chip_number} onChange={e => set('chip_number', e.target.value)} placeholder="985..." />
                </Field>
                <Field label="Datum čipování">
                  <input type="date" className={inputCls} value={form.chip_date} onChange={e => set('chip_date', e.target.value)} />
                </Field>
              </>
            )}

            <Field label="Číslo pasu">
              <input className={inputCls} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} />
            </Field>

            <div className="md:col-span-2">
              <Toggle checked={form.in_quarantine} onChange={v => set('in_quarantine', v)} label="V karanténě" />
            </div>

            {form.in_quarantine && (
              <>
                <Field label="Karanténa do">
                  <input type="date" className={inputCls} value={form.quarantine_until} onChange={e => set('quarantine_until', e.target.value)} />
                </Field>
                <Field label="Důvod karantény">
                  <input className={inputCls} value={form.quarantine_reason} onChange={e => set('quarantine_reason', e.target.value)} />
                </Field>
              </>
            )}

            <Field label="Léky">
              <input className={inputCls} value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="Název léku, dávkování..." />
            </Field>

            <Field label="Veterinář">
              <input className={inputCls} value={form.vet_name} onChange={e => set('vet_name', e.target.value)} placeholder="MVDr. Novák" />
            </Field>

            <Field label="Telefon na veterináře">
              <input type="tel" className={inputCls} value={form.vet_phone} onChange={e => set('vet_phone', e.target.value)} placeholder="+420..." />
            </Field>

            <Field label="Poslední návštěva u veterináře">
              <input type="date" className={inputCls} value={form.last_vet_visit} onChange={e => set('last_vet_visit', e.target.value)} />
            </Field>

            <Field label="Zdravotní poznámky" hint="Diagnózy, průběh léčby, alergie...">
              <textarea className={textareaCls} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} />
            </Field>

            <Field label="Interní poznámky" hint="Vidí jen tým útulku">
              <textarea className={textareaCls} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
            </Field>
          </div>
        )}

        {/* ── BEHAVIOR (shelter only) ── */}
        {activeTab === 'behavior' && isShelter && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Vychází s dětmi">
              <select className={selectCls} value={form.good_with_kids} onChange={e => set('good_with_kids', e.target.value)}>
                {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Vychází se psy">
              <select className={selectCls} value={form.good_with_dogs} onChange={e => set('good_with_dogs', e.target.value)}>
                {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Vychází s kočkami">
              <select className={selectCls} value={form.good_with_cats} onChange={e => set('good_with_cats', e.target.value)}>
                {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Vychází s jinými zvířaty">
              <select className={selectCls} value={form.good_with_other_animals} onChange={e => set('good_with_other_animals', e.target.value)}>
                {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Vztah k cizím dospělým">
              <select className={selectCls} value={form.good_with_adults} onChange={e => set('good_with_adults', e.target.value)}>
                {GOOD_WITH_ADULTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Úroveň aktivity">
              <select className={selectCls} value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
                <option value="">— vyberte —</option>
                <option value="low">Klidný</option>
                <option value="medium">Středně aktivní</option>
                <option value="high">Velmi aktivní</option>
              </select>
            </Field>

            <Field label="Náročnost péče">
              <select className={selectCls} value={form.care_difficulty} onChange={e => set('care_difficulty', e.target.value)}>
                <option value="">— vyberte —</option>
                <option value="easy">Snadná</option>
                <option value="medium">Střední</option>
                <option value="hard">Náročná</option>
              </select>
            </Field>

            <div className="flex flex-wrap gap-6 items-end pt-2">
              <Toggle checked={form.special_needs}     onChange={v => set('special_needs', v)}     label="Speciální potřeby" />
              <Toggle checked={form.suitable_for_flat} onChange={v => set('suitable_for_flat', v)} label="Vhodný do bytu" />
              <Toggle checked={form.suitable_for_house} onChange={v => set('suitable_for_house', v)} label="Vhodný do domu" />
            </div>

            <Field label="Příběh zvířete" hint="Zobrazí se návštěvníkům webu">
              <textarea className={textareaCls + ' min-h-[120px]'} value={form.story} onChange={e => set('story', e.target.value)} placeholder="Napiš krátký příběh Azora..." />
            </Field>

            <Field label="Požadavky na adoptéra" hint="Co by měl budoucí adoptér splňovat">
              <textarea className={textareaCls} value={form.adopter_requirements} onChange={e => set('adopter_requirements', e.target.value)} placeholder="Např. dům se zahradou, bez malých dětí..." />
            </Field>

            <Field label="Popis (volný text)" hint="Doplňkový popis na profilu zvířete">
              <textarea className={textareaCls + ' min-h-[100px]'} value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>
          </div>
        )}

        {/* ── PHOTOS ── */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            {errors.photos && (
              <div className="px-4 py-3 rounded-lg bg-[#FAECE7] text-[#993C1D] text-sm font-semibold">
                {errors.photos}
              </div>
            )}

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileDrop(e.dataTransfer.files) }}
              className="border-2 border-dashed border-[#D5CFC8] rounded-2xl p-10 text-center cursor-pointer hover:border-[#E8634A] hover:bg-[#FFF5F2] transition-colors"
            >
              <div className="text-4xl mb-3">📸</div>
              <p className="font-semibold text-[#3D2010] mb-1">Přetáhni fotky sem nebo klikni pro výběr</p>
              <p className="text-sm text-[#8B6550]">JPG, PNG, WebP • Max 8 MB • Doporučeno min. 800×600 px</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileDrop(e.target.files)} />
            </div>

            {/* Photo grid */}
            {(existingPhotos.length > 0 || pendingPhotos.length > 0) && (
              <div>
                <p className="text-sm font-semibold text-[#3D2010] mb-3">
                  Fotky ({existingPhotos.length + pendingPhotos.length}) — klikni na hvězdu pro nastavení hlavní fotky
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingPhotos.map((url, i) => (
                    <div key={url} className="relative group rounded-xl overflow-hidden aspect-square">
                      <Image src={url} alt="" fill className="object-cover" sizes="200px" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <button
                        type="button"
                        onClick={() => setPrimaryIdx(i)}
                        className={`absolute top-2 left-2 text-xl leading-none ${i === primaryIdx ? 'text-yellow-400' : 'text-white/60 hover:text-yellow-400'}`}
                        title="Nastavit jako hlavní fotku"
                      >★</button>
                      <button
                        type="button"
                        onClick={() => removeExisting(url)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm hidden group-hover:flex items-center justify-center hover:bg-[#E8634A]"
                      >✕</button>
                      {i === primaryIdx && (
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">Hlavní</span>
                      )}
                    </div>
                  ))}
                  {pendingPhotos.map((p, i) => {
                    const globalIdx = existingPhotos.length + i
                    return (
                      <div key={p.preview} className="relative group rounded-xl overflow-hidden aspect-square">
                        <Image src={p.preview} alt="" fill className="object-cover" sizes="200px" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold bg-[#E8634A]/90 text-white px-2 py-0.5 rounded-full">Nová</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrimaryIdx(globalIdx)}
                          className={`absolute top-2 left-2 text-xl leading-none ${globalIdx === primaryIdx ? 'text-yellow-400' : 'text-white/60 hover:text-yellow-400'}`}
                        >★</button>
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm hidden group-hover:flex items-center justify-center hover:bg-[#E8634A]"
                        >✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESCUE (rescue_station only) ── */}
        {activeTab === 'rescue' && !isShelter && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Druh nálezu" hint="Jak bylo zvíře nalezeno">
              <input className={inputCls} value={form.rescue_find_type} onChange={e => set('rescue_find_type', e.target.value)} placeholder="Např. střet s vozidlem, nalezeno vypadlé z hnízda..." />
            </Field>

            <Field label="Prognóza">
              <select className={selectCls} value={form.rescue_prognosis} onChange={e => set('rescue_prognosis', e.target.value)}>
                {RESCUE_PROGNOSIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Veřejný popis případu" hint="Zobrazí se na profilu zvířete — popiš záchranný příběh">
              <textarea className={textareaCls + ' min-h-[120px] md:col-span-2'} value={form.rescue_public_description} onChange={e => set('rescue_public_description', e.target.value)} placeholder="Sova byla nalezena..." />
            </Field>

            <Field label="Vztah k lidem" hint="Chování vůči personálu a návštěvníkům">
              <select className={selectCls} value={form.good_with_adults} onChange={e => set('good_with_adults', e.target.value)}>
                {GOOD_WITH_ADULTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Zdravotní poznámky" hint="Diagnóza, léčba, průběh">
              <textarea className={textareaCls} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} />
            </Field>

            <Field label="Interní poznámky">
              <textarea className={textareaCls} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-[#E0DDD8] px-4 py-3 flex items-center justify-between gap-3 md:left-64">
        <button
          type="button"
          onClick={() => router.push('/admin/animals')}
          className="text-sm font-semibold text-[#6B4030] hover:text-[#3D2010] transition-colors"
        >
          ← Zpět
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(false)}
            className="px-5 py-2.5 rounded-xl border border-[#D5CFC8] bg-white text-sm font-semibold text-[#3D2010] hover:bg-[#F5F2EF] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Ukládám…' : 'Uložit jako draft'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(true)}
            className="px-5 py-2.5 rounded-xl bg-[#E8634A] text-white text-sm font-semibold hover:bg-[#D4512F] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Ukládám…' : '✓ Uložit a zveřejnit'}
          </button>
        </div>
      </div>
    </div>
  )
}
