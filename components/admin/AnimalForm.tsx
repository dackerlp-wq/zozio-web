'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Species { id: string; name_cs: string }

interface AnimalFormProps {
  institutionId: string
  institutionType: 'shelter' | 'rescue_station'
  species: Species[]
  mode: 'create' | 'edit'
  initialData?: Record<string, unknown>
  animal?: Record<string, unknown>
  statusHistory?: unknown[]
  currentUser?: { id: string; name: string }
}

type Tab = 'basic' | 'health' | 'personality' | 'photos' | 'story' | 'rescue'

interface PendingPhoto { file: File; preview: string }

// ── Status options ─────────────────────────────────────────────────────────────
const SHELTER_STATUS_CARDS = [
  { value: 'available',      icon: '🏠', label: 'K adopci' },
  { value: 'reserved',       icon: '📌', label: 'Rezervováno' },
  { value: 'adopted',        icon: '✅', label: 'Adoptováno' },
  { value: 'foster',         icon: '🏡', label: 'Dočasná péče' },
  { value: 'intake',         icon: '📥', label: 'V příjmu' },
  { value: 'treatment',      icon: '💊', label: 'V léčbě' },
  { value: 'rehabilitation', icon: '🔄', label: 'Rehabilitace' },
  { value: 'deceased',       icon: '🕊️', label: 'Uhynul' },
]

const RESCUE_STATUS_CARDS = [
  { value: 'intake',         icon: '📥', label: 'V příjmu' },
  { value: 'treatment',      icon: '💊', label: 'V léčbě' },
  { value: 'rehabilitation', icon: '🔄', label: 'Rehabilitace' },
  { value: 'released',       icon: '🦋', label: 'Vypuštěn' },
  { value: 'available',      icon: '🏠', label: 'K adopci' },
  { value: 'deceased',       icon: '🕊️', label: 'Uhynul' },
]

const ORIGIN_OPTIONS = [
  { value: 'municipal_capture', label: 'Odchyceno obcí' },
  { value: 'seized',            label: 'Odebráno majiteli' },
  { value: 'found',             label: 'Nalezeno' },
  { value: 'surrendered',       label: 'Odevzdáno majitelem' },
  { value: 'transferred',       label: 'Přeřazeno z jiného útulku' },
  { value: 'other',             label: 'Jiné' },
]

const HEALTH_STATUS_OPTIONS = [
  { value: 'healthy',      label: 'Zdravý' },
  { value: 'in_treatment', label: 'V léčbě' },
  { value: 'post_surgery', label: 'Po operaci' },
  { value: 'chronic',      label: 'Chronické onemocnění' },
  { value: 'unknown',      label: 'Neznámý' },
]

const RESCUE_PROGNOSIS_OPTIONS = [
  { value: 'release',            label: 'Vypuštění do přírody' },
  { value: 'permanent_handicap', label: 'Trvalý handicap' },
  { value: 'unknown',            label: 'Neznámá' },
]

const GOOD_WITH_OPTIONS = [
  { value: 'yes',     label: 'Miluje' },
  { value: 'ok',      label: 'Toleruje' },
  { value: 'no',      label: 'Nevhodné' },
  { value: 'unknown', label: 'Netestováno' },
]

const GOOD_WITH_ADULTS_OPTIONS = [
  { value: 'friendly',    label: 'Přátelský' },
  { value: 'shy',         label: 'Ostýchavý' },
  { value: 'fearful',     label: 'Bojácný' },
  { value: 'distrustful', label: 'Nedůvěřivý' },
  { value: 'unknown',     label: 'Netestováno' },
]

const ACTIVITY_CARDS = [
  { value: 'low',    icon: '😴', label: 'Klidný' },
  { value: 'medium', icon: '🚶', label: 'Střední' },
  { value: 'high',   icon: '🏃', label: 'Aktivní' },
  { value: 'very_high', icon: '⚡', label: 'Velmi aktivní' },
]

const DIFFICULTY_CARDS = [
  { value: 'easy',   icon: '⭐',    label: 'Nenáročný',  desc: 'Pro začátečníky' },
  { value: 'medium', icon: '⭐⭐',  label: 'Střední',    desc: 'Mírná zkušenost' },
  { value: 'hard',   icon: '⭐⭐⭐', label: 'Náročný',   desc: 'Pro zkušené' },
  { value: 'expert', icon: '🏆',    label: 'Expert',     desc: 'Odborná péče' },
]

const VACCINATION_TYPES = [
  { value: 'rabies',    label: 'Vzteklina' },
  { value: 'combo',     label: 'Kombinované' },
  { value: 'deworming', label: 'Odčervení' },
  { value: 'other',     label: 'Jiné' },
]

