'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MedicalRecordsPanel } from '@/components/admin/MedicalRecordsPanel'
import type { LocalRecord } from '@/components/admin/MedicalRecordsPanel'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Species { id: string; name_cs: string }
interface Breed   { id: string; name_cs: string; size_category?: string; energy_level?: string; is_custom?: boolean }

interface VaccinationRecord { _key: string; type: string; label: string; last_date: string }
interface MedicationEntry   { _key: string; name: string; dosage: string; frequency: string }

interface StatusHistoryEntry {
  id?: string
  status: string
  changed_at: string
  note?: string
  changed_by?: string
}

interface AuditChange {
  field:     string
  label:     string
  old_value: string
  new_value: string
}

interface AuditLogEntry {
  id:          string
  changed_at:  string
  change_note?: string | null
  changed_by?: string | null
  changes:     AuditChange[]
}

interface AnimalFormProps {
  institutionId:   string
  institutionType: 'shelter' | 'rescue_station'
  species:         Species[]
  mode:            'create' | 'edit'
  initialData?:    Record<string, unknown>
  animal?:         Record<string, unknown>
  statusHistory?:  StatusHistoryEntry[]
  auditLog?:       AuditLogEntry[]
  currentUser?:    { id: string; name: string }
}

type Tab = 'basic' | 'health' | 'personality' | 'photos' | 'adopce' | 'rescue' | 'history'

interface PendingPhoto { file: File; preview: string }

// ── Status config ──────────────────────────────────────────────────────────────
const SHELTER_STATUS_CARDS = [
  { value: 'intake',           icon: '📥', label: 'V příjmu' },
  { value: 'available',        icon: '🏠', label: 'K adopci' },
  { value: 'reserved',         icon: '📌', label: 'Rezervováno' },
  { value: 'adopted',          icon: '✅', label: 'Adoptováno' },
  { value: 'foster',           icon: '🏡', label: 'Dočasná péče' },
  { value: 'conditional',      icon: '🤝', label: 'Podmíněná adopce' },
  { value: 'treatment',        icon: '💊', label: 'V léčbě' },
  { value: 'not_for_adoption', icon: '🚫', label: 'Nevhodný k adopci' },
  { value: 'deceased',         icon: '🕊️', label: 'Uhynul' },
]

const RESCUE_STATUS_CARDS = [
  { value: 'intake',    icon: '📥', label: 'V příjmu' },
  { value: 'treatment', icon: '💊', label: 'Léčba' },
  { value: 'released',  icon: '🦋', label: 'Vypuštěn' },
  { value: 'available', icon: '🏠', label: 'K adopci' },
  { value: 'deceased',  icon: '🕊️', label: 'Uhynul' },
]

const STATUS_LABEL: Record<string, string> = {
  intake: 'V příjmu', available: 'K adopci', reserved: 'Rezervováno',
  adopted: 'Adoptováno', foster: 'Dočasná péče', treatment: 'V léčbě',
  rehabilitation: 'Rehabilitace', released: 'Vypuštěn', deceased: 'Uhynul',
}

const HEALTH_STATUS_OPTIONS = [
  { value: 'healthy',    label: 'Zdravý' },
  { value: 'sick',       label: 'Nemocný' },
  { value: 'injured',    label: 'Zraněný' },
  { value: 'recovering', label: 'Rekonvalescence' },
  { value: 'chronic',    label: 'Chronické onemocnění' },
]

const ORIGIN_OPTIONS = [
  { value: 'municipal_capture', label: 'Odchyceno obcí' },
  { value: 'seized',            label: 'Odebráno majiteli' },
  { value: 'found',             label: 'Nalezeno' },
  { value: 'surrendered',       label: 'Odevzdáno majitelem' },
  { value: 'transferred',       label: 'Přeřazeno z jiného útulku' },
  { value: 'other',             label: 'Jiné' },
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
  { value: 'low',      icon: '😴', label: 'Klidný' },
  { value: 'medium',   icon: '🚶', label: 'Střední' },
  { value: 'high',     icon: '🏃', label: 'Aktivní' },
  { value: 'very_high',icon: '⚡', label: 'Velmi aktivní' },
]

const DIFFICULTY_CARDS = [
  { value: 'easy',      icon: '⭐',     label: 'Nenáročný', desc: 'Pro začátečníky' },
  { value: 'medium',    icon: '⭐⭐',   label: 'Střední',   desc: 'Mírná zkušenost' },
  { value: 'demanding', icon: '⭐⭐⭐', label: 'Náročný',   desc: 'Pro zkušené' },
  { value: 'expert',    icon: '🏆',     label: 'Expert',    desc: 'Odborná péče' },
]

const RESCUE_PROGNOSIS_OPTIONS = [
  { value: 'release',            label: 'Vypuštění do přírody' },
  { value: 'permanent_handicap', label: 'Trvalý handicap' },
  { value: 'unknown',            label: 'Neznámá' },
]

const PREDEFINED_VACCINES = [
  { type: 'rabies',      label: 'Vzteklina' },
  { type: 'combo',       label: 'Kombinované' },
  { type: 'deworming',   label: 'Odčervení' },
  { type: 'parvo',       label: 'Parvovirus' },
  { type: 'distemper',   label: 'Psinka' },
  { type: 'hepatitis',   label: 'Hepatitida' },
  { type: 'lepto',       label: 'Leptospiróza' },
  { type: 'bordetella',  label: 'Kenelkašel' },
]

const FREQUENCY_OPTIONS = ['1x denně', '2x denně', '3x denně', 'Každý 2. den', '1x týdně', 'Dle potřeby']

// ── Helpers ────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) }

function parseVaccinations(raw: unknown): VaccinationRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.map((v: unknown) => {
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>
      return { _key: uid(), type: String(obj.type ?? ''), label: String(obj.label ?? obj.type ?? ''), last_date: String(obj.last_date ?? '') }
    }
    return null
  }).filter(Boolean) as VaccinationRecord[]
}

function parseMedications(raw: unknown): MedicationEntry[] {
  if (Array.isArray(raw)) {
    return raw.map((m: unknown) => {
      if (typeof m === 'object' && m !== null) {
        const obj = m as Record<string, unknown>
        return { _key: uid(), name: String(obj.name ?? ''), dosage: String(obj.dosage ?? ''), frequency: String(obj.frequency ?? '') }
      }
      return null
    }).filter(Boolean) as MedicationEntry[]
  }
  return []
}

// ── CSS classes (reduced border radius) ────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 rounded-md border-2 border-[#F0EDE8] bg-white text-sm text-[#2C1810] placeholder:text-[#A09890] focus:outline-none focus:border-[#E8634A] transition-colors'
const selectCls = inputCls + ' appearance-none bg-[url("data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%23A09890%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_12px_center] pr-8'
const textareaCls = inputCls + ' resize-y min-h-[80px]'

// ── Sub-components ─────────────────────────────────────────────────────────────
function Field({ label, required, children, error, hint }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550]">
        {label}{required && <span className="text-[#E8634A] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[#E8634A]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#A09890]">{hint}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-display font-bold text-base text-[#2C1810] mb-3 flex items-center gap-2">{children}</div>
}

function Divider() { return <div className="h-px bg-[#F0EDE8] my-5" /> }

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3 rounded-lg border-2 border-[#F0EDE8] bg-white gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[#2C1810] leading-tight">{label}</div>
        {desc && <div className="text-xs text-[#8B6550] mt-0.5">{desc}</div>}
      </div>
      <button
        type="button" role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#E8634A]' : 'bg-[#D5CFC8]'}`}
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
    <button type="button" onClick={() => onChange(value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all touch-manipulation ${
        selected ? 'border-[#E8634A] bg-[#FDEAE6] text-[#993C1D]' : 'border-[#F0EDE8] bg-white text-[#6B4030] hover:border-[#E8634A]'
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-[#E8634A]' : 'border-[#D5CFC8]'}`}>
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-[#E8634A]" />}
      </span>
      {children}
    </button>
  )
}

function SelectCard({ value, selected, icon, label, desc, onChange }: {
  value: string; selected: boolean; icon: string; label: string; desc?: string; onChange: (v: string) => void
}) {
  return (
    <button type="button" onClick={() => onChange(value)}
      className={`p-2.5 rounded-lg border-2 text-center transition-all touch-manipulation ${
        selected ? 'border-[#E8634A] bg-[#FDEAE6]' : 'border-[#F0EDE8] bg-white hover:border-[#E8634A]'
      }`}
    >
      <div className="text-xl mb-0.5">{icon}</div>
      <div className="text-xs font-bold text-[#2C1810] leading-tight">{label}</div>
      {desc && <div className="text-[10px] text-[#8B6550] mt-0.5">{desc}</div>}
    </button>
  )
}

function InfoBox({ type, icon, children }: { type: 'tip'|'warn'|'info'; icon: string; children: React.ReactNode }) {
  const cls = type === 'warn' ? 'bg-[#FCEBEB] text-[#D83030]' : type === 'info' ? 'bg-[#E6F1FB] text-[#185FA5]' : 'bg-[#FFF3D6] text-[#7a5800]'
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm font-semibold mb-4 ${cls}`}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

// Handles both boolean (true/false) and string ("true"/"false") DB values for good_with_* columns
function boolToGoodWith(v: unknown): string {
  if (v === true  || v === 'true')  return 'yes'
  if (v === false || v === 'false') return 'no'
  if (v === 1     || v === '1')     return 'yes'
  if (v === 0     || v === '0')     return 'no'
  return 'unknown'
}

// ── initFormData ───────────────────────────────────────────────────────────────
function initFormData(data?: Record<string, unknown>) {
  const d = data ?? {}
  let ageValue = ''; let ageUnit: 'years'|'months' = 'years'
  if (d.age_months != null) { ageValue = String(d.age_months); ageUnit = 'months' }
  else if (d.birth_year != null) {
    const y = new Date().getFullYear() - Number(d.birth_year)
    if (y >= 0) { ageValue = String(y); ageUnit = 'years' }
  }
  return {
    name:             String(d.name ?? ''),
    species_id:       String(d.species_id ?? ''),
    sex:              String(d.sex ?? ''),
    ageValue, ageUnit,
    breed_id:         String(d.breed_id ?? ''),
    breed:            String(d.breed ?? ''),
    color:            String(d.color ?? ''),
    size:             String(d.size ?? ''),
    weight_kg:        d.weight_kg != null ? String(d.weight_kg) : '',
    chip_number:      String(d.chip_number ?? ''),
    chip_date:        String(d.chip_date ?? ''),
    passport_number:  String(d.passport_number ?? ''),
    intake_date:      String(d.intake_date ?? new Date().toISOString().slice(0, 10)),
    origin:           String(d.origin ?? ''),
    adoption_status:  String(d.adoption_status ?? 'intake'),
    urgent:           Boolean(d.urgent),
    health_status:    String(d.health_status ?? 'healthy'),
    neutered:         d.neutered === true ? 'yes' : d.neutered === false ? 'no' : String(d.neutered ?? 'unknown'),
    vaccinated:       Boolean(d.vaccinated),
    last_vet_visit:   String(d.last_vet_visit ?? ''),
    vet_name:         String(d.vet_name ?? ''),
    vet_phone:        String(d.vet_phone ?? ''),
    medical_notes:    String(d.medical_notes ?? ''),
    special_needs_text: String(d.special_needs_text ?? ''),
    in_quarantine:    Boolean(d.in_quarantine),
    quarantine_start: String(d.quarantine_start ?? ''),
    quarantine_end:   String(d.quarantine_end ?? d.quarantine_until ?? ''),
    quarantine_vet:   String(d.quarantine_vet ?? ''),
    good_with_kids:   boolToGoodWith(d.good_with_kids),
    good_with_dogs:   boolToGoodWith(d.good_with_dogs),
    good_with_cats:   boolToGoodWith(d.good_with_cats),
    good_with_other_animals: boolToGoodWith(d.good_with_other_animals),
    good_with_adults: String(d.good_with_adults ?? 'unknown'),
    activity_level:   String(d.activity_level ?? ''),
    care_difficulty:  String(d.care_difficulty ?? ''),
    suitable_for_flat:  d.suitable_for_flat !== false,
    suitable_for_house: d.suitable_for_house !== false,
    description:      String(d.description ?? ''),
    story:            String(d.story ?? ''),
    adoption_fee:     d.adoption_fee != null ? String(d.adoption_fee) : '',
    adopter_requirements: String(d.adopter_requirements ?? ''),
    in_foster:        Boolean(d.in_foster),
    published:        Boolean(d.published),
    found_location:   String(d.found_location ?? ''),
    found_date:       String(d.found_date ?? ''),
    rescue_find_type: String(d.rescue_find_type ?? ''),
    rescue_prognosis: String(d.rescue_prognosis ?? 'unknown'),
    rescue_public_description: String(d.rescue_public_description ?? ''),
    internal_notes:   String(d.internal_notes ?? ''),
    not_for_adoption_reason: String(d.not_for_adoption_reason ?? ''),
    conditional_adopter_name:  String(d.conditional_adopter_name ?? ''),
    conditional_adopter_phone: String(d.conditional_adopter_phone ?? ''),
    conditional_adopter_email: String(d.conditional_adopter_email ?? ''),
    conditional_adoption_since: String(d.conditional_adoption_since ?? ''),
    conditional_adoption_note:  String(d.conditional_adoption_note ?? ''),
  }
}
type FormState = ReturnType<typeof initFormData>

// ── Main Component ─────────────────────────────────────────────────────────────
export function AnimalForm({
  institutionId, institutionType, species: initialSpecies,
  mode, initialData, animal, statusHistory = [], auditLog = [],
}: AnimalFormProps) {
  const router    = useRouter()
  const isShelter = institutionType === 'shelter'
  const source    = initialData ?? animal

  const [form, setForm] = useState<FormState>(() => initFormData(source))
  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{msg:string;ok:boolean}|null>(null)
  const [errors, setErrors]       = useState<Record<string,string>>({})
  const [changeNote, setChangeNote] = useState('')

  // Species
  const [speciesList, setSpeciesList]   = useState<Species[]>(initialSpecies)
  const [addingSpecies, setAddingSpecies] = useState(false)
  const [customSpeciesName, setCustomSpeciesName] = useState('')
  const [savingSpecies, setSavingSpecies] = useState(false)

  // Breeds
  const [breeds, setBreeds]           = useState<Breed[]>([])
  const [breedSearch, setBreedSearch] = useState(source?.breed as string ?? '')
  const [breedOpen, setBreedOpen]     = useState(false)
  const [breedsLoading, setBreedsLoading] = useState(false)
  const breedRef = useRef<HTMLDivElement>(null)

  // Vaccinations
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>(() =>
    parseVaccinations(source?.vaccination_records)
  )
  const [addingVaccine, setAddingVaccine] = useState(false)
  const [newVaccine, setNewVaccine] = useState({ type: '', label: '', last_date: '', custom: false })

  // Medications
  const [medications, setMedications] = useState<MedicationEntry[]>(() =>
    parseMedications(source?.medications_data)
  )

  // Medical records (create mode only)
  const [medRecords, setMedRecords] = useState<LocalRecord[]>([])

  // Photos
  const [pendingPhotos, setPendingPhotos]   = useState<PendingPhoto[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    Array.isArray(source?.photos) ? (source.photos as string[]) : []
  )
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([])
  const [primaryIdx, setPrimaryIdx]       = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const animalId = source?.id as string | undefined

  const set = useCallback(<K extends keyof FormState>(field: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: val }))
    setErrors(prev => { const n = {...prev}; delete n[field]; return n })
  }, [])

  // ── Load breeds when species changes ──────────────────────────────────────
  useEffect(() => {
    if (!form.species_id) { setBreeds([]); return }
    setBreedsLoading(true)
    fetch(`/api/breeds?species_id=${form.species_id}`)
      .then(r => r.json())
      .then((data: Breed[]) => setBreeds(Array.isArray(data) ? data : []))
      .finally(() => setBreedsLoading(false))
  }, [form.species_id])

  // Close breed dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (breedRef.current && !breedRef.current.contains(e.target as Node)) setBreedOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Species handlers ───────────────────────────────────────────────────────
  async function handleAddSpecies() {
    if (!customSpeciesName.trim()) return
    setSavingSpecies(true)
    try {
      const res = await fetch('/api/species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name_cs: customSpeciesName.trim(), category: isShelter ? 'domestic' : 'wild' }),
      })
      const newSpecies = await res.json()
      if (!res.ok) throw new Error(newSpecies.error)
      setSpeciesList(prev => [...prev, newSpecies])
      set('species_id', newSpecies.id)
      setAddingSpecies(false)
      setCustomSpeciesName('')
    } catch (e) {
      showToast(`Chyba: ${e instanceof Error ? e.message : 'Neznámá'}`, false)
    } finally { setSavingSpecies(false) }
  }

  // ── Breed handlers ─────────────────────────────────────────────────────────
  const filteredBreeds = breedSearch.trim()
    ? breeds.filter(b => b.name_cs.toLowerCase().includes(breedSearch.toLowerCase()))
    : breeds

  function selectBreed(b: Breed) {
    set('breed_id', b.id)
    set('breed', b.name_cs)
    setBreedSearch(b.name_cs)
    setBreedOpen(false)
  }

  async function addCustomBreed() {
    if (!breedSearch.trim() || !form.species_id) return
    try {
      const res = await fetch('/api/breeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species_id: form.species_id, name_cs: breedSearch.trim() }),
      })
      const newBreed = await res.json()
      if (!res.ok) throw new Error(newBreed.error)
      setBreeds(prev => [...prev, newBreed])
      selectBreed(newBreed)
      showToast(`Přidáno plemeno: ${newBreed.name_cs}`)
    } catch (e) {
      showToast(`Chyba: ${e instanceof Error ? e.message : 'Neznámá'}`, false)
    }
  }

  // ── Vaccination handlers ───────────────────────────────────────────────────
  function addVaccination() {
    if (!newVaccine.type && !newVaccine.label) return
    const label = newVaccine.custom ? newVaccine.label : (PREDEFINED_VACCINES.find(v => v.type === newVaccine.type)?.label ?? newVaccine.type)
    setVaccinations(prev => [...prev, { _key: uid(), type: newVaccine.custom ? newVaccine.label : newVaccine.type, label, last_date: newVaccine.last_date }])
    setNewVaccine({ type: '', label: '', last_date: '', custom: false })
    setAddingVaccine(false)
  }

  function updateVaccination(_key: string, field: keyof Omit<VaccinationRecord,'_key'>, val: string) {
    setVaccinations(prev => prev.map(v => v._key === _key ? { ...v, [field]: val } : v))
  }

  function removeVaccination(_key: string) {
    setVaccinations(prev => prev.filter(v => v._key !== _key))
  }

  // ── Medication handlers ────────────────────────────────────────────────────
  function addMedication() {
    setMedications(prev => [...prev, { _key: uid(), name: '', dosage: '', frequency: '' }])
  }

  function updateMedication(_key: string, field: keyof Omit<MedicationEntry,'_key'>, val: string) {
    setMedications(prev => prev.map(m => m._key === _key ? { ...m, [field]: val } : m))
  }

  function removeMedication(_key: string) {
    setMedications(prev => prev.filter(m => m._key !== _key))
  }

  // ── Photo handlers ─────────────────────────────────────────────────────────
  function handleFileDrop(files: FileList | null) {
    if (!files) return
    const next: PendingPhoto[] = []
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue
      if (f.size > 8 * 1024 * 1024) { showToast(`${f.name} je příliš velký (max 8 MB)`, false); continue }
      next.push({ file: f, preview: URL.createObjectURL(f) })
    }
    setPendingPhotos(prev => [...prev, ...next])
  }

  async function uploadPhotos(aid: string): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (const p of pendingPhotos) {
      const ext  = p.file.name.split('.').pop() ?? 'jpg'
      const path = `${institutionId}/${aid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('animal-photos').upload(path, p.file)
      if (error) { showToast(`Upload selhal: ${p.file.name}`, false); continue }
      const { data } = supabase.storage.from('animal-photos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(publish: boolean) {
    const errs: Record<string,string> = {}
    if (!form.name.trim())     errs.name           = 'Povinné pole'
    if (!form.species_id)      errs.species_id     = 'Povinné pole'
    if (!form.sex)             errs.sex            = 'Povinné pole'
    if (!form.adoption_status) errs.adoption_status= 'Povinné pole'
    if (!form.intake_date)     errs.intake_date    = 'Povinné pole'
    if (publish && existingPhotos.length === 0 && pendingPhotos.length === 0)
      errs.photos = 'Pro zveřejnění je potřeba alespoň jedna fotka'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(publish: boolean) {
    if (!validate(publish)) {
      showToast('Oprav chyby ve formuláři', false); setActiveTab('basic'); return
    }
    setSaving(true)
    try {
      const ageNum    = form.ageValue ? parseInt(form.ageValue) : null
      const birth_year = ageNum !== null && form.ageUnit === 'years' ? new Date().getFullYear() - ageNum : null
      const age_months = ageNum !== null && form.ageUnit === 'months' ? ageNum : null

      const payload: Record<string, unknown> = {
        name: form.name.trim(), species_id: form.species_id, sex: form.sex,
        birth_year, age_months,
        breed_id: form.breed_id || null,
        breed: form.breed || null,
        color: form.color || null, size: form.size || null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        chip_number: form.chip_number || null, chip_date: form.chip_date || null,
        passport_number: form.passport_number || null,
        intake_date: form.intake_date || null, origin: form.origin || null,
        adoption_status: form.adoption_status, urgent: form.urgent,
        health_status: form.health_status,
        neutered: form.neutered === 'yes' ? true : form.neutered === 'no' ? false : null,
        vaccinated: form.vaccinated,
        vaccination_records: vaccinations.map(({ _key: _, ...v }) => v),
        medications_data: medications.filter(m => m.name.trim()).map(({ _key: _, ...m }) => m),
        last_vet_visit: form.last_vet_visit || null,
        vet_name: form.vet_name || null, vet_phone: form.vet_phone || null,
        medical_notes: form.medical_notes || null,
        in_quarantine:    form.in_quarantine,
        quarantine_start: form.quarantine_start || null,
        quarantine_end:   form.quarantine_end   || null,
        quarantine_vet:   form.quarantine_vet   || null,
        good_with_kids: form.good_with_kids, good_with_dogs: form.good_with_dogs,
        good_with_cats: form.good_with_cats, good_with_other_animals: form.good_with_other_animals,
        good_with_adults: form.good_with_adults,
        activity_level: form.activity_level || null, care_difficulty: form.care_difficulty || null,
        suitable_for_flat: form.suitable_for_flat, suitable_for_house: form.suitable_for_house,
        description: form.description || null,
        story: form.story || null,
        adoption_fee: form.adoption_fee ? parseInt(form.adoption_fee) : null,
        adopter_requirements: form.adopter_requirements || null,
        in_foster: form.in_foster, published: publish,
        found_location: form.found_location || null, found_date: form.found_date || null,
        rescue_find_type: form.rescue_find_type || null,
        rescue_prognosis: form.rescue_prognosis || null,
        rescue_public_description: form.rescue_public_description || null,
        internal_notes: form.internal_notes || null,
        not_for_adoption_reason: form.not_for_adoption_reason || null,
        conditional_adopter_name:  form.conditional_adopter_name || null,
        conditional_adopter_phone: form.conditional_adopter_phone || null,
        conditional_adopter_email: form.conditional_adopter_email || null,
        conditional_adoption_since: form.conditional_adoption_since || null,
        conditional_adoption_note:  form.conditional_adoption_note || null,
      }

      let savedId = animalId

      if (mode === 'create') {
        const res = await fetch('/api/animals', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, institution_id: institutionId }),
        })
        if (!res.ok) throw new Error(await res.text())
        savedId = (await res.json()).id

        // POST medical records created in the wizard
        if (savedId && medRecords.length > 0) {
          for (const rec of medRecords) {
            await fetch(`/api/animals/${savedId}/medical-records`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                record_date:   rec.record_date,
                record_type:   rec.record_type,
                title:         rec.title,
                description:   rec.description ?? null,
                vet_name:      rec.vet_name ?? null,
                next_due_date: rec.next_due_date ?? null,
              }),
            })
          }
        }
      } else {
        const res = await fetch(`/api/animals/${animalId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, change_note: changeNote.trim() || null }),
        })
        if (!res.ok) throw new Error(await res.text())
      }

      if (savedId) {
        const newUrls  = pendingPhotos.length > 0 ? await uploadPhotos(savedId) : []
        const all      = [...existingPhotos, ...newUrls]
        const primary  = all[primaryIdx] ?? all[0] ?? null
        if (newUrls.length > 0 || removedPhotos.length > 0) {
          await fetch(`/api/animals/${savedId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photos: all, primary_photo: primary }),
          })
        }
      }

      showToast(publish ? 'Uloženo a zveřejněno ✓' : 'Uloženo jako draft ✓')
      if (mode === 'create') {
        setTimeout(() => router.push('/admin/animals'), 1200)
      }
    } catch (err) {
      showToast(`Chyba: ${err instanceof Error ? err.message : 'Neznámá'}`, false)
    } finally { setSaving(false) }
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'basic',       icon: '🐾', label: 'Základní' },
    { id: 'health',      icon: '💊', label: 'Zdraví' },
    ...(isShelter ? [{ id: 'personality' as Tab, icon: '❤️', label: 'Povaha' }] : []),
    { id: 'photos',      icon: '📷', label: 'Fotky' },
    { id: 'adopce',      icon: '📋', label: 'Adopce' },
    ...(!isShelter ? [{ id: 'rescue' as Tab, icon: '🦉', label: 'Záchrana' }] : []),
    ...(mode === 'edit' ? [{ id: 'history' as Tab, icon: '🕐', label: 'Historie' }] : []),
  ]

  const statusCards  = isShelter ? SHELTER_STATUS_CARDS : RESCUE_STATUS_CARDS
  const allPhotoUrls = [...existingPhotos, ...pendingPhotos.map(p => p.preview)]
  const errorCount   = Object.keys(errors).length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-bold text-white ${toast.ok ? 'bg-[#2D7A4F]' : 'bg-[#D83030]'}`}>
          {toast.msg}
        </div>
      )}

      {/* Tab bar — horizontally scrollable on mobile */}
      <div className="flex gap-1 bg-[#F0EDE8] rounded-xl p-1 mb-5 overflow-x-auto scrollbar-none">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all touch-manipulation flex-shrink-0 ${
              activeTab === t.id
                ? 'bg-white text-[#2C1810] shadow-sm'
                : 'text-[#8B6550] hover:bg-white/60 hover:text-[#2C1810]'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === 'basic' && errorCount > 0 && (
              <span className="bg-[#E8634A] text-white text-[9px] font-bold px-1 py-px rounded ml-0.5">{errorCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-[#F0EDE8] px-4 sm:px-6 py-5">

        {/* ═══ TAB: BASIC ═══ */}
        {activeTab === 'basic' && (
          <div>
            {errorCount > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-[#E8634A] bg-[#FDEAE6]">
                <p className="text-sm font-bold text-[#993C1D] mb-1.5">Oprav před uložením:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {errors.name          && <li className="text-xs text-[#993C1D]">Jméno — {errors.name}</li>}
                  {errors.species_id    && <li className="text-xs text-[#993C1D]">Druh zvířete — {errors.species_id}</li>}
                  {errors.sex           && <li className="text-xs text-[#993C1D]">Pohlaví — {errors.sex}</li>}
                  {errors.adoption_status && <li className="text-xs text-[#993C1D]">Status — {errors.adoption_status}</li>}
                  {errors.intake_date   && <li className="text-xs text-[#993C1D]">Datum příjmu — {errors.intake_date}</li>}
                  {errors.photos        && <li className="text-xs text-[#993C1D]">Fotky — {errors.photos}</li>}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Jméno" required error={errors.name}>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Max, Luna, Běla..." />
              </Field>

              <Field label="Druh zvířete" required error={errors.species_id}>
                {addingSpecies ? (
                  <div className="flex gap-2">
                    <input
                      className={inputCls + ' flex-1'} autoFocus
                      value={customSpeciesName} onChange={e => setCustomSpeciesName(e.target.value)}
                      placeholder="Název druhu..."
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSpecies(); if (e.key === 'Escape') setAddingSpecies(false) }}
                    />
                    <button type="button" onClick={handleAddSpecies} disabled={savingSpecies || !customSpeciesName.trim()}
                      className="px-3 py-2 rounded-md bg-[#E8634A] text-white text-sm font-bold disabled:opacity-50 touch-manipulation">
                      {savingSpecies ? '...' : 'OK'}
                    </button>
                    <button type="button" onClick={() => setAddingSpecies(false)}
                      className="px-3 py-2 rounded-md border-2 border-[#F0EDE8] text-[#8B6550] text-sm touch-manipulation">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select className={selectCls + ' flex-1'} value={form.species_id} onChange={e => set('species_id', e.target.value)}>
                      <option value="">Vyberte druh...</option>
                      {speciesList.map(s => <option key={s.id} value={s.id}>{s.name_cs}</option>)}
                    </select>
                    <button type="button" onClick={() => setAddingSpecies(true)} title="Přidat vlastní druh"
                      className="px-3 py-2 rounded-md border-2 border-[#F0EDE8] text-[#8B6550] text-sm font-bold hover:border-[#E8634A] hover:text-[#E8634A] transition-colors touch-manipulation whitespace-nowrap">
                      + Jiný
                    </button>
                  </div>
                )}
              </Field>
            </div>

            <Divider />

            {/* Pohlaví */}
            <div className="mb-5">
              <SectionTitle>Pohlaví <span className="text-[#E8634A] text-sm">*</span></SectionTitle>
              <div className="flex flex-wrap gap-2">
                {[{value:'female',label:'Samice'},{value:'male',label:'Samec'},{value:'unknown',label:'Neznámé'}].map(o => (
                  <RadioPill key={o.value} value={o.value} selected={form.sex === o.value} onChange={v => set('sex', v)}>{o.label}</RadioPill>
                ))}
              </div>
              {errors.sex && <p className="text-xs text-[#E8634A] mt-1">{errors.sex}</p>}
            </div>

            <Divider />

            {/* Stav */}
            <div className="mb-5">
              <SectionTitle>Stav <span className="text-[#E8634A] text-sm">*</span></SectionTitle>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {statusCards.map(c => (
                  <SelectCard key={c.value} value={c.value} selected={form.adoption_status === c.value}
                    icon={c.icon} label={c.label} onChange={v => set('adoption_status', v)} />
                ))}
              </div>
              {errors.adoption_status && <p className="text-xs text-[#E8634A] mt-1">{errors.adoption_status}</p>}

              {/* Důvod nevhodnosti k adopci */}
              {form.adoption_status === 'not_for_adoption' && (
                <div className="mt-3 p-4 rounded-xl bg-[#FFF5F2] border border-[#F5C4B3]">
                  <label className="block text-sm font-bold text-[#993C1D] mb-2">Důvod nevhodnosti k adopci</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-sm font-semibold text-[#2C1810] focus:outline-none focus:border-[#E8634A]"
                    value={form.not_for_adoption_reason}
                    onChange={e => set('not_for_adoption_reason', e.target.value)}
                  >
                    <option value="">— Vyberte důvod —</option>
                    <option value="owner_unresolved">⚖️ Nevyřešený majitel</option>
                    <option value="behavior">⚠️ Bezpečnostní riziko (agresivita)</option>
                    <option value="legal">🔒 Právní blokace (zabavení, soud)</option>
                    <option value="health">💊 Zdravotní nezpůsobilost</option>
                    <option value="protected_species">🌿 Chráněný / exotický druh</option>
                    <option value="other">📋 Jiný důvod (viz poznámky)</option>
                  </select>
                </div>
              )}

              {/* Varování: K adopci + aktivní karanténa */}
              {form.adoption_status === 'available' && form.quarantine_end && new Date(form.quarantine_end) > new Date() && (
                <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-[#FFF3D6] border border-[#F0A500]">
                  <span>⚠️</span>
                  <p className="text-xs font-semibold text-[#7a5800]">
                    Zvíře má aktivní karanténu do {new Date(form.quarantine_end).toLocaleDateString('cs-CZ')}. Status „K adopci" by neměl být nastaven dokud karanténa neskončí.
                  </p>
                </div>
              )}
            </div>

            <Divider />

            <SectionTitle>Detaily</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Datum příjmu" required error={errors.intake_date}>
                <input type="date" className={inputCls} value={form.intake_date} onChange={e => set('intake_date', e.target.value)} />
              </Field>

              {/* Breed search */}
              <Field label="Plemeno / rasa" hint={!form.species_id ? 'Nejprve vyberte druh' : undefined}>
                <div ref={breedRef} className="relative">
                  <input
                    className={inputCls}
                    value={breedSearch}
                    onChange={e => { setBreedSearch(e.target.value); set('breed', e.target.value); set('breed_id', ''); setBreedOpen(true) }}
                    onFocus={() => form.species_id && setBreedOpen(true)}
                    placeholder={form.species_id ? (breedsLoading ? 'Načítám...' : 'Hledat plemeno...') : 'Nejprve vyberte druh'}
                    disabled={!form.species_id}
                  />
                  {breedOpen && form.species_id && (
                    <div className="absolute z-20 w-full mt-1 bg-white border-2 border-[#F0EDE8] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {filteredBreeds.length > 0 ? filteredBreeds.map(b => (
                        <button key={b.id} type="button" onClick={() => selectBreed(b)}
                          className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#2C1810] hover:bg-[#FDEAE6] transition-colors border-b border-[#F0EDE8] last:border-0 touch-manipulation">
                          {b.name_cs}
                          {b.is_custom && <span className="ml-2 text-[10px] text-[#8B6550] font-normal">vlastní</span>}
                        </button>
                      )) : (
                        breedSearch.trim() ? (
                          <button type="button" onClick={addCustomBreed}
                            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#E8634A] hover:bg-[#FDEAE6] touch-manipulation">
                            ＋ Přidat „{breedSearch}" jako vlastní plemeno
                          </button>
                        ) : (
                          <div className="px-3 py-2.5 text-sm text-[#A09890]">Žádná plemena — začni psát</div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Přibližný věk">
                <div className="flex gap-2">
                  <input type="number" className={inputCls} style={{width:72}} value={form.ageValue}
                    onChange={e => set('ageValue', e.target.value)} placeholder="3" min="0" />
                  <select className={selectCls + ' flex-1'} value={form.ageUnit}
                    onChange={e => set('ageUnit', e.target.value as 'years'|'months')}>
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
                <input type="number" step="0.1" className={inputCls} value={form.weight_kg}
                  onChange={e => set('weight_kg', e.target.value)} placeholder="12.5" min="0" />
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

              <Field label="Místo nálezu">
                <input className={inputCls} value={form.found_location} onChange={e => set('found_location', e.target.value)} placeholder="Praha 5, Brno..." />
              </Field>
            </div>

            <div className="mt-4">
              <ToggleRow label="🆘 Urgentní adopce" desc="Zvíře bude zvýrazněno červeným štítkem" checked={form.urgent} onChange={v => set('urgent', v)} />
            </div>
          </div>
        )}

        {/* ═══ TAB: HEALTH ═══ */}
        {activeTab === 'health' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Celkový zdravotní stav">
                <select className={selectCls} value={form.health_status} onChange={e => set('health_status', e.target.value)}>
                  {HEALTH_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            <Divider />

            {/* Kastrace */}
            <div className="mb-5">
              <SectionTitle>Kastrace / sterilizace</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {[{value:'yes',label:'Ano'},{value:'no',label:'Ne'},{value:'planned',label:'Plánovaná'},{value:'unknown',label:'Nevím'}].map(o => (
                  <RadioPill key={o.value} value={o.value} selected={form.neutered === o.value} onChange={v => set('neutered', v)}>{o.label}</RadioPill>
                ))}
              </div>
            </div>

            <Divider />

            {/* Medical Records */}
            <div className="mb-5">
              <SectionTitle>Zdravotní záznamy</SectionTitle>
              <MedicalRecordsPanel
                animalId={mode === 'edit' ? animalId : undefined}
                onChange={mode === 'create' ? setMedRecords : undefined}
              />
            </div>

            <Divider />

            {/* Vet + other */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Veterinář">
                <input className={inputCls} value={form.vet_name} onChange={e => set('vet_name', e.target.value)} placeholder="MVDr. Jan Novák" />
              </Field>
              <Field label="Telefon na veterináře">
                <input type="tel" className={inputCls} value={form.vet_phone} onChange={e => set('vet_phone', e.target.value)} placeholder="+420 777 123 456" />
              </Field>
              <Field label="Datum poslední vet. návštěvy">
                <input type="date" className={inputCls} value={form.last_vet_visit} onChange={e => set('last_vet_visit', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Zdravotní poznámky" hint="Diagnózy, alergie, prodělaná onemocnění...">
                  <textarea className={textareaCls} rows={3} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} />
                </Field>
              </div>
            </div>

            <Divider />

            <div className="space-y-2.5">
              <SectionTitle>Karanténa</SectionTitle>
              <ToggleRow label="Zvíře je v karanténě" desc="Nebude zobrazeno na veřejných stránkách"
                checked={form.in_quarantine} onChange={v => set('in_quarantine', v)} />
              {form.in_quarantine && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <Field label="Zahájení karantény">
                    <input type="date" className={inputCls} value={form.quarantine_start} onChange={e => set('quarantine_start', e.target.value)} />
                  </Field>
                  <Field label="Konec karantény">
                    <input type="date" className={inputCls} value={form.quarantine_end} onChange={e => set('quarantine_end', e.target.value)} />
                  </Field>
                  <Field label="Karanténní veterinář">
                    <input className={inputCls} value={form.quarantine_vet} onChange={e => set('quarantine_vet', e.target.value)} placeholder="MVDr. ..." />
                  </Field>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: PERSONALITY (shelter) ═══ */}
        {activeTab === 'personality' && isShelter && (
          <div>
            <InfoBox type="tip" icon="💛">Čím víc vyplníš, tím snáz se zvíře adoptuje. Zájemci filtrují podle těchto vlastností.</InfoBox>

            <div className="mb-5">
              <SectionTitle>Kompatibilita</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {key:'good_with_kids',label:'Vztah k dětem'},
                  {key:'good_with_dogs',label:'Vztah k psům'},
                  {key:'good_with_cats',label:'Vztah ke kočkám'},
                  {key:'good_with_other_animals',label:'Vztah k jiným zvířatům'},
                ].map(({key,label}) => (
                  <Field key={key} label={label}>
                    <select className={selectCls} value={form[key as keyof FormState] as string}
                      onChange={e => set(key as keyof FormState, e.target.value as FormState[keyof FormState])}>
                      {GOOD_WITH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                ))}
                <Field label="Vztah k dospělým / cizím lidem">
                  <select className={selectCls} value={form.good_with_adults} onChange={e => set('good_with_adults', e.target.value)}>
                    {GOOD_WITH_ADULTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <Divider />

            <div className="mb-5">
              <SectionTitle>Energetická úroveň</SectionTitle>
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITY_CARDS.map(c => (
                  <SelectCard key={c.value} value={c.value} selected={form.activity_level === c.value}
                    icon={c.icon} label={c.label} onChange={v => set('activity_level', v)} />
                ))}
              </div>
            </div>

            <div className="mb-5">
              <SectionTitle>Náročnost chovu</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIFFICULTY_CARDS.map(c => (
                  <SelectCard key={c.value} value={c.value} selected={form.care_difficulty === c.value}
                    icon={c.icon} label={c.label} desc={c.desc} onChange={v => set('care_difficulty', v)} />
                ))}
              </div>
            </div>

            <div className="mb-5">
              <SectionTitle>Vhodné bydlení</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {[
                  {key:'suitable_for_flat',label:'🏢 Byt'},
                  {key:'suitable_for_house',label:'🏡 Dům se zahradou'},
                ].map(({key,label}) => (
                  <button key={key} type="button"
                    onClick={() => set(key as keyof FormState, !form[key as keyof FormState] as FormState[keyof FormState])}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all touch-manipulation ${
                      form[key as keyof FormState]
                        ? 'border-[#2D8A4E] bg-[#EAF3DE] text-[#1a5e2e]'
                        : 'border-[#F0EDE8] bg-white text-[#6B4030] hover:border-[#E8634A]'
                    }`}>
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-black ${form[key as keyof FormState] ? 'border-[#2D8A4E] bg-[#2D8A4E] text-white' : 'border-[#D5CFC8]'}`}>
                      {form[key as keyof FormState] ? '✓' : ''}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            <Field label="Popis povahy" hint="Zobrazí se návštěvníkům webu">
              <textarea className={textareaCls + ' min-h-[100px]'} rows={4} value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Bella je přátelská, miluje procházky..." />
            </Field>
          </div>
        )}

        {/* ═══ TAB: PHOTOS ═══ */}
        {activeTab === 'photos' && (
          <div>
            {errors.photos && <InfoBox type="warn" icon="📷">{errors.photos}</InfoBox>}
            {!errors.photos && allPhotoUrls.length === 0 && (
              <InfoBox type="warn" icon="📷">Zvíře bez fotky se obtížně adoptuje. Nahraj alespoň hlavní fotku.</InfoBox>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileDrop(e.dataTransfer.files) }}
              className="border-2 border-dashed border-[#D5CFC8] rounded-lg p-8 text-center cursor-pointer hover:border-[#E8634A] hover:bg-[#FDEAE6]/50 transition-colors mb-4 touch-manipulation"
            >
              <div className="text-3xl mb-2">📸</div>
              <div className="text-sm font-bold text-[#2C1810]">Klikni nebo přetáhni fotky</div>
              <div className="text-xs text-[#8B6550] mt-1">JPG, PNG, WebP · max 8 MB</div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFileDrop(e.target.files)} />
            </div>

            {allPhotoUrls.length > 0 && (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {existingPhotos.map((url, i) => (
                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#F0EDE8] group">
                      <Image src={url} alt="" fill className="object-cover" sizes="150px" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {i === primaryIdx && <span className="absolute top-1 left-1 bg-[#E8634A] text-white text-[9px] font-bold px-1.5 py-px rounded">Hlavní</span>}
                      <button type="button" onClick={() => setPrimaryIdx(i)} title="Nastavit jako hlavní"
                        className={`absolute bottom-1 left-1 text-base leading-none ${i === primaryIdx ? 'text-yellow-400' : 'text-white/60 opacity-0 group-hover:opacity-100'}`}>★</button>
                      <button type="button" onClick={() => { setExistingPhotos(p => p.filter(u => u !== url)); setRemovedPhotos(p => [...p, url]) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#E8634A] transition-all">×</button>
                    </div>
                  ))}
                  {pendingPhotos.map((p, i) => {
                    const gi = existingPhotos.length + i
                    return (
                      <div key={p.preview} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#E8634A]/30 group">
                        <Image src={p.preview} alt="" fill className="object-cover" sizes="150px" />
                        <span className="absolute top-1 left-1 bg-[#E8634A] text-white text-[9px] font-bold px-1.5 py-px rounded">Nová</span>
                        <button type="button" onClick={() => setPrimaryIdx(gi)}
                          className={`absolute bottom-1 left-1 text-base leading-none ${gi === primaryIdx ? 'text-yellow-400' : 'text-white/60 opacity-0 group-hover:opacity-100'}`}>★</button>
                        <button type="button" onClick={() => setPendingPhotos(prev => prev.filter((_,idx) => idx !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#E8634A]">×</button>
                      </div>
                    )
                  })}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-[#D5CFC8] flex items-center justify-center hover:border-[#E8634A] transition-colors touch-manipulation">
                    <span className="text-2xl text-[#A09890]">+</span>
                  </button>
                </div>
                <p className="text-xs text-[#8B6550] mt-2">{allPhotoUrls.length} fotek · ★ = nastavit jako hlavní</p>
              </>
            )}
          </div>
        )}

        {/* ═══ TAB: ADOPCE ═══ */}
        {activeTab === 'adopce' && (
          <div>
            <div className="mb-5">
              <SectionTitle>📖 Příběh zvířete</SectionTitle>
              <textarea className={textareaCls + ' min-h-[120px]'} rows={5} value={form.story}
                onChange={e => set('story', e.target.value)}
                placeholder="Jak se zvíře dostalo do útulku, co prožilo, jaké má zvyky..." />
            </div>

            <Divider />

            <div className="mb-5">
              <SectionTitle>Adopční podmínky</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Adopční poplatek (Kč)" hint="0 = zdarma">
                  <input type="number" className={inputCls} value={form.adoption_fee}
                    onChange={e => set('adoption_fee', e.target.value)} placeholder="0 = zdarma" min="0" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Požadavky na adoptéra">
                    <textarea className={textareaCls} rows={3} value={form.adopter_requirements}
                      onChange={e => set('adopter_requirements', e.target.value)}
                      placeholder="Zkušenost s plemenem, zahrada, bez malých dětí..." />
                  </Field>
                </div>
              </div>
            </div>

            <Divider />

            <div className="space-y-2.5 mb-5">
              <SectionTitle>Interní</SectionTitle>
              <ToggleRow label="Zvíře je v dočasné péči" desc="Nachází se u pečovatele, ne v útulku"
                checked={form.in_foster} onChange={v => set('in_foster', v)} />
              <Field label="Interní poznámky" hint="Vidí jen tým instituce">
                <textarea className={textareaCls} rows={2} value={form.internal_notes}
                  onChange={e => set('internal_notes', e.target.value)} />
              </Field>
            </div>

            <Divider />

            <div>
              <SectionTitle>Publikace</SectionTitle>
              <ToggleRow label="Publikovat na webu" desc="Zvíře se zobrazí na veřejných stránkách zozio.cz"
                checked={form.published} onChange={v => set('published', v)} />
            </div>
          </div>
        )}

        {/* ═══ TAB: RESCUE (rescue_station) ═══ */}
        {activeTab === 'rescue' && !isShelter && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Druh nálezu" hint="Jak bylo zvíře nalezeno">
                <input className={inputCls} value={form.rescue_find_type}
                  onChange={e => set('rescue_find_type', e.target.value)}
                  placeholder="Střet s vozidlem, vypadlé z hnízda..." />
              </Field>

              <Field label="Prognóza">
                <select className={selectCls} value={form.rescue_prognosis} onChange={e => set('rescue_prognosis', e.target.value)}>
                  {RESCUE_PROGNOSIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <Field label="Místo nálezu">
                <input className={inputCls} value={form.found_location} onChange={e => set('found_location', e.target.value)} placeholder="Např. Praha 5..." />
              </Field>

              <Field label="Datum nálezu">
                <input type="date" className={inputCls} value={form.found_date} onChange={e => set('found_date', e.target.value)} />
              </Field>

              <Field label="Vztah k lidem">
                <select className={selectCls} value={form.good_with_adults} onChange={e => set('good_with_adults', e.target.value)}>
                  {GOOD_WITH_ADULTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Veřejný popis případu" hint="Záchranný příběh zobrazený na webu">
                  <textarea className={textareaCls + ' min-h-[100px]'} value={form.rescue_public_description}
                    onChange={e => set('rescue_public_description', e.target.value)} placeholder="Sova byla nalezena..." />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Interní poznámky">
                  <textarea className={textareaCls} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: HISTORY ═══ */}
        {activeTab === 'history' && (
          <div>
            <SectionTitle>🕐 Historie úprav</SectionTitle>
            {auditLog.length === 0 ? (
              <div className="text-center py-10 text-[#A09890]">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">Zatím žádné záznamy o úpravách</p>
                <p className="text-xs mt-1">Každá uložená změna se zde zobrazí s přehledem co a jak se změnilo.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#F0EDE8]" />
                <div className="space-y-5">
                  {auditLog.map((entry, i) => {
                    const date    = new Date(entry.changed_at)
                    const dateStr = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })
                    const timeStr = date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
                    const isFirst = i === 0
                    return (
                      <div key={entry.id} className="flex gap-4 pl-10 relative">
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 top-1.5 flex-shrink-0 ${isFirst ? 'bg-[#E8634A] border-[#E8634A]' : 'bg-white border-[#D5CFC8]'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-[#2C1810]">{dateStr}</span>
                            <span className="text-xs text-[#A09890]">{timeStr}</span>
                            {entry.change_note && (
                              <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-semibold">
                                💬 {entry.change_note}
                              </span>
                            )}
                          </div>
                          {entry.changes.length > 0 && (
                            <div className="space-y-1">
                              {entry.changes.map((c, ci) => (
                                <div key={ci} className="flex flex-wrap items-center gap-1.5 text-xs">
                                  <span className="font-semibold text-[#6B4030]">{c.label}:</span>
                                  <span className="px-1.5 py-0.5 rounded bg-[#FCEBEB] text-[#D83030] line-through opacity-75">{c.old_value}</span>
                                  <span className="text-[#A09890]">→</span>
                                  <span className="px-1.5 py-0.5 rounded bg-[#EAF3DE] text-[#2D7A4F] font-semibold">{c.new_value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {entry.changes.length === 0 && entry.change_note && (
                            <p className="text-xs text-[#A09890]">Pouze poznámka, bez změn polí</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Sticky footer ═══ */}
        <div className="sticky bottom-0 bg-white border-t border-[#F0EDE8] -mx-4 sm:-mx-6 -mb-5 px-4 sm:px-6 py-3 rounded-b-xl mt-6 z-10">
          {mode === 'edit' && (
            <div className="mb-2.5">
              <textarea
                value={changeNote}
                onChange={e => setChangeNote(e.target.value)}
                placeholder="Poznámka ke změně (volitelné) — uloží se do historie..."
                rows={2}
                className="w-full px-3 py-2 rounded-md border-2 border-[#F0EDE8] bg-[#FAFAF8] text-xs text-[#2C1810] placeholder:text-[#B8AEA8] focus:outline-none focus:border-[#E8634A] transition-colors resize-none"
              />
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="text-xs text-[#A09890] hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D5CFC8] inline-block" />
              Neuloženo
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => handleSubmit(false)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 rounded-lg border-2 border-[#F0EDE8] bg-white text-sm font-bold text-[#6B4030] hover:bg-[#F5E6D3] disabled:opacity-50 transition-colors touch-manipulation">
                {saving ? 'Ukládám...' : 'Uložit jako draft'}
              </button>
              <button type="button" disabled={saving} onClick={() => handleSubmit(true)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 rounded-lg bg-[#E8634A] text-white text-sm font-bold shadow-[0_2px_12px_rgba(232,99,74,.3)] hover:bg-[#d4553e] disabled:opacity-50 transition-all touch-manipulation">
                {saving ? 'Ukládám...' : '✓ Uložit a zveřejnit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