// ── Shared input styles ────────────────────────────────────────────────────────
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border-2 border-[#F0EDE8] bg-white text-sm text-[#2C1810] font-semibold placeholder:text-[#A09890] placeholder:font-normal focus:outline-none focus:border-[#E8634A] transition-colors'
const selectCls = inputCls + ' appearance-none bg-[url("data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%23A09890%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center] pr-9'
const textareaCls = inputCls + ' resize-y min-h-[80px]'

// ── Helper components ──────────────────────────────────────────────────────────
function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550]">
        {label}{required && <span className="text-[#E8634A] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[#8B6550]">{hint}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-display font-bold text-[17px] text-[#2C1810] mb-4">{children}</div>
}

function Divider() {
  return <div className="h-px bg-[#F0EDE8] my-6" />
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#F0EDE8] bg-white">
      <div>
        <div className="text-sm font-semibold text-[#2C1810]">{label}</div>
        {desc && <div className="text-xs text-[#8B6550] mt-0.5">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#E8634A]' : 'bg-[#F0EDE8]'}`}
      >
        <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function RadioPill({ value, selected, onChange, children }: {
  value: string; selected: boolean; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all ${
        selected
          ? 'border-[#E8634A] bg-[#FDEAE6] text-[#993C1D]'
          : 'border-[#F0EDE8] bg-white text-[#6B4030] hover:border-[#E8634A]'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-[#E8634A]' : 'border-[#F0EDE8]'}`}>
        {selected && <span className="w-2 h-2 rounded-full bg-[#E8634A]" />}
      </span>
      {children}
    </button>
  )
}

function SelectCard({ value, selected, icon, label, desc, onChange }: {
  value: string; selected: boolean; icon: string; label: string; desc?: string; onChange: (v: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`p-3 rounded-xl border-2 text-center transition-all ${
        selected
          ? 'border-[#E8634A] bg-[#FDEAE6]'
          : 'border-[#F0EDE8] bg-white hover:border-[#E8634A]'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-bold text-[#2C1810]">{label}</div>
      {desc && <div className="text-[10px] text-[#8B6550] mt-0.5">{desc}</div>}
    </button>
  )
}

function CheckPill({ checked, onChange, children }: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
        checked
          ? 'border-[#2D8A4E] bg-[#EAF3DE] text-[#1a5e2e]'
          : 'border-[#F0EDE8] bg-white text-[#6B4030] hover:border-[#E8634A]'
      }`}
    >
      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${checked ? 'border-[#2D8A4E] bg-[#2D8A4E]' : 'border-[#F0EDE8]'}`}>
        {checked && <span className="text-white text-[10px] font-black leading-none">✓</span>}
      </span>
      {children}
    </button>
  )
}

function InfoBox({ type, icon, children }: { type: 'tip' | 'warn' | 'info'; icon: string; children: React.ReactNode }) {
  const cls = type === 'warn' ? 'bg-[#FCEBEB] text-[#D83030]' : type === 'info' ? 'bg-[#E6F1FB] text-[#185FA5]' : 'bg-[#FFF3D6] text-[#7a5800]'
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold mb-5 ${cls}`}>
      <span className="text-base flex-shrink-0">{icon}</span>
      {children}
    </div>
  )
}

// ── initFormData ───────────────────────────────────────────────────────────────
function initFormData(data?: Record<string, unknown>) {
  const d = data ?? {}
  // Compute ageValue + ageUnit from existing data
  let ageValue = ''
  let ageUnit: 'years' | 'months' = 'years'
  if (d.age_months != null) { ageValue = String(d.age_months); ageUnit = 'months' }
  else if (d.birth_year != null) {
    const years = new Date().getFullYear() - Number(d.birth_year)
    if (years >= 0) { ageValue = String(years); ageUnit = 'years' }
  }

  return {
    name:                String(d.name ?? ''),
    species_id:          String(d.species_id ?? ''),
    sex:                 String(d.sex ?? ''),
    ageValue,
    ageUnit,
    breed:               String(d.breed ?? ''),
    color:               String(d.color ?? ''),
    size:                String(d.size ?? ''),
    weight_kg:           d.weight_kg != null ? String(d.weight_kg) : '',
    chip_number:         String(d.chip_number ?? ''),
    chip_date:           String(d.chip_date ?? ''),
    passport_number:     String(d.passport_number ?? ''),
    internal_id:         String(d.internal_id ?? ''),
    intake_date:         String(d.intake_date ?? new Date().toISOString().slice(0, 10)),
    origin:              String(d.origin ?? ''),
    adoption_status:     String(d.adoption_status ?? (data ? '' : 'available')),
    urgent:              Boolean(d.urgent),

    health_status:       String(d.health_status ?? 'healthy'),
    neutered:            d.neutered === true ? 'yes' : d.neutered === false ? 'no' : String(d.neutered ?? 'unknown'),
    vaccinated:          Boolean(d.vaccinated),
    vaccination_details: Array.isArray(d.vaccination_details) ? (d.vaccination_details as string[]) : [],
    last_vet_visit:      String(d.last_vet_visit ?? ''),
    vet_name:            String(d.vet_name ?? ''),
    vet_phone:           String(d.vet_phone ?? ''),
    medications:         String(d.medications ?? ''),
    medical_notes:       String(d.medical_notes ?? ''),
    special_needs_text:  String(d.special_needs_text ?? ''),
    in_quarantine:       Boolean(d.in_quarantine),
    quarantine_until:    String(d.quarantine_until ?? ''),
    quarantine_reason:   String(d.quarantine_reason ?? ''),

    good_with_kids:          String(d.good_with_kids ?? 'unknown'),
    good_with_dogs:          String(d.good_with_dogs ?? 'unknown'),
    good_with_cats:          String(d.good_with_cats ?? 'unknown'),
    good_with_other_animals: String(d.good_with_other_animals ?? 'unknown'),
    good_with_adults:        String(d.good_with_adults ?? 'unknown'),
    activity_level:          String(d.activity_level ?? ''),
    care_difficulty:         String(d.care_difficulty ?? ''),
    suitable_for_flat:       d.suitable_for_flat !== false,
    suitable_for_house:      d.suitable_for_house !== false,
    description:             String(d.description ?? ''),

    story:                String(d.story ?? ''),
    adoption_fee:         d.adoption_fee != null ? String(d.adoption_fee) : '',
    adopter_requirements: String(d.adopter_requirements ?? ''),
    in_foster:            Boolean(d.in_foster),
    published:            Boolean(d.published),

    rescue_find_type:           String(d.rescue_find_type ?? ''),
    rescue_prognosis:           String(d.rescue_prognosis ?? 'unknown'),
    rescue_public_description:  String(d.rescue_public_description ?? ''),
    found_location:             String(d.found_location ?? ''),
    found_date:                 String(d.found_date ?? ''),
    internal_notes:             String(d.internal_notes ?? ''),
  }
}

type FormState = ReturnType<typeof initFormData>

// ── Main component ─────────────────────────────────────────────────────────────
export function AnimalForm({
  institutionId,
  institutionType,
  species,
  mode,
  initialData,
  animal,
}: AnimalFormProps) {
  const router    = useRouter()
  const isShelter = institutionType === 'shelter'
  const source    = initialData ?? animal

  const [form, setForm]         = useState<FormState>(() => initFormData(source))
  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [errors, setErrors]       = useState<Record<string, string>>({})

  // Photos
  const [pendingPhotos, setPendingPhotos]   = useState<PendingPhoto[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    Array.isArray(source?.photos) ? (source.photos as string[]) : []
  )
  const [removedPhotos, setRemovedPhotos]   = useState<string[]>([])
  const [primaryIdx, setPrimaryIdx]         = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const animalId = source?.id as string | undefined

  const set = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
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
      if (f.size > 8 * 1024 * 1024) { showToast(`${f.name} je příliš velký (max 8 MB)`, false); continue }
      newPhotos.push({ file: f, preview: URL.createObjectURL(f) })
    }
    setPendingPhotos(prev => [...prev, ...newPhotos])
  }

  function removeExisting(url: string) {
    setExistingPhotos(prev => prev.filter(u => u !== url))
    setRemovedPhotos(prev => [...prev, url])
    if (primaryIdx >= existingPhotos.length - 1) setPrimaryIdx(0)
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
    if (!form.name.trim())        errs.name           = 'Jméno je povinné'
    if (!form.species_id)         errs.species_id     = 'Druh je povinný'
    if (!form.sex)                errs.sex            = 'Pohlaví je povinné'
    if (!form.adoption_status)    errs.adoption_status = 'Stav je povinný'
    if (!form.intake_date)        errs.intake_date    = 'Datum příjmu je povinné'
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
      // Compute birth_year / age_months from ageValue + ageUnit
      const ageNum = form.ageValue ? parseInt(form.ageValue) : null
      const birth_year = (ageNum !== null && form.ageUnit === 'years')
        ? new Date().getFullYear() - ageNum
        : null
      const age_months = (ageNum !== null && form.ageUnit === 'months') ? ageNum : null

      const payload: Record<string, unknown> = {
        name:            form.name.trim(),
        species_id:      form.species_id,
        sex:             form.sex,
        birth_year,
        age_months,
        breed:           form.breed || null,
        color:           form.color || null,
        size:            form.size || null,
        weight_kg:       form.weight_kg ? parseFloat(form.weight_kg) : null,
        chip_number:     form.chip_number || null,
        chip_date:       form.chip_date || null,
        intake_date:     form.intake_date || null,
        origin:          form.origin || null,
        adoption_status: form.adoption_status,
        urgent:          form.urgent,
        health_status:   form.health_status,
        neutered:        form.neutered === 'yes' ? true : form.neutered === 'no' ? false : null,
        vaccinated:      form.vaccinated,
        last_vet_visit:  form.last_vet_visit || null,
        vet_name:        form.vet_name || null,
        vet_phone:       form.vet_phone || null,
        medications:     form.medications || null,
        medical_notes:   form.medical_notes || null,
        in_quarantine:   form.in_quarantine,
        quarantine_until:  form.quarantine_until || null,
        quarantine_reason: form.quarantine_reason || null,
        good_with_kids:          form.good_with_kids,
        good_with_dogs:          form.good_with_dogs,
        good_with_cats:          form.good_with_cats,
        good_with_other_animals: form.good_with_other_animals,
        good_with_adults:        form.good_with_adults,
        activity_level:          form.activity_level || null,
        care_difficulty:         form.care_difficulty || null,
        suitable_for_flat:       form.suitable_for_flat,
        suitable_for_house:      form.suitable_for_house,
        description:             form.description || null,
        story:                   form.story || null,
        adoption_fee:            form.adoption_fee ? parseInt(form.adoption_fee) : null,
        adopter_requirements:    form.adopter_requirements || null,
        in_foster:               form.in_foster,
        published:               publish,
        found_location:          form.found_location || null,
        found_date:              form.found_date || null,
        rescue_find_type:        form.rescue_find_type || null,
        rescue_prognosis:        form.rescue_prognosis || null,
        rescue_public_description: form.rescue_public_description || null,
        internal_notes:          form.internal_notes || null,
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

      // Handle photos
      if (savedId) {
        let newUrls: string[] = []
        if (pendingPhotos.length > 0) {
          newUrls = await uploadPendingPhotos(savedId)
        }
        const allPhotos = [...existingPhotos, ...newUrls]
        const primary   = allPhotos[primaryIdx] ?? allPhotos[0] ?? null
        if (newUrls.length > 0 || removedPhotos.length > 0) {
          await fetch(`/api/animals/${savedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photos: allPhotos, primary_photo: primary }),
          })
        }
      }

      showToast(publish ? 'Uloženo a zveřejněno ✓' : 'Uloženo jako draft')
      setTimeout(() => router.push('/admin/animals'), 1200)
    } catch (err) {
      showToast(`Chyba: ${err instanceof Error ? err.message : 'Neznámá chyba'}`, false)
    } finally {
      setSaving(false)
    }
  }

  // ── Tabs config ────────────────────────────────────────────────────────────
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'basic',       icon: '🐾', label: 'Základní' },
    { id: 'health',      icon: '💊', label: 'Zdraví' },
    ...(isShelter ? [{ id: 'personality' as Tab, icon: '❤️', label: 'Povaha' }] : []),
    { id: 'photos',      icon: '📷', label: 'Fotky' },
    { id: 'story',       icon: '📖', label: 'Příběh' },
    ...(!isShelter ? [{ id: 'rescue' as Tab, icon: '🦉', label: 'Záchrana' }] : []),
  ]

  const statusCards = isShelter ? SHELTER_STATUS_CARDS : RESCUE_STATUS_CARDS
  const allPhotos   = [...existingPhotos, ...pendingPhotos.map(p => p.preview)]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white transition-all ${toast.ok ? 'bg-[#2D7A4F]' : 'bg-[#D83030]'}`}>
          {toast.msg}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#F0EDE8] rounded-2xl p-1 mb-7 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-white text-[#2C1810] shadow-sm'
                : 'bg-transparent text-[#8B6550] hover:bg-white/60 hover:text-[#2C1810]'
            }`}
          >
            <span className="text-[15px]">{t.icon}</span>
            {t.label}
            {t.id === 'basic' && Object.keys(errors).length > 0 && (
              <span className="bg-[#E8634A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg ml-1">
                {Object.keys(errors).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card wrapper */}
      <div className="bg-white rounded-2xl border border-[#F0EDE8] px-8 py-7">

        {/* ── TAB: BASIC ── */}
        {activeTab === 'basic' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
              <Field label="Jméno" required>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Max, Luna, Běla..." />
                {errors.name && <p className="text-xs text-[#E8634A]">{errors.name}</p>}
              </Field>

              <Field label="Druh zvířete" required>
                <select className={selectCls} value={form.species_id} onChange={e => set('species_id', e.target.value)}>
                  <option value="">Vyberte druh...</option>
                  {species.map(s => <option key={s.id} value={s.id}>{s.name_cs}</option>)}
                </select>
                {errors.species_id && <p className="text-xs text-[#E8634A]">{errors.species_id}</p>}
              </Field>
            </div>

            <Divider />

            <div className="mb-7">
              <SectionTitle>Pohlaví <span className="text-[#E8634A] ml-1 text-sm">*</span></SectionTitle>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'female', label: 'Samice' },
                  { value: 'male',   label: 'Samec' },
                  { value: 'unknown', label: 'Neznámé' },
                ].map(o => (
                  <RadioPill key={o.value} value={o.value} selected={form.sex === o.value} onChange={v => set('sex', v)}>
                    {o.label}
                  </RadioPill>
                ))}
              </div>
              {errors.sex && <p className="text-xs text-[#E8634A] mt-1">{errors.sex}</p>}
            </div>

            <Divider />

            <div className="mb-7">
              <SectionTitle>Stav <span className="text-[#E8634A] ml-1 text-sm">*</span></SectionTitle>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {statusCards.map(c => (
                  <SelectCard
                    key={c.value}
                    value={c.value}
                    selected={form.adoption_status === c.value}
                    icon={c.icon}
                    label={c.label}
                    onChange={v => set('adoption_status', v)}
                  />
                ))}
              </div>
              {errors.adoption_status && <p className="text-xs text-[#E8634A] mt-1">{errors.adoption_status}</p>}
            </div>

            <Divider />

            <SectionTitle>Další detaily</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Datum příjmu" required>
                <input type="date" className={inputCls} value={form.intake_date} onChange={e => set('intake_date', e.target.value)} />
                {errors.intake_date && <p className="text-xs text-[#E8634A]">{errors.intake_date}</p>}
              </Field>

              <Field label="Plemeno / poddruh">
                <input className={inputCls} value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="Labrador, Mainská mývalí..." />
              </Field>

              <Field label="Přibližný věk">
                <div className="flex gap-2">
                  <input
                    type="number"
                    className={inputCls}
                    style={{ width: 72 }}
                    value={form.ageValue}
                    onChange={e => set('ageValue', e.target.value)}
                    placeholder="3"
                    min="0"
                  />
                  <select
                    className={selectCls + ' flex-1'}
                    value={form.ageUnit}
                    onChange={e => set('ageUnit', e.target.value as 'years' | 'months')}
                  >
                    <option value="years">let</option>
                    <option value="months">měsíců</option>
                  </select>
                </div>
              </Field>

              <Field label="Barva / zbarvení">
                <input className={inputCls} value={form.color} onChange={e => set('color', e.target.value)} placeholder="Černohnědá, tricolor..." />
              </Field>

              <Field label="Velikost">
                <select className={selectCls} value={form.size} onChange={e => set('size', e.target.value)}>
                  <option value="">Vyberte...</option>
                  <option value="small">Malá (do 10 kg)</option>
                  <option value="medium">Střední (10–25 kg)</option>
                  <option value="large">Velká (25–45 kg)</option>
                  <option value="xlarge">Velmi velká (45+ kg)</option>
                </select>
              </Field>

              <Field label="Váha (kg)">
                <input type="number" step="0.1" className={inputCls} value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="12.5" min="0" />
              </Field>

              <Field label="Číslo čipu">
                <input className={inputCls} value={form.chip_number} onChange={e => set('chip_number', e.target.value)} placeholder="203 000 123 456 789" />
              </Field>

              <Field label="Původ zvířete">
                <select className={selectCls} value={form.origin} onChange={e => set('origin', e.target.value)}>
                  <option value="">Vyberte...</option>
                  {ORIGIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-5">
              <ToggleRow
                label="🆘 Urgentní adopce"
                desc="Zvíře bude zvýrazněno na webu červeným štítkem"
                checked={form.urgent}
                onChange={v => set('urgent', v)}
              />
            </div>
          </div>
        )}

        {/* ── TAB: HEALTH ── */}
        {activeTab === 'health' && (
          <div>
            <div className="mb-7">
              <SectionTitle>💊 Zdravotní stav</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Celkový stav" required>
                  <select className={selectCls} value={form.health_status} onChange={e => set('health_status', e.target.value)}>
                    {HEALTH_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <Divider />

            <div className="mb-7">
              <SectionTitle>Kastrace a očkování</SectionTitle>
              <div className="mb-4">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] mb-2 block">Kastrace / sterilizace</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'yes',     label: 'Ano' },
                    { value: 'no',      label: 'Ne' },
                    { value: 'planned', label: 'Plánovaná' },
                    { value: 'unknown', label: 'Nevím' },
                  ].map(o => (
                    <RadioPill key={o.value} value={o.value} selected={form.neutered === o.value} onChange={v => set('neutered', v)}>
                      {o.label}
                    </RadioPill>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <ToggleRow label="Očkovaný" checked={form.vaccinated} onChange={v => set('vaccinated', v)} />
              </div>
              {form.vaccinated && (
                <div className="mb-4">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] mb-2 block">Detaily očkování</label>
                  <div className="flex flex-wrap gap-2">
                    {VACCINATION_TYPES.map(vt => (
                      <CheckPill
                        key={vt.value}
                        checked={form.vaccination_details.includes(vt.value)}
                        onChange={checked => {
                          const next = checked
                            ? [...form.vaccination_details, vt.value]
                            : form.vaccination_details.filter(v => v !== vt.value)
                          set('vaccination_details', next)
                        }}
                      >
                        {vt.label}
                      </CheckPill>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Datum posledního očkování">
                  <input type="date" className={inputCls} value={form.last_vet_visit} onChange={e => set('last_vet_visit', e.target.value)} />
                </Field>
              </div>
            </div>

            <Divider />

            <div className="mb-7">
              <SectionTitle>Veterinární údaje</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Veterinář (jméno)">
                  <input className={inputCls} value={form.vet_name} onChange={e => set('vet_name', e.target.value)} placeholder="MVDr. Jan Novák" />
                </Field>
                <Field label="Telefon na veterináře">
                  <input type="tel" className={inputCls} value={form.vet_phone} onChange={e => set('vet_phone', e.target.value)} placeholder="+420 777 123 456" />
                </Field>
                <Field label="Aktuální léky">
                  <textarea className={textareaCls} rows={2} value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="Název léku, dávkování, frekvence..." />
                </Field>
                <Field label="Zdravotní poznámky">
                  <textarea className={textareaCls} rows={3} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} placeholder="Alergie, prodělaná onemocnění, diagnózy..." />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Speciální potřeby">
                    <textarea className={textareaCls} rows={2} value={form.special_needs_text} onChange={e => set('special_needs_text', e.target.value)} placeholder="Speciální dieta, pravidelné léky, handicap..." />
                  </Field>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <SectionTitle>Karanténa</SectionTitle>
              <ToggleRow
                label="Zvíře je v karanténě"
                desc="Nebude zobrazeno na veřejných stránkách"
                checked={form.in_quarantine}
                onChange={v => set('in_quarantine', v)}
              />
              {form.in_quarantine && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Field label="Karanténa do">
                    <input type="date" className={inputCls} value={form.quarantine_until} onChange={e => set('quarantine_until', e.target.value)} />
                  </Field>
                  <Field label="Důvod karantény">
                    <input className={inputCls} value={form.quarantine_reason} onChange={e => set('quarantine_reason', e.target.value)} />
                  </Field>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: PERSONALITY (shelter only) ── */}
        {activeTab === 'personality' && isShelter && (
          <div>
            <InfoBox type="tip" icon="💛">
              Čím víc vyplníš, tím snáz se zvíře adoptuje. Zájemci filtrují podle těchto vlastností.
            </InfoBox>

            <div className="mb-7">
              <SectionTitle>Kompatibilita</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Vztah k dětem">
                  <select className={selectCls} value={form.good_with_kids} onChange={e => set('good_with_kids', e.target.value)}>
                    {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Vztah k psům">
                  <select className={selectCls} value={form.good_with_dogs} onChange={e => set('good_with_dogs', e.target.value)}>
                    {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Vztah ke kočkám">
                  <select className={selectCls} value={form.good_with_cats} onChange={e => set('good_with_cats', e.target.value)}>
                    {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Vztah k jiným zvířatům">
                  <select className={selectCls} value={form.good_with_other_animals} onChange={e => set('good_with_other_animals', e.target.value)}>
                    {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Vztah k dospělým / cizím lidem">
                  <select className={selectCls} value={form.good_with_adults} onChange={e => set('good_with_adults', e.target.value)}>
                    {GOOD_WITH_ADULTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <Divider />

            <div className="mb-7">
              <SectionTitle>Aktivita a náročnost</SectionTitle>

              <div className="mb-5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] mb-2 block">Energetická úroveň</label>
                <div className="grid grid-cols-4 gap-2">
                  {ACTIVITY_CARDS.map(c => (
                    <SelectCard key={c.value} value={c.value} selected={form.activity_level === c.value} icon={c.icon} label={c.label} onChange={v => set('activity_level', v)} />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] mb-2 block">Náročnost chovu</label>
                <div className="grid grid-cols-4 gap-2">
                  {DIFFICULTY_CARDS.map(c => (
                    <SelectCard key={c.value} value={c.value} selected={form.care_difficulty === c.value} icon={c.icon} label={c.label} desc={c.desc} onChange={v => set('care_difficulty', v)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] mb-2 block">Vhodné bydlení</label>
                <div className="flex gap-2 flex-wrap">
                  <CheckPill checked={form.suitable_for_flat}  onChange={v => set('suitable_for_flat', v)}>🏢 Byt</CheckPill>
                  <CheckPill checked={form.suitable_for_house} onChange={v => set('suitable_for_house', v)}>🏡 Dům se zahradou</CheckPill>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <SectionTitle>Popis povahy</SectionTitle>
              <textarea
                className={textareaCls + ' min-h-[120px]'}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
                placeholder="Bella je velmi přátelská, miluje procházky a aportování. Na cizí se nejdřív ostýchá..."
              />
            </div>
          </div>
        )}

        {/* ── TAB: PHOTOS ── */}
        {activeTab === 'photos' && (
          <div>
            {errors.photos && (
              <InfoBox type="warn" icon="📷">{errors.photos}</InfoBox>
            )}
            {!errors.photos && allPhotos.length === 0 && (
              <InfoBox type="warn" icon="📷">Zvíře bez fotky se obtížně adoptuje. Nahraj alespoň hlavní fotku.</InfoBox>
            )}

            <div className="mb-7">
              <SectionTitle>Galerie fotek</SectionTitle>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFileDrop(e.dataTransfer.files) }}
                className="border-2 border-dashed border-[#F0EDE8] rounded-2xl p-10 text-center cursor-pointer hover:border-[#E8634A] hover:bg-[#FDEAE6] transition-colors bg-[#FDFCFA] mb-4"
              >
                <div className="text-4xl mb-2 text-[#A09890]">📸</div>
                <div className="text-sm font-bold text-[#2C1810]">Klikni nebo přetáhni fotky sem</div>
                <div className="text-xs text-[#8B6550] mt-1">JPG, PNG, WebP · max. 8 MB · min. 800×600 px</div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileDrop(e.target.files)} />
              </div>

              {allPhotos.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {existingPhotos.map((url, i) => (
                      <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#F0EDE8] group">
                        <Image src={url} alt="" fill className="object-cover" sizes="200px" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        {i === primaryIdx && (
                          <span className="absolute top-1.5 left-1.5 bg-[#E8634A] text-white text-[10px] font-bold px-2 py-0.5 rounded">Hlavní</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPrimaryIdx(i)}
                          title="Nastavit jako hlavní"
                          className={`absolute bottom-1.5 left-1.5 text-lg leading-none transition-opacity ${i === primaryIdx ? 'text-yellow-400' : 'text-white/50 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}
                        >★</button>
                        <button
                          type="button"
                          onClick={() => removeExisting(url)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#E8634A] transition-all"
                        >×</button>
                      </div>
                    ))}
                    {pendingPhotos.map((p, i) => {
                      const gi = existingPhotos.length + i
                      return (
                        <div key={p.preview} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#E8634A]/30 group">
                          <Image src={p.preview} alt="" fill className="object-cover" sizes="200px" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <span className="absolute top-1.5 left-1.5 bg-[#E8634A] text-white text-[10px] font-bold px-2 py-0.5 rounded">Nová</span>
                          <button
                            type="button"
                            onClick={() => setPrimaryIdx(gi)}
                            className={`absolute bottom-1.5 left-1.5 text-lg leading-none transition-opacity ${gi === primaryIdx ? 'text-yellow-400' : 'text-white/50 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}
                          >★</button>
                          <button
                            type="button"
                            onClick={() => setPendingPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#E8634A] transition-all"
                          >×</button>
                        </div>
                      )
                    })}
                    {/* Add more slot */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#F0EDE8] flex items-center justify-center cursor-pointer hover:border-[#E8634A] transition-colors"
                    >
                      <span className="text-3xl text-[#A09890]">+</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#8B6550] mt-2">
                    {allPhotos.length} fotek · Klikni na ★ pro nastavení hlavní fotky
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: STORY ── */}
        {activeTab === 'story' && (
          <div>
            <div className="mb-7">
              <SectionTitle>📖 Příběh zvířete</SectionTitle>
              <textarea
                className={textareaCls + ' min-h-[140px]'}
                rows={6}
                value={form.story}
                onChange={e => set('story', e.target.value)}
                placeholder="Jak se zvíře dostalo do útulku, co prožilo, jaké má zvyky, proč hledá nový domov..."
              />
            </div>

            <Divider />

            <div className="mb-7">
              <SectionTitle>Adopční podmínky</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Adopční poplatek (Kč)" hint="0 = zdarma">
                  <input type="number" className={inputCls} value={form.adoption_fee} onChange={e => set('adoption_fee', e.target.value)} placeholder="0 = zdarma" min="0" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Požadavky na adoptéra">
                    <textarea className={textareaCls} rows={3} value={form.adopter_requirements} onChange={e => set('adopter_requirements', e.target.value)} placeholder="Zkušenost s plemeny, zahrada, bez malých dětí..." />
                  </Field>
                </div>
              </div>
            </div>

            <Divider />

            <div className="space-y-3 mb-7">
              <SectionTitle>Dočasná péče</SectionTitle>
              <ToggleRow
                label="Zvíře je v dočasné péči"
                desc="Nachází se u pečovatele, ne přímo v útulku"
                checked={form.in_foster}
                onChange={v => set('in_foster', v)}
              />
            </div>

            <Divider />

            <div>
              <SectionTitle>Publikace</SectionTitle>
              <ToggleRow
                label="Publikovat na webu"
                desc="Zvíře se zobrazí na veřejných stránkách zozio.cz"
                checked={form.published}
                onChange={v => set('published', v)}
              />
            </div>
          </div>
        )}

        {/* ── TAB: RESCUE (rescue_station only) ── */}
        {activeTab === 'rescue' && !isShelter && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
              <Field label="Druh nálezu" hint="Jak bylo zvíře nalezeno">
                <input className={inputCls} value={form.rescue_find_type} onChange={e => set('rescue_find_type', e.target.value)} placeholder="Střet s vozidlem, vypadlé z hnízda..." />
              </Field>

              <Field label="Prognóza">
                <select className={selectCls} value={form.rescue_prognosis} onChange={e => set('rescue_prognosis', e.target.value)}>
                  {RESCUE_PROGNOSIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <Field label="Místo nálezu">
                <input className={inputCls} value={form.found_location} onChange={e => set('found_location', e.target.value)} placeholder="Např. Praha 5, les u Brna..." />
              </Field>

              <Field label="Datum nálezu">
                <input type="date" className={inputCls} value={form.found_date} onChange={e => set('found_date', e.target.value)} />
              </Field>

              <Field label="Vztah k lidem">
                <select className={selectCls} value={form.good_with_adults} onChange={e => set('good_with_adults', e.target.value)}>
                  {GOOD_WITH_ADULTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Veřejný popis případu" hint="Zobrazí se na profilu zvířete — záchranný příběh">
                  <textarea className={textareaCls + ' min-h-[100px]'} value={form.rescue_public_description} onChange={e => set('rescue_public_description', e.target.value)} placeholder="Sova byla nalezena..." />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Interní poznámky">
                  <textarea className={textareaCls} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── Sticky footer ── */}
        <div className="sticky bottom-0 bg-white border-t border-[#F0EDE8] -mx-8 -mb-7 px-8 py-3.5 flex items-center justify-between rounded-b-2xl z-10 mt-8">
          <div className="text-xs text-[#8B6550] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2D8A4E] inline-block" />
            Automaticky neuloženo — klikni Uložit
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2.5 rounded-full font-display font-bold text-sm bg-[#F5E6D3] text-[#6B4030] hover:bg-[#eddcc5] disabled:opacity-50 transition-colors"
            >
              Uložit jako draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(form.published || true)}
              className="px-5 py-2.5 rounded-full font-display font-bold text-sm bg-[#E8634A] text-white shadow-[0_4px_18px_rgba(232,99,74,.32)] hover:bg-[#d4553e] disabled:opacity-50 transition-all hover:-translate-y-px"
            >
              {saving ? 'Ukládám...' : 'Uložit a publikovat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
