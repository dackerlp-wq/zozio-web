'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  ADOPTION_STATUS_LABEL, RESCUE_STATUS_LABEL,
  HEALTH_STATUS_LABEL, INTAKE_REASON_LABEL, SIZE_LABEL,
} from '@/lib/animal-labels'
import type { Animal, RescueCase } from '@/types/database'

interface StatusHistoryEntry {
  id: string
  action?: string
  old_status: string | null
  new_status: string
  changed_by?: string | null
  changed_at?: string
  note: string | null
  created_at?: string
}

interface AnimalFormProps {
  institutionId: string
  institutionType: string
  species: { id: string; name_cs: string; icon: string | null }[]
  mode: 'create' | 'edit'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animal?: Record<string, any>
  statusHistory?: StatusHistoryEntry[]
  currentUser?: { id: string; email: string }
}

interface VaccinationRecord {
  _key: string
  type: string
  label: string
  last_date: string
  batch_number?: string  // šarže — §13 zák. 166/1999 Sb.
  expiry_date?: string   // expirace vakcíny
  vet_name?: string      // veterinář, který aplikoval
}
interface MedicationEntry   { _key: string; name: string; dosage: string; frequency: string }

interface StatusHistoryEntry {
  id?: string
  status: string
  changed_at: string
  note?: string
  changed_by?: string
}

interface AnimalFormProps {
  institutionId:   string
  institutionType: 'shelter' | 'rescue_station'
  species:         Species[]
  mode:            'create' | 'edit'
  initialData?:    Record<string, unknown>
  animal?:         Record<string, unknown>
  statusHistory?:  StatusHistoryEntry[]
  currentUser?:    { id: string; name: string }
}

type Tab = 'basic' | 'intake' | 'identity' | 'health' | 'personality' | 'photos' | 'adopce' | 'rescue' | 'history'

interface PendingPhoto { file: File; preview: string }

// ── Status config ──────────────────────────────────────────────────────────────
const SHELTER_STATUS_CARDS = [
  { value: 'intake',         icon: '📥', label: 'V příjmu' },
  { value: 'available',      icon: '🏠', label: 'K adopci' },
  { value: 'reserved',       icon: '📌', label: 'Rezervováno' },
  { value: 'adopted',        icon: '✅', label: 'Adoptováno' },
  { value: 'foster',         icon: '🏡', label: 'Dočasná péče' },
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

const STATUS_LABEL: Record<string, string> = {
  intake: 'V příjmu', available: 'K adopci', reserved: 'Rezervováno',
  adopted: 'Adoptováno', foster: 'Dočasná péče', treatment: 'V léčbě',
  rehabilitation: 'Rehabilitace', released: 'Vypuštěn', deceased: 'Uhynul',
}

const HEALTH_STATUS_OPTIONS = [
  { value: 'healthy',      label: 'Zdravý' },
  { value: 'in_treatment', label: 'V léčbě' },
  { value: 'post_surgery', label: 'Po operaci' },
  { value: 'chronic',      label: 'Chronické onemocnění' },
  { value: 'unknown',      label: 'Neznámý' },
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
  { value: 'easy',   icon: '⭐',    label: 'Nenáročný',  desc: 'Pro začátečníky' },
  { value: 'medium', icon: '⭐⭐',  label: 'Střední',    desc: 'Mírná zkušenost' },
  { value: 'hard',   icon: '⭐⭐⭐', label: 'Náročný',   desc: 'Pro zkušené' },
  { value: 'expert', icon: '🏆',    label: 'Expert',     desc: 'Odborná péče' },
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

// ── CSS classes ────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-[9px] rounded-md border-2 border-[#F0EDE8] bg-white text-[13px] text-[#2C1810] placeholder:text-[#A09890] focus:outline-none focus:border-[#E8634A] transition-colors'
const selectCls = inputCls + ' appearance-none bg-[url("data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%23A09890%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_12px_center] pr-8'
const textareaCls = inputCls + ' resize-y min-h-[80px]'

// ── Sub-components ─────────────────────────────────────────────────────────────
function Field({ label, required, children, error, hint, law }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string; hint?: string; law?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-extrabold uppercase tracking-wide text-[#8B6550] flex items-center flex-wrap gap-0.5">
        {label}
        {required && <span className="text-[#E8634A] ml-0.5">*</span>}
        {law && <LawBadge>{law}</LawBadge>}
      </label>
      {children}
      {error && <p className="text-xs text-[#E8634A]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#A09890]">{hint}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-extrabold text-[15px] text-[#2C1810] mb-3 flex items-center gap-2">{children}</div>
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
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#2D8A4E]' : 'bg-[#D5CFC8]'}`}
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

function InfoBox({ type, icon, children }: { type: 'tip'|'warn'|'info'|'law'|'new'; icon: string; children: React.ReactNode }) {
  const styles = {
    warn: { bg: 'bg-[#FCEBEB]', text: 'text-[#D83030]', border: 'border-l-[3px] border-[#D83030]' },
    info: { bg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]', border: 'border-l-[3px] border-[#185FA5]' },
    tip:  { bg: 'bg-[#FFF3D6]', text: 'text-[#7a5800]', border: 'border-l-[3px] border-[#F0A500]' },
    law:  { bg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]', border: 'border-l-[3px] border-[#185FA5]' },
    new:  { bg: 'bg-[#EAF3DE]', text: 'text-[#1a5e2e]', border: 'border-l-[3px] border-[#2D8A4E]' },
  }
  const s = styles[type]
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm font-semibold mb-4 ${s.bg} ${s.text} ${s.border}`}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

// Badge zobrazující odkaz na zákon — zobrazuje se inline vedle popisku pole
function LawBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[9px] bg-[#E6F1FB] text-[#185FA5] px-1.5 py-px rounded font-bold ml-1 leading-none align-middle tracking-normal normal-case">
      {children}
    </span>
  )
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
    evidence_number:  String(d.evidence_number ?? ''),
    name:             String(d.name ?? ''),
    species_id:       String(d.species_id ?? ''),
    sex:              String(d.sex ?? ''),
    ageValue, ageUnit,
    breed_id:         String(d.breed_id ?? ''),
    breed:            String(d.breed ?? ''),
    is_crossbreed:    Boolean(d.is_crossbreed),
    breed2:           String(d.breed2 ?? ''),
    breed2_id:        String(d.breed2_id ?? ''),
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
    quarantine_until: String(d.quarantine_until ?? ''),
    quarantine_reason:String(d.quarantine_reason ?? ''),
    good_with_kids:   String(d.good_with_kids ?? 'unknown'),
    good_with_dogs:   String(d.good_with_dogs ?? 'unknown'),
    good_with_cats:   String(d.good_with_cats ?? 'unknown'),
    good_with_other_animals: String(d.good_with_other_animals ?? 'unknown'),
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
    internal_notes:      String(d.internal_notes ?? ''),
    identifying_marks:   String(d.identifying_marks ?? ''),
    intake_health_status: String(d.intake_health_status ?? ''),
    intake_weight_kg:    d.intake_weight_kg != null ? String(d.intake_weight_kg) : '',
    intake_description:  String(d.intake_description ?? ''),
    intake_box:          String(d.intake_box ?? ''),
    intake_municipality: String(d.intake_municipality ?? ''),
    neutered_date:       String(d.neutered_date ?? ''),
    neutered_vet:        String(d.neutered_vet ?? ''),
    passport_vet:        String(d.passport_vet ?? ''),
    passport_in_shelter: Boolean(d.passport_in_shelter),
    tatoo_number:        String(d.tatoo_number ?? ''),
    tatoo_location:      String(d.tatoo_location ?? ''),
    local_registered:    Boolean(d.local_registered),
    chip_read_ok:        d.chip_read_ok !== false,
    quarantine_notes:    String(d.quarantine_notes ?? ''),
    release_date:        String(d.release_date ?? ''),
    release_location:    String(d.release_location ?? ''),
    release_notes:       String(d.release_notes ?? ''),
    cites_protected:     Boolean(d.cites_protected),
    cites_number:        String(d.cites_number ?? ''),
    cites_level:         String(d.cites_level ?? ''),
    cites_authority:     String(d.cites_authority ?? ''),
    cites_permit:        String(d.cites_permit ?? ''),
    cites_notification_date: String(d.cites_notification_date ?? ''),
    ringed:              Boolean(d.ringed),
    ring_number:         String(d.ring_number ?? ''),

    // ── Zákonná evidence — příjem (§25b zák. 246/1992 Sb.) ─────────────────
    intake_time:             String(d.intake_time ?? ''),
    intake_worker:           String(d.intake_worker ?? ''),
    intake_finder_name:      String(d.intake_finder_name ?? ''),
    intake_finder_phone:     String(d.intake_finder_phone ?? ''),
    intake_finder_address:   String(d.intake_finder_address ?? ''),
    intake_finder_email:     String(d.intake_finder_email ?? ''),
    intake_finder_id:        String(d.intake_finder_id ?? ''),

    // ── Karanténa (Vyhl. 342/2012 Sb.) ──────────────────────────────────────
    quarantine_start:  String(d.quarantine_start ?? ''),
    quarantine_end:    String(d.quarantine_end ?? ''),
    quarantine_vet:    String(d.quarantine_vet ?? ''),
    quarantine_result: String(d.quarantine_result ?? ''),
    quarantine_box:    String(d.quarantine_box ?? ''),

    // ── Identifikace (§13 zák. 166/1999 Sb.) ─────────────────────────────────
    chip_implanter:    String(d.chip_implanter ?? ''),
    chip_location:     String(d.chip_location ?? ''),
    passport_issued:   String(d.passport_issued ?? ''),
    crz_registered:    Boolean(d.crz_registered),
    crz_reg_date:      String(d.crz_reg_date ?? ''),

    // ── Adoptér (§25b odst. 4 zák. 246/1992 Sb.) ─────────────────────────────
    adopter_name:          String(d.adopter_name ?? ''),
    adopter_address:       String(d.adopter_address ?? ''),
    adopter_phone:         String(d.adopter_phone ?? ''),
    adopter_email:         String(d.adopter_email ?? ''),
    adopter_id_number:     String(d.adopter_id_number ?? ''),
    adoption_contract_num: String(d.adoption_contract_num ?? ''),
    adoption_date:         String(d.adoption_date ?? ''),

    // ── Odchod ───────────────────────────────────────────────────────────────
    exit_type:   String(d.exit_type ?? ''),
    exit_date:   String(d.exit_date ?? ''),
    exit_notes:  String(d.exit_notes ?? ''),
    exit_worker: String(d.exit_worker ?? ''),

    // ── Přemístění ────────────────────────────────────────────────────────────
    transfer_institution: String(d.transfer_institution ?? ''),
    transfer_date:        String(d.transfer_date ?? ''),
    transfer_doc_number:  String(d.transfer_doc_number ?? ''),

    // ── Uhynutí / likvidace (VZ 255/2012 Sb.) ────────────────────────────────
    death_date:          String(d.death_date ?? ''),
    death_type:          String(d.death_type ?? ''),
    death_cause:         String(d.death_cause ?? ''),
    death_vet:           String(d.death_vet ?? ''),
    disposal_method:     String(d.disposal_method ?? ''),
    disposal_doc_number: String(d.disposal_doc_number ?? ''),
    disposal_company:    String(d.disposal_company ?? ''),
  }
}
type FormState = ReturnType<typeof initFormData>

// ── Main Component ─────────────────────────────────────────────────────────────
export function AnimalForm({
  institutionId, institutionType, species: initialSpecies,
  mode, initialData, animal, statusHistory = [],
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
  // Breed2 (kříženec)
  const [breed2Search, setBreed2Search] = useState(source?.breed2 as string ?? '')
  const [breed2Open, setBreed2Open]     = useState(false)
  const breed2Ref = useRef<HTMLDivElement>(null)

  // Vaccinations
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>(() =>
    parseVaccinations(source?.vaccination_records)
  )
  const [addingVaccine, setAddingVaccine] = useState(false)
  const [newVaccine, setNewVaccine] = useState({ type: '', label: '', last_date: '', batch_number: '', expiry_date: '', vet_name: '', custom: false })

  // Antiparasitika
  const [antiparasitics, setAntiparasitics] = useState<AntiparasiticEntry[]>(() => {
    const raw = (source as any)?.antiparasitics_data
    if (!Array.isArray(raw)) return []
    return raw.map((x: any) => ({ _key: uid(), name: x.name ?? '', type: x.type ?? '', date: x.date ?? '' }))
  })

  const [photos, setPhotos]             = useState<string[]>(animal?.photos ?? [])
  const [primaryPhoto, setPrimaryPhoto] = useState<string>(animal?.primary_photo ?? '')
  const [uploading, setUploading]       = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [changeNote, setChangeNote]     = useState('')  // poznámka ke každé změně
  const [localHistory, setLocalHistory] = useState<StatusHistoryEntry[]>(statusHistory)

  const update = (key: string, value: string | boolean | number | null) =>
    setForm(prev => ({ ...prev, [key]: value }))

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

  // Close breed dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (breedRef.current && !breedRef.current.contains(e.target as Node)) setBreedOpen(false)
      if (breed2Ref.current && !breed2Ref.current.contains(e.target as Node)) setBreed2Open(false)
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
  function normBreed(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  }

  const filteredBreeds = breedSearch.trim()
    ? breeds.filter(b => normBreed(b.name_cs).includes(normBreed(breedSearch)))
    : breeds

  // Exact duplicate — same name after normalization
  const exactMatch = breedSearch.trim()
    ? breeds.find(b => normBreed(b.name_cs) === normBreed(breedSearch))
    : null

  function selectBreed(b: Breed) {
    set('breed_id', b.id)
    set('breed', b.name_cs)
    setBreedSearch(b.name_cs)
    setBreedOpen(false)
  }

  async function addCustomBreed() {
    if (!breedSearch.trim() || !form.species_id) return
    // If exact match exists, select it instead of creating duplicate
    if (exactMatch) { selectBreed(exactMatch); return }
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
      showToast(`Přidáno: ${newBreed.name_cs} — superadmin doplní profil`)
    } catch (e) {
      showToast(`Chyba: ${e instanceof Error ? e.message : 'Neznámá'}`, false)
    }
  }

  // ── Breed2 handlers ────────────────────────────────────────────────────────
  const filteredBreeds2 = breed2Search.trim()
    ? breeds.filter(b => normBreed(b.name_cs).includes(normBreed(breed2Search)))
    : breeds

  function selectBreed2(b: Breed) {
    set('breed2_id', b.id)
    set('breed2', b.name_cs)
    setBreed2Search(b.name_cs)
    setBreed2Open(false)
  }

  function clearBreed2() {
    set('breed2_id', '')
    set('breed2', '')
    setBreed2Search('')
  }

  // ── Vaccination handlers ───────────────────────────────────────────────────
  function addVaccination() {
    if (!newVaccine.type && !newVaccine.label) return
    const label = newVaccine.custom ? newVaccine.label : (PREDEFINED_VACCINES.find(v => v.type === newVaccine.type)?.label ?? newVaccine.type)
    setVaccinations(prev => [...prev, {
      _key: uid(),
      type: newVaccine.custom ? newVaccine.label : newVaccine.type,
      label,
      last_date: newVaccine.last_date,
      batch_number: newVaccine.batch_number || undefined,
      expiry_date: newVaccine.expiry_date || undefined,
      vet_name: newVaccine.vet_name || undefined,
    }])
    setNewVaccine({ type: '', label: '', last_date: '', batch_number: '', expiry_date: '', vet_name: '', custom: false })
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
    if (publish && existingPhotos.length === 0 && pendingPhotos.length === 0)
      errs.photos = 'Pro zveřejnění je potřeba alespoň jedna fotka'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (isShelter && !form.name) { setError('Zadej jméno zvířete'); return }
    setLoading(true)
    setError(null)

    const table  = isShelter ? 'animals' : 'rescue_cases'
    const url    = mode === 'create' ? `/api/${table}` : `/api/${table}/${animal!.id}`
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
      finder_name:         form.finder_name         || null,
      finder_phone:        form.finder_phone        || null,
      vet_name:            form.vet_name            || null,
      vet_phone:           form.vet_phone           || null,
      last_vet_visit:      form.last_vet_visit      || null,
      medications:         form.medications         || null,
      in_quarantine:       form.in_quarantine,
      quarantine_until:    form.quarantine_until    || null,
      weight_g:            form.weight_g            ? parseInt(form.weight_g)     : null,
      ring_number:         form.ring_number         || null,
      release_location:    form.release_location    || null,
      internal_notes:      form.internal_notes      || null,
      staff_assigned:      form.staff_assigned      || null,
      intake_date:         form.intake_date         || null,
      intake_reason:       form.intake_reason       || null,
      intake_notes:        form.intake_notes        || null,
      photos,
      primary_photo:       primaryPhoto             || null,
      published:           form.published,
    }
    setSaving(true)
    try {
      const ageNum    = form.ageValue ? parseInt(form.ageValue) : null
      const birth_year = ageNum !== null && form.ageUnit === 'years' ? new Date().getFullYear() - ageNum : null
      const age_months = ageNum !== null && form.ageUnit === 'months' ? ageNum : null

      const payload: Record<string, unknown> = {
        name: form.name.trim(), species_id: form.species_id, sex: form.sex,
        ...(form.evidence_number.trim() ? { evidence_number: form.evidence_number.trim() } : {}),
        birth_year, age_months,
        breed_id: form.breed_id || null,
        breed: form.breed || null,
        is_crossbreed: form.is_crossbreed,
        breed2: form.is_crossbreed ? (form.breed2 || null) : null,
        breed2_id: form.is_crossbreed ? (form.breed2_id || null) : null,
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
        in_quarantine: form.in_quarantine,
        quarantine_until: form.quarantine_until || null,
        quarantine_reason: form.quarantine_reason || null,
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

        // ── Příjem — rozšířené ───────────────────────────────────────────────
        intake_time:              form.intake_time || null,
        intake_worker:            form.intake_worker || null,
        intake_municipality:      form.intake_municipality || null,
        intake_box:               form.intake_box || null,
        intake_health_status:     form.intake_health_status || null,
        intake_weight_kg:         form.intake_weight_kg ? parseFloat(form.intake_weight_kg) : null,
        intake_description:       form.intake_description || null,
        identifying_marks:        form.identifying_marks || null,
        special_needs_text:       form.special_needs_text || null,

    // Zaznamenej do historie — VŽDY při uložení (ne jen při změně stavu)
    const animalId = mode === 'create' ? data.id : animal!.id

        // ── Karanténa ────────────────────────────────────────────────────────
        quarantine_start:  form.quarantine_start || null,
        quarantine_end:    form.quarantine_end || null,
        quarantine_vet:    form.quarantine_vet || null,
        quarantine_result: form.quarantine_result || null,
        quarantine_box:    form.quarantine_box || null,
        quarantine_notes:  form.quarantine_notes || null,

        // ── Identifikace ──────────────────────────────────────────────────────
        chip_implanter:     form.chip_implanter || null,
        chip_location:      form.chip_location || null,
        chip_read_ok:       form.chip_read_ok,
        passport_issued:    form.passport_issued || null,
        passport_vet:       form.passport_vet || null,
        passport_in_shelter: form.passport_in_shelter,
        crz_registered:     form.crz_registered,
        crz_reg_date:       form.crz_reg_date || null,
        local_registered:   form.local_registered,
        tatoo_number:       form.tatoo_number || null,
        tatoo_location:     form.tatoo_location || null,
        neutered_date:      form.neutered_date || null,
        neutered_vet:       form.neutered_vet || null,

        // ── Adoptér ──────────────────────────────────────────────────────────
        adopter_name:          form.adopter_name || null,
        adopter_address:       form.adopter_address || null,
        adopter_phone:         form.adopter_phone || null,
        adopter_email:         form.adopter_email || null,
        adopter_id_number:     form.adopter_id_number || null,
        adoption_contract_num: form.adoption_contract_num || null,
        adoption_date:         form.adoption_date || null,

        // ── Záchrana / rescue ─────────────────────────────────────────────────
        release_date:     form.release_date || null,
        release_location: form.release_location || null,
        release_notes:    form.release_notes || null,
        cites_protected:  form.cites_protected,
        cites_number:     form.cites_number || null,
        cites_level:      form.cites_level || null,
        cites_authority:  form.cites_authority || null,
        cites_permit:     form.cites_permit || null,
        cites_notification_date: form.cites_notification_date || null,
        ringed:           form.ringed,
        ring_number:      form.ring_number || null,

        // ── Antiparazitika ───────────────────────────────────────────────────
        antiparasitics_data: antiparasitics.filter(ap => ap.name.trim()).map(({ _key: _, ...ap }) => ap),

        // ── Odchod ───────────────────────────────────────────────────────────
        exit_type:            form.exit_type || null,
        exit_date:            form.exit_date || null,
        exit_notes:           form.exit_notes || null,
        exit_worker:          form.exit_worker || null,
        transfer_institution: form.transfer_institution || null,
        transfer_date:        form.transfer_date || null,
        transfer_doc_number:  form.transfer_doc_number || null,

        // ── Uhynutí / likvidace ───────────────────────────────────────────────
        death_date:          form.death_date || null,
        death_type:          form.death_type || null,
        death_cause:         form.death_cause || null,
        death_vet:           form.death_vet || null,
        disposal_method:     form.disposal_method || null,
        disposal_doc_number: form.disposal_doc_number || null,
        disposal_company:    form.disposal_company || null,
      }

      let savedId = animalId

      if (mode === 'create') {
        const res = await fetch('/api/animals', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, institution_id: institutionId }),
        })
        if (!res.ok) throw new Error(await res.text())
        savedId = (await res.json()).id
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
      setTimeout(() => router.push('/admin/animals'), 1200)
    } catch (err) {
      showToast(`Chyba: ${err instanceof Error ? err.message : 'Neznámá'}`, false)
    } finally { setSaving(false) }
  }

  // ── Tabs ───────────────────────────────────────────────��───────────────────
  // badgeType: 'new' = červená (NOVÉ záložky), 'changed' = modrá (rozšíření)
  const tabs: { id: Tab; icon: string; label: string; badgeText?: string; badgeType?: 'new'|'changed' }[] = [
    { id: 'basic',       icon: '🐾', label: 'Základní' },
    { id: 'intake',      icon: '📥', label: 'Příjem',        badgeText: 'NOVÉ',  badgeType: 'new' },
    { id: 'identity',    icon: '🔖', label: 'Identifikace',  badgeText: 'NOVÉ',  badgeType: 'new' },
    { id: 'health',      icon: '💊', label: 'Zdraví',        badgeText: '+',     badgeType: 'changed' },
    ...(isShelter ? [{ id: 'personality' as Tab, icon: '❤️', label: 'Povaha' }] : []),
    { id: 'photos',      icon: '📷', label: 'Fotky' },
    { id: 'adopce',      icon: '📋', label: isShelter ? 'Adopce & Odchod' : 'Odchod', badgeText: '+', badgeType: 'changed' as const },
    ...(!isShelter ? [{ id: 'rescue' as Tab, icon: '🦉', label: 'Záchrana', badgeText: '+', badgeType: 'changed' as const }] : []),
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all touch-manipulation flex-shrink-0 ${
              activeTab === t.id
                ? 'bg-white text-[#2C1810] shadow-sm'
                : 'text-[#8B6550] hover:bg-white/60 hover:text-[#2C1810]'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === 'basic' && errorCount > 0 && (
              <span className="bg-[#E8634A] text-white text-[9px] font-extrabold px-1.5 py-px rounded-full ml-0.5">{errorCount}</span>
            )}
            {t.badgeText && activeTab !== t.id && (
              <span className={`hidden sm:inline text-white text-[9px] font-extrabold px-1.5 py-px rounded ml-0.5 uppercase tracking-wide ${
                t.badgeType === 'new' ? 'bg-[#E8634A]' : 'bg-[#185FA5]'
              }`}>{t.badgeText}</span>
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
                  {errors.photos        && <li className="text-xs text-[#993C1D]">Fotky — {errors.photos}</li>}
                </ul>
              </div>
            )}
            <InfoBox type="law" icon="⚖️">
              <strong>Zákonná povinnost</strong> — Evidence zvířat dle §25b zák. 246/1992 Sb. a Vyhl. č. 342/2012 Sb. musí obsahovat evidenční číslo, druh, pohlaví, věk, barvu, identifikační znaky a datum příjmu.
            </InfoBox>

            {/* Row 1: Jméno | Evidenční číslo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Jméno" required error={errors.name}>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Max, Luna, Běla..." />
              </Field>
              <Field label="Evidenční číslo" required law="§25b / Vyhl.342"
                hint="Generováno automaticky · lze přepsat vlastní (př. MB-2024-042)">
                {mode === 'edit' && (source as any)?.evidence_number ? (
                  <input className={inputCls + ' font-mono font-bold text-[#E8634A] bg-[#FDFCFA]'} value={String((source as any).evidence_number)} readOnly />
                ) : (
                  <input className={inputCls + ' font-mono font-bold text-[#E8634A] bg-[#FDFCFA]'}
                    value={form.evidence_number}
                    onChange={e => set('evidence_number', e.target.value)}
                    placeholder="Automaticky: ZOZ-2026-001" />
                )}
              </Field>
            </div>

            {/* Row 2: Druh zvířete | Pohlaví */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
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
                      <input type="checkbox" checked={(form as Record<string, unknown>)[key] as boolean} onChange={e => update(key, e.target.checked)} className={checkCls} />
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
                        <label key={key} className={`flex items-center gap-3 cursor-pointer p-3 rounded-md border-2 transition-all
                          ${(form as Record<string, unknown>)[key] === true
                            ? 'border-coral bg-coral-tag-bg'
                            : 'border-border bg-white'
                          }`}>
                          <input type="checkbox"
                            checked={(form as Record<string, unknown>)[key] === true}
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
                          className={`flex-1 py-2 rounded-md border-2 text-xs font-bold cursor-pointer transition-all
                            ${form.good_with_other_animals === value
                              ? 'border-coral bg-coral-tag-bg text-coral-tag-text'
                              : 'border-border bg-white text-text-body'
                            }`}>
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
                            className={`text-left p-2.5 rounded-md border-2 cursor-pointer transition-all
                              ${form.activity_level === value
                                ? 'border-coral bg-coral-tag-bg'
                                : 'border-border bg-white'
                              }`}>
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
                            className={`text-left p-2.5 rounded-md border-2 cursor-pointer transition-all
                              ${form.care_difficulty === value
                                ? 'border-coral bg-coral-tag-bg'
                                : 'border-border bg-white'
                              }`}>
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
                    <input type="checkbox" checked={(form as Record<string, unknown>)[key] as boolean} onChange={e => update(key, e.target.checked)} className={checkCls} />
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
              </Field>
              <Field label="Pohlaví" required error={errors.sex}>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {[{value:'female',label:'Samice'},{value:'male',label:'Samec'},{value:'unknown',label:'Neznámé'}].map(o => (
                    <RadioPill key={o.value} value={o.value} selected={form.sex === o.value} onChange={v => set('sex', v)}>{o.label}</RadioPill>
                  ))}
                </div>
              </Field>
            </div>

            <Divider />

            {/* Stav */}
            <div className="mb-5">
              <SectionTitle>📊 Stav zvířete <span className="text-[#E8634A] text-sm">*</span></SectionTitle>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {statusCards.map(c => (
                  <SelectCard key={c.value} value={c.value} selected={form.adoption_status === c.value}
                    icon={c.icon} label={c.label} onChange={v => set('adoption_status', v)} />
                ))}
              </div>
              {errors.adoption_status && <p className="text-xs text-[#E8634A] mt-1">{errors.adoption_status}</p>}
            </div>

            <Divider />

            <SectionTitle>📐 Popis zvířete</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

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

              <Field label="Barva / zbarvení" law="Zákon">
                <input className={inputCls} value={form.color} onChange={e => set('color', e.target.value)} placeholder="Černohnědá, tricolor, bílá s skvrnami..." />
              </Field>

              <Field label="Identifikační znaky" law="§25b" hint="Výrazné znaky pro zákonnou evidenci">
                <input className={inputCls} value={form.identifying_marks ?? ''} onChange={e => set('identifying_marks', e.target.value)} placeholder="Jizva na pravém uchu, bílá tečka..." />
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
                      {filteredBreeds.length > 0 ? (
                        <>
                          {filteredBreeds.map(b => (
                            <button key={b.id} type="button" onClick={() => selectBreed(b)}
                              className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#2C1810] hover:bg-[#FDEAE6] transition-colors border-b border-[#F0EDE8] last:border-0 touch-manipulation flex items-center justify-between gap-2">
                              <span>{b.name_cs}</span>
                              {b.is_custom && <span className="text-[10px] text-[#8B6550] font-normal flex-shrink-0">vlastní</span>}
                            </button>
                          ))}
                          {breedSearch.trim() && !exactMatch && (
                            <button type="button" onClick={addCustomBreed}
                              className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#E8634A] hover:bg-[#FDEAE6] transition-colors border-t border-[#F0EDE8] touch-manipulation">
                              ＋ Vytvořit „{breedSearch}"
                            </button>
                          )}
                        </>
                      ) : (
                        breedSearch.trim() ? (
                          <div>
                            <button type="button" onClick={addCustomBreed}
                              className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#E8634A] hover:bg-[#FDEAE6] touch-manipulation">
                              ＋ Vytvořit rasu „{breedSearch}"
                            </button>
                            <div className="px-3 py-2 text-[11px] text-[#A09890] border-t border-[#F0EDE8] leading-snug">
                              Rasa bude uložena bez detailního profilu.<br />Superadmin ji může doplnit v&nbsp;sekci Rasy zvířat.
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-2.5 text-sm text-[#A09890]">Začni psát název rasy...</div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Crossbreed checkbox */}
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={form.is_crossbreed}
                    onChange={e => {
                      set('is_crossbreed', e.target.checked)
                      if (!e.target.checked) clearBreed2()
                    }}
                    className="w-4 h-4 rounded accent-[#E8634A]"
                  />
                  <span className="text-sm font-semibold text-[#2C1810]">Kříženec</span>
                </label>
                {form.is_crossbreed && (
                  <p className="text-[11px] text-[#A09890] mt-1 leading-snug">
                    💡 První rasa musí být ta, která je na jedinci <strong>nejvíce viditelná</strong>. Druhá rasa je volitelná.
                  </p>
                )}
              </Field>

              {/* Breed2 — only when crossbreed */}
              {form.is_crossbreed && (
                <Field label="Druhá rasa (křížená)" hint="Volitelné">
                  <div ref={breed2Ref} className="relative">
                    <input
                      className={inputCls}
                      value={breed2Search}
                      onChange={e => { setBreed2Search(e.target.value); set('breed2', e.target.value); set('breed2_id', ''); setBreed2Open(true) }}
                      onFocus={() => form.species_id && setBreed2Open(true)}
                      placeholder="Hledat druhou rasu..."
                      disabled={!form.species_id}
                    />
                    {breed2Search && (
                      <button type="button" onClick={clearBreed2}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A09890] hover:text-[#2C1810] text-xs font-bold">
                        ✕
                      </button>
                    )}
                    {breed2Open && form.species_id && (
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 border-[#F0EDE8] rounded-lg shadow-lg max-h-44 overflow-y-auto">
                        {filteredBreeds2.length > 0 ? filteredBreeds2.map(b => (
                          <button key={b.id} type="button" onClick={() => selectBreed2(b)}
                            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#2C1810] hover:bg-[#FDEAE6] transition-colors border-b border-[#F0EDE8] last:border-0 touch-manipulation flex items-center justify-between gap-2">
                            <span>{b.name_cs}</span>
                            {b.is_custom && <span className="text-[10px] text-[#8B6550] font-normal flex-shrink-0">vlastní</span>}
                          </button>
                        )) : (
                          <div className="px-3 py-2.5 text-sm text-[#A09890]">
                            {breed2Search.trim() ? 'Rasa nenalezena' : 'Začni psát název rasy...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Live preview */}
                  {(form.breed || breed2Search) && (
                    <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#6B4030' }}>
                      Zobrazí se jako: <span style={{ color: '#E8634A' }}>
                        {form.breed}{breed2Search ? ` × ${breed2Search}` : '/kříženec'}
                      </span>
                    </p>
                  )}
                </Field>
              )}

            </div>

            <div className="mt-4">
              <ToggleRow label="🆘 Urgentní adopce" desc="Zvíře bude zvýrazněno červeným štítkem" checked={form.urgent} onChange={v => set('urgent', v)} />
            </div>
          </div>
        )}

        {/* ═══ TAB: PŘÍJEM (zákonná evidence) ═══ */}
        {activeTab === 'intake' && (
          <div>
            <InfoBox type="law" icon="⚖️">
              <strong>§25b zák. 246/1992 Sb.</strong> — Útulky jsou povinny evidovat datum a způsob přijetí každého zvířete, místo nálezu a kontakt na osobu, která zvíře předala. Záznamy musí být dostupné pro kontrolu SVS (Státní veterinární správa).
            </InfoBox>

            {/* Příjem — čas a pracovník */}
            <SectionTitle>📅 Příjem do útulku</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Datum příjmu" required law="Zákon">
                <input type="date" className={inputCls} value={form.intake_date}
                  onChange={e => set('intake_date', e.target.value)} />
              </Field>
              <Field label="Čas příjmu">
                <input type="time" className={inputCls} value={form.intake_time}
                  onChange={e => set('intake_time', e.target.value)} />
              </Field>
              <Field label="Přijal (pracovník)" law="Zákon">
                <input className={inputCls} value={form.intake_worker}
                  onChange={e => set('intake_worker', e.target.value)}
                  placeholder="Jana Nováková" />
              </Field>
              <Field label="Způsob příjmu" required law="§25b">
                <select className={selectCls} value={form.origin} onChange={e => set('origin', e.target.value)}>
                  <option value="">Vyberte...</option>
                  {ORIGIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Místo nálezu / původu" law="Zákon">
                <input className={inputCls} value={form.found_location}
                  onChange={e => set('found_location', e.target.value)}
                  placeholder="Ulice, čtvrť, obec..." />
              </Field>
              <Field label="Datum nálezu" law="Zákon" hint="Pokud se liší od data příjmu">
                <input type="date" className={inputCls} value={form.found_date}
                  onChange={e => set('found_date', e.target.value)} />
              </Field>
              <Field label="Obec/Správce (plátce)" law="Admin" hint="Obec, která financuje umístění">
                <input className={inputCls} value={form.intake_municipality}
                  onChange={e => set('intake_municipality', e.target.value)}
                  placeholder="Město Praha, Obec Beroun..." />
              </Field>
              <Field label="Box / výběh číslo">
                <input className={inputCls} value={form.intake_box}
                  onChange={e => set('intake_box', e.target.value)}
                  placeholder="B-12, K-4..." />
              </Field>
            </div>

            <Divider />

            {/* Nálezce / předávající — BEFORE Stav (matching mockup order) */}
            <SectionTitle>👤 Nálezce / Odevzdávající</SectionTitle>
            <InfoBox type="tip" icon="💡">Záznamy o odevzdávající osobě jsou důležité pro zpětné dohledání původu zvířete a případné uplatnění nákladů při neúspěšném hledání majitele.</InfoBox>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Jméno a příjmení" law="Zákon">
                <input className={inputCls} value={form.intake_finder_name}
                  onChange={e => set('intake_finder_name', e.target.value)}
                  placeholder="Jana Dvořáková" />
              </Field>
              <Field label="Telefon">
                <input type="tel" className={inputCls} value={form.intake_finder_phone}
                  onChange={e => set('intake_finder_phone', e.target.value)}
                  placeholder="+420 777 123 456" />
              </Field>
              <Field label="E-mail">
                <input type="email" className={inputCls} value={form.intake_finder_email}
                  onChange={e => set('intake_finder_email', e.target.value)}
                  placeholder="jana@email.cz" />
              </Field>
              <div className="sm:col-span-3">
                <Field label="Adresa (trvalé bydliště)">
                  <input className={inputCls} value={form.intake_finder_address}
                    onChange={e => set('intake_finder_address', e.target.value)}
                    placeholder="Ulice 12, Praha 5, 150 00" />
                </Field>
              </div>
              <Field label="Číslo OP / pasu nálezce">
                <input className={inputCls} value={form.intake_finder_id}
                  onChange={e => set('intake_finder_id', e.target.value)}
                  placeholder="123456789" />
              </Field>
            </div>

            <Divider />

            {/* Stav zvířete při příjmu */}
            <SectionTitle>🩺 Stav zvířete při příjmu</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Zdravotní stav při příjmu" law="Zákon">
                <select className={selectCls} value={form.intake_health_status}
                  onChange={e => set('intake_health_status', e.target.value)}>
                  <option value="">Dobrý — bez viditelných zranění</option>
                  <option value="malnourished">Podvyživený</option>
                  <option value="injured_mild">Zraněný — lehce</option>
                  <option value="injured_serious">Zraněný — vážně</option>
                  <option value="sick">Nemocný</option>
                  <option value="critical">Kritický stav</option>
                  <option value="unknown">Neznámý</option>
                </select>
              </Field>
              <Field label="Váha při příjmu (kg)">
                <input type="number" step="0.1" className={inputCls} value={form.intake_weight_kg}
                  onChange={e => set('intake_weight_kg', e.target.value)} placeholder="12.5" min="0" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Popis stavu při příjmu" law="Zákon">
                  <textarea className={textareaCls} rows={3} value={form.intake_description}
                    onChange={e => set('intake_description', e.target.value)}
                    placeholder="Zvíře bylo zanedbalé, zamaštěná srst, patrná podvýživa..." />
                </Field>
              </div>
            </div>

            <Divider />

            {/* Fotodokumentace při příjmu */}
            <SectionTitle>📷 Fotodokumentace při příjmu</SectionTitle>
            <InfoBox type="tip" icon="💡">Doporučuje se pořídit fotky při příjmu jako důkaz zdravotního stavu. Tyto fotky jsou interní a nezobrazují se veřejně.</InfoBox>
            <div className="border-2 border-dashed border-[#D5CFC8] rounded-lg p-5 text-center cursor-pointer hover:border-[#E8634A] hover:bg-[#FDEAE6]/50 transition-colors">
              <div className="text-2xl mb-1.5">📸</div>
              <div className="text-sm font-bold text-[#2C1810]">Nahrát fotky z příjmu (interní)</div>
              <div className="text-xs text-[#8B6550] mt-1">Nezobrazí se veřejně · slouží pro záznamy útulku</div>
            </div>
          </div>
        )}

        {/* ═══ TAB: IDENTIFIKACE ═══ */}
        {activeTab === 'identity' && (
          <div>
            <InfoBox type="law" icon="⚖️">
              <strong>§13 zák. 166/1999 Sb. (Veterinární zákon)</strong> — Povinné označení zvířat. Pes musí být označen čipem od 3 měsíců věku a zaevidován v Centrálním registru zvířat.
            </InfoBox>

            <SectionTitle>💉 Čipování</SectionTitle>
            {form.chip_number && (
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EAF3DE] text-[#1a5e2e] text-xs font-bold">✓ Čip nalezen</span>
                {form.chip_read_ok && <span className="text-xs text-[#8B6550]">· ověřeno čtečkou</span>}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Číslo čipu (15 číslic)" law="Zákon" hint="ISO 11784/11785 · 15místný kód">
                <input className={inputCls + ' font-mono tracking-wide font-bold'} value={form.chip_number}
                  onChange={e => set('chip_number', e.target.value)} placeholder="203 000 123 456 789" />
              </Field>
              <Field label="Datum čipování" law="Zákon">
                <input type="date" className={inputCls} value={form.chip_date} onChange={e => set('chip_date', e.target.value)} />
              </Field>
              <Field label="Veterinář čipování">
                <input className={inputCls} value={form.chip_implanter} onChange={e => set('chip_implanter', e.target.value)} placeholder="MVDr. Jan Novák" />
              </Field>
              <Field label="Umístění čipu">
                <select className={selectCls} value={form.chip_location} onChange={e => set('chip_location', e.target.value)}>
                  <option value="">Vyberte...</option>
                  <option value="left_neck">Levý krk (standard)</option>
                  <option value="right_neck">Pravý krk</option>
                  <option value="nape">Šíje</option>
                  <option value="other">Jiné místo</option>
                </select>
              </Field>
              <Field label="Čip byl čten čtečkou">
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <RadioPill value="true" selected={form.chip_read_ok === true} onChange={() => set('chip_read_ok', true)}>Ano</RadioPill>
                  <RadioPill value="false" selected={form.chip_read_ok === false} onChange={() => set('chip_read_ok', false)}>Ne</RadioPill>
                </div>
              </Field>
            </div>

            <Divider />

            <SectionTitle>📋 Registrace v databázích</SectionTitle>
            <InfoBox type="tip" icon="💡">Pes musí být zapsán do centrální databáze (pes.cz / chipdb.cz). Útulky jsou povinny provést přeregistraci po adopci na nového majitele.</InfoBox>
            <div className="flex flex-col gap-2 mb-5">
              <ToggleRow label="Zapsán v CRZ (Centrální registr zvířat)" desc="chipdb.cz · pes.cz · CRZ ČMKJ"
                checked={form.crz_registered} onChange={v => set('crz_registered', v)} />
              {form.crz_registered && (
                <div className="mt-1 ml-2">
                  <Field label="Datum registrace CRZ">
                    <input type="date" className={inputCls} value={form.crz_reg_date} onChange={e => set('crz_reg_date', e.target.value)} />
                  </Field>
                </div>
              )}
              <ToggleRow label="Registrován u obce (místní poplatek ze psa)" desc="Zák. č. 565/1990 Sb. — pro psy nad 3 měsíce"
                checked={form.local_registered} onChange={v => set('local_registered', v)} />
            </div>

            <Divider />

            <SectionTitle>📘 Pas zvířete / průkaz</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Field label="Číslo pasu">
                <input className={inputCls + ' font-mono'} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} placeholder="CZ 12345678" />
              </Field>
              <Field label="Datum vydání pasu">
                <input type="date" className={inputCls} value={form.passport_issued} onChange={e => set('passport_issued', e.target.value)} />
              </Field>
              <Field label="Vydávající veterinář">
                <input className={inputCls} value={form.passport_vet} onChange={e => set('passport_vet', e.target.value)} placeholder="MVDr. Jana Horáková" />
              </Field>
            </div>
            <ToggleRow label="Pas je fyzicky v útulku" desc="Pas je uschován na recepci"
              checked={form.passport_in_shelter} onChange={v => set('passport_in_shelter', v)} />

            <Divider />

            <SectionTitle>✍️ Tetování</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Číslo tetování" hint="Starší forma identifikace — pro zvířata tetovaná před povinností čipování">
                <input className={inputCls + ' font-mono'} value={form.tatoo_number} onChange={e => set('tatoo_number', e.target.value)} placeholder="CZ12345" />
              </Field>
              <Field label="Umístění tetování">
                <select className={selectCls} value={form.tatoo_location} onChange={e => set('tatoo_location', e.target.value)}>
                  <option value="">Nevyplněno</option>
                  <option value="right_ear">Pravé ucho</option>
                  <option value="left_ear">Levé ucho</option>
                  <option value="right_flank">Pravý bok / tříslo</option>
                  <option value="other">Jiné</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ═══ TAB: HEALTH ═══ */}
        {activeTab === 'health' && (
          <div>
            <SectionTitle>🩺 Celkový zdravotní stav</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Zdravotní stav">
                <select className={selectCls} value={form.health_status} onChange={e => set('health_status', e.target.value)}>
                  {HEALTH_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Kastrace / sterilizace">
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {[{value:'yes',label:'Ano'},{value:'no',label:'Ne'},{value:'planned',label:'Plánovaná'},{value:'unknown',label:'Nevím'}].map(o => (
                    <RadioPill key={o.value} value={o.value} selected={form.neutered === o.value} onChange={v => set('neutered', v)}>{o.label}</RadioPill>
                  ))}
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Datum kastrace/sterilizace">
                <input type="date" className={inputCls} value={form.neutered_date} onChange={e => set('neutered_date', e.target.value)} />
              </Field>
              <Field label="Veterinář (výkon)">
                <input className={inputCls} value={form.neutered_vet} onChange={e => set('neutered_vet', e.target.value)} placeholder="MVDr. Jan Novák" />
              </Field>
            </div>

            <Divider />

            {/* Vaccinations */}
            <div className="mb-5">
              <SectionTitle>
                💉 Vakcinace
                <span className="text-[11px] bg-[#E6F1FB] text-[#185FA5] px-2 py-px rounded font-bold">+šarže +veterinář +platnost</span>
              </SectionTitle>
              <InfoBox type="tip" icon="💡">Pro zákonnou evidenci je potřeba zaznamenat číslo šarže vakcíny, jméno veterináře a datum platnosti (revakcinace).</InfoBox>

              {vaccinations.length > 0 && (
                <div className="rounded-lg border-2 border-[#F0EDE8] overflow-hidden mb-3">
                  {/* Header */}
                  <div className="grid bg-[#FDFCFA] border-b border-[#F0EDE8]"
                    style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr auto' }}>
                    {['Typ vakcíny', 'Datum podání', 'Platnost do', 'Šarže', 'Veterinář', ''].map((h, i) => (
                      <div key={i} className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide ${i >= 2 && i <= 4 ? 'text-[#185FA5]' : 'text-[#8B6550]'}`}>
                        {h}{i >= 2 && i <= 4 && <span className="ml-1 text-[8px] bg-[#E6F1FB] px-1 py-px rounded">NOVÉ</span>}
                      </div>
                    ))}
                  </div>
                  {/* Rows */}
                  {vaccinations.map(v => (
                    <div key={v._key} className="grid border-b border-[#F0EDE8] last:border-b-0 hover:bg-[#FDFCFA] transition-colors"
                      style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr auto' }}>
                      <div className="px-3 py-2 flex items-center">
                        <span className="text-sm font-semibold text-[#2C1810]">{v.label || v.type}</span>
                      </div>
                      <div className="px-2 py-1.5">
                        <input type="date" className="w-full text-xs border border-[#F0EDE8] rounded px-2 py-1.5 focus:outline-none focus:border-[#E8634A] bg-transparent"
                          value={v.last_date} onChange={e => updateVaccination(v._key, 'last_date', e.target.value)} />
                      </div>
                      <div className="px-2 py-1.5">
                        <input type="date" className="w-full text-xs border border-[#F0EDE8] rounded px-2 py-1.5 focus:outline-none focus:border-[#E8634A] bg-transparent text-[#2D8A4E] font-semibold"
                          value={v.expiry_date ?? ''} onChange={e => updateVaccination(v._key, 'expiry_date', e.target.value)} />
                      </div>
                      <div className="px-2 py-1.5">
                        <input className="w-full text-xs font-mono border border-[#F0EDE8] rounded px-2 py-1.5 focus:outline-none focus:border-[#E8634A] bg-transparent"
                          value={v.batch_number ?? ''} onChange={e => updateVaccination(v._key, 'batch_number', e.target.value)}
                          placeholder="CZ-2024-001" />
                      </div>
                      <div className="px-2 py-1.5">
                        <input className="w-full text-xs border border-[#F0EDE8] rounded px-2 py-1.5 focus:outline-none focus:border-[#E8634A] bg-transparent"
                          value={v.vet_name ?? ''} onChange={e => updateVaccination(v._key, 'vet_name', e.target.value)}
                          placeholder="MVDr. Novák" />
                      </div>
                      <div className="px-2 py-2 flex items-center">
                        <button type="button" onClick={() => removeVaccination(v._key)}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#A09890] hover:text-[#D83030] hover:bg-[#FCEBEB] transition-colors touch-manipulation text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {addingVaccine ? (
                <div className="p-3.5 rounded-lg border-2 border-[#E8634A]/30 bg-[#FDEAE6]/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {newVaccine.custom ? (
                      <input className={inputCls} placeholder="Název očkování" value={newVaccine.label}
                        onChange={e => setNewVaccine(p => ({...p, label: e.target.value}))} autoFocus />
                    ) : (
                      <select className={selectCls} value={newVaccine.type}
                        onChange={e => setNewVaccine(p => ({...p, type: e.target.value, label: '', custom: e.target.value === '__custom__'}))}>
                        <option value="">Vyberte typ...</option>
                        {PREDEFINED_VACCINES.map(v => (
                          <option key={v.type} value={v.type}>{v.label}</option>
                        ))}
                        <option value="__custom__">+ Vlastní typ...</option>
                      </select>
                    )}
                    <input type="date" className={inputCls} value={newVaccine.last_date}
                      onChange={e => setNewVaccine(p => ({...p, last_date: e.target.value}))}
                      placeholder="Datum aplikace" />
                    <Field label="Šarže vakcíny (batch)" hint="Povinné dle §13 zák. 166/1999 Sb.">
                      <input className={inputCls} placeholder="AB12345" value={newVaccine.batch_number}
                        onChange={e => setNewVaccine(p => ({...p, batch_number: e.target.value}))} />
                    </Field>
                    <Field label="Expirace vakcíny">
                      <input type="date" className={inputCls} value={newVaccine.expiry_date}
                        onChange={e => setNewVaccine(p => ({...p, expiry_date: e.target.value}))} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Aplikoval (veterinář)">
                        <input className={inputCls} placeholder="MVDr. Jan Novák" value={newVaccine.vet_name}
                          onChange={e => setNewVaccine(p => ({...p, vet_name: e.target.value}))} />
                      </Field>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={addVaccination}
                      disabled={!newVaccine.type && !newVaccine.label}
                      className="px-4 py-2 rounded-md bg-[#E8634A] text-white text-sm font-bold disabled:opacity-50 touch-manipulation">
                      Přidat
                    </button>
                    <button type="button" onClick={() => { setAddingVaccine(false); setNewVaccine({type:'',label:'',last_date:'',batch_number:'',expiry_date:'',vet_name:'',custom:false}) }}
                      className="px-4 py-2 rounded-md border-2 border-[#F0EDE8] text-[#8B6550] text-sm touch-manipulation">Zrušit</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingVaccine(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#D5CFC8] text-sm font-semibold text-[#8B6550] hover:border-[#E8634A] hover:text-[#E8634A] transition-colors w-full touch-manipulation">
                  + Přidat očkování
                </button>
              )}
            </div>

            <Divider />

            {/* Antiparazitika */}
            <div className="mb-5">
              <SectionTitle>
                🪲 Antiparazitika
                <span className="text-[11px] bg-[#EAF3DE] text-[#1a5e2e] px-2 py-px rounded font-bold">NOVÉ</span>
              </SectionTitle>
              {antiparasitics.length > 0 && (
                <div className="rounded-lg border-2 border-[#F0EDE8] overflow-hidden mb-3">
                  <div className="grid bg-[#FDFCFA] border-b border-[#F0EDE8]"
                    style={{ gridTemplateColumns: '2fr 1.2fr 1fr auto' }}>
                    {['Přípravek', 'Typ', 'Datum', ''].map((h, i) => (
                      <div key={i} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8B6550]">{h}</div>
                    ))}
                  </div>
                  {antiparasitics.map(ap => (
                    <div key={ap._key} className="grid border-b border-[#F0EDE8] last:border-b-0 hover:bg-[#FDFCFA]"
                      style={{ gridTemplateColumns: '2fr 1.2fr 1fr auto' }}>
                      <div className="px-2 py-1.5">
                        <input className="w-full text-xs border border-[#F0EDE8] rounded px-2 py-1.5 focus:outline-none focus:border-[#E8634A]"
                          value={ap.name} onChange={e => setAntiparasitics(prev => prev.map(x => x._key === ap._key ? { ...x, name: e.target.value } : x))}
                          placeholder="Nexgard Spectra" />
                      </div>
                      <div className="px-2 py-1.5">
                        <select className="w-full text-xs border border-[#F0EDE8] rounded px-2 py-1.5 focus:outline-none focus:border-[#E8634A] appearance-none bg-white"
                          value={ap.type} onChange={e => setAntiparasitics(prev => prev.map(x => x._key === ap._key ? { ...x, type: e.target.value } : x))}>
                          <option value="">Typ...</option>
                          <option value="deworming">Odčervení (interní)</option>
                          <option value="external">Antiparazitikum (vnější)</option>
                          <option value="spot-on">Spot-on</option>
                          <option value="collar">Obojek</option>
                        </select>
                      </div>
                      <div className="px-2 py-1.5">
                        <input type="date" className="w-full text-xs border border-[#F0EDE8] rounded px-2 py-1.5 focus:outline-none focus:border-[#E8634A]"
                          value={ap.date} onChange={e => setAntiparasitics(prev => prev.map(x => x._key === ap._key ? { ...x, date: e.target.value } : x))} />
                      </div>
                      <div className="px-2 py-2 flex items-center">
                        <button type="button" onClick={() => setAntiparasitics(prev => prev.filter(x => x._key !== ap._key))}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#A09890] hover:text-[#D83030] hover:bg-[#FCEBEB] transition-colors text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setAntiparasitics(prev => [...prev, { _key: uid(), name: '', type: '', date: '' }])}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#D5CFC8] text-sm font-semibold text-[#8B6550] hover:border-[#E8634A] hover:text-[#E8634A] transition-colors w-full touch-manipulation">
                + Přidat antiparazitikum
              </button>
            </div>

            <Divider />

            {/* Medications */}
            <div className="mb-5">
              <SectionTitle>💊 Aktuální léky</SectionTitle>

              {medications.length > 0 && (
                <div className="space-y-2 mb-3">
                  {medications.map((m, i) => (
                    <div key={m._key} className="p-3 rounded-lg border-2 border-[#F0EDE8] bg-[#FDFCFA]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#8B6550] uppercase tracking-wide">Lék {i + 1}</span>
                        <button type="button" onClick={() => removeMedication(m._key)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[#A09890] hover:text-[#D83030] hover:bg-[#FCEBEB] transition-colors touch-manipulation text-xs">✕</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input className={inputCls} placeholder="Název léku" value={m.name}
                          onChange={e => updateMedication(m._key, 'name', e.target.value)} />
                        <input className={inputCls} placeholder="Dávkování (50mg)" value={m.dosage}
                          onChange={e => updateMedication(m._key, 'dosage', e.target.value)} />
                        <select className={selectCls} value={m.frequency}
                          onChange={e => updateMedication(m._key, 'frequency', e.target.value)}>
                          <option value="">Frekvence...</option>
                          {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                          <option value="custom">Jiná...</option>
                        </select>
                        {m.frequency === 'custom' && (
                          <input className={inputCls + ' sm:col-span-3'} placeholder="Popis frekvence"
                            value={m.frequency === 'custom' ? '' : m.frequency}
                            onChange={e => updateMedication(m._key, 'frequency', e.target.value)} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={addMedication}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#D5CFC8] text-sm font-semibold text-[#8B6550] hover:border-[#E8634A] hover:text-[#E8634A] transition-colors w-full touch-manipulation">
                + Přidat lék
              </button>
            </div>

            <Divider />

            {/* Vet + other */}
            <SectionTitle>🏥 Veterinář & záznamy</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Ošetřující veterinář">
                <input className={inputCls} value={form.vet_name} onChange={e => set('vet_name', e.target.value)} placeholder="MVDr. Jan Novák" />
              </Field>
              <Field label="Telefon na veterináře">
                <input type="tel" className={inputCls} value={form.vet_phone} onChange={e => set('vet_phone', e.target.value)} placeholder="+420 777 123 456" />
              </Field>
              <Field label="Datum poslední vet. návštěvy">
                <input type="date" className={inputCls} value={form.last_vet_visit} onChange={e => set('last_vet_visit', e.target.value)} />
              </Field>
              <div className="sm:col-span-3">
                <Field label="Zdravotní poznámky" hint="Diagnózy, alergie, prodělaná onemocnění, zvláštní potřeby...">
                  <textarea className={textareaCls} rows={3} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} />
                </Field>
              </div>
            </div>

            <Divider />

            <div>
              <SectionTitle>
                🔒 Karanténa
                <span className="text-[11px] bg-[#E6F1FB] text-[#185FA5] px-2 py-px rounded font-bold">+datum od +veterinář +výsledek</span>
              </SectionTitle>
              <ToggleRow label="Zvíře je / bylo v karanténě" desc="Karanténa je povinná pro nová zvířata (obvykle 14 dní) · §24 Vyhláška 342/2012"
                checked={form.in_quarantine} onChange={v => set('in_quarantine', v)} />
              {form.in_quarantine && (
                <div className="mt-3 border-2 border-[#E8634A] rounded-xl p-4 bg-[#FDEAE6]">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🔒</span>
                    <span className="text-sm font-extrabold text-[#993C1D]">Záznamy karantény</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Datum zahájení" law="Zákon">
                      <input type="date" className={inputCls + ' bg-white'} value={form.quarantine_start}
                        onChange={e => set('quarantine_start', e.target.value)} />
                    </Field>
                    <Field label="Datum ukončení" law="Zákon">
                      <input type="date" className={inputCls + ' bg-white'} value={form.quarantine_end || form.quarantine_until}
                        onChange={e => { set('quarantine_end', e.target.value); set('quarantine_until', e.target.value) }} />
                    </Field>
                    <Field label="Box karantény">
                      <input className={inputCls + ' bg-white'} value={form.quarantine_box}
                        onChange={e => set('quarantine_box', e.target.value)} placeholder="K-01, Izolace B..." />
                    </Field>
                    <Field label="Veterinář karantény" law="Zákon">
                      <input className={inputCls + ' bg-white'} value={form.quarantine_vet}
                        onChange={e => set('quarantine_vet', e.target.value)} placeholder="MVDr. Jana Horáková" />
                    </Field>
                    <Field label="Výsledek karantény" law="Zákon">
                      <select className={selectCls + ' bg-white'} value={form.quarantine_result}
                        onChange={e => set('quarantine_result', e.target.value)}>
                        <option value="">Probíhá...</option>
                        <option value="negative">Ukončena — bez nálezů</option>
                        <option value="positive">Ukončena — zjištěno onemocnění</option>
                        <option value="inconclusive">Prodloužena / neprůkazné</option>
                      </select>
                    </Field>
                    <Field label="Důvod karantény">
                      <input className={inputCls + ' bg-white'} value={form.quarantine_reason}
                        onChange={e => set('quarantine_reason', e.target.value)}
                        placeholder="Nový příjem, podezření na parvo..." />
                    </Field>
                    <div className="sm:col-span-3">
                      <Field label="Poznámky z karantény">
                        <textarea className={textareaCls + ' bg-white !min-h-[60px]'} rows={2}
                          value={form.quarantine_notes} onChange={e => set('quarantine_notes', e.target.value)}
                          placeholder="Zvíře bez projevů onemocnění po celou dobu karantény..." />
                      </Field>
                    </div>
                  </div>
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
              <SectionTitle>👥 Kompatibilita</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Field label="Vztah k cizím lidem">
                  <select className={selectCls} value={form.good_with_adults} onChange={e => set('good_with_adults', e.target.value)}>
                    {GOOD_WITH_ADULTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <Divider />

            <div className="mb-5">
              <SectionTitle>⚡ Energetická úroveň</SectionTitle>
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITY_CARDS.map(c => (
                  <SelectCard key={c.value} value={c.value} selected={form.activity_level === c.value}
                    icon={c.icon} label={c.label} onChange={v => set('activity_level', v)} />
                ))}
              </div>
            </div>

            <Divider />

            <Field label="Popis povahy (veřejný)" hint="Zobrazí se návštěvníkům webu">
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

            <label
              htmlFor="animal-photo-input"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileDrop(e.dataTransfer.files) }}
              className="border-2 border-dashed border-[#D5CFC8] rounded-lg p-8 text-center cursor-pointer hover:border-[#E8634A] hover:bg-[#FDEAE6]/50 transition-colors mb-4 touch-manipulation block"
            >
              <div className="text-3xl mb-2">📸</div>
              <div className="text-sm font-bold text-[#2C1810]">Klikni nebo přetáhni fotky</div>
              <div className="text-xs text-[#8B6550] mt-1">JPG, PNG, WebP · max 8 MB</div>
              <input id="animal-photo-input" ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFileDrop(e.target.files)} />
            </label>

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
                  <label htmlFor="animal-photo-input"
                    className="aspect-square rounded-lg border-2 border-dashed border-[#D5CFC8] flex items-center justify-center hover:border-[#E8634A] transition-colors touch-manipulation cursor-pointer">
                    <span className="text-2xl text-[#A09890]">+</span>
                  </label>
                </div>
                <p className="text-xs text-[#8B6550] mt-2">{allPhotoUrls.length} fotek · ★ = nastavit jako hlavní</p>
              </>
            )}
          </div>
        )}

        {/* ═══ TAB: ADOPCE / ODCHOD ═══ */}
        {activeTab === 'adopce' && (
          <div>
            <InfoBox type="law" icon="⚖️">
              <strong>§25b zák. 246/1992 Sb. + §14 zák. 246/1992 Sb.</strong> — Útulky jsou povinny evidovat komu, kdy a za jakých podmínek bylo zvíře předáno. Záznamy o adoptérovi musí být uchovány min. 3 roky a musí být dostupné pro SVS kontrolu.
            </InfoBox>

            {isShelter && (
              <>
                <div className="mb-5">
                  <SectionTitle>📖 Příběh zvířete (veřejný)</SectionTitle>
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
              </>
            )}

            {/* ── Odchod ze zařízení (§25b odst. 4 zák. 246/1992 Sb.) ── */}
            <div className="mb-5">
              <SectionTitle>
                🚪 Způsob odchodu a zákonné záznamy
                <span className="text-[11px] bg-[#EAF3DE] text-[#1a5e2e] px-2 py-px rounded font-bold">NOVÉ · ZÁKONNÉ</span>
              </SectionTitle>

              {/* Exit option cards */}
              <div className="space-y-2 mb-4">
                {[
                  { value: 'adopted',     icon: '✅', label: 'Adopce (předání novému majiteli)', desc: 'Zvíře bylo předáno adoptérovi na základě adopční smlouvy' },
                  { value: 'returned',    icon: '↩️', label: 'Vrácení původnímu majiteli',       desc: 'Byl nalezen registrovaný majitel zvířete' },
                  { value: 'transferred', icon: '🚛', label: 'Přemístění do jiného útulku',       desc: 'Zvíře bylo přeřazeno do jiné instituce' },
                  { value: 'deceased',    icon: '🕊️', label: 'Úhyn / Eutanazie',                  desc: 'Zvíře uhynulo nebo bylo humánně utraceno' },
                  { value: 'escaped',     icon: '🏃', label: 'Útěk / Ztráta',                     desc: 'Zvíře uprchlo z útulku nebo bylo ztraceno' },
                ].map(opt => (
                  <div key={opt.value}>
                    <button type="button"
                      onClick={() => set('exit_type', form.exit_type === opt.value ? '' : opt.value)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all touch-manipulation ${
                        form.exit_type === opt.value
                          ? 'border-[#E8634A] bg-[#FDEAE6]'
                          : 'border-[#F0EDE8] bg-white hover:border-[#E8634A]/50'
                      }`}>
                      <span className="text-xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                      <div>
                        <div className="text-sm font-extrabold text-[#2C1810]">{opt.label}</div>
                        <div className="text-xs text-[#8B6550] mt-0.5">{opt.desc}</div>
                      </div>
                    </button>

                    {/* Sub-fields per exit type */}
                    {form.exit_type === opt.value && opt.value === 'adopted' && (
                      <div className="mt-1 p-4 rounded-xl bg-[#FDEAE6] border-2 border-[#E8634A]/20">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                          <Field label="Datum předání" required law="Zákon">
                            <input type="date" className={inputCls + ' bg-white'} value={form.exit_date} onChange={e => set('exit_date', e.target.value)} />
                          </Field>
                          <Field label="Číslo adopční smlouvy" law="Zákon">
                            <input className={inputCls + ' bg-white font-mono'} value={form.adoption_contract_num} onChange={e => set('adoption_contract_num', e.target.value)} placeholder="ADO-2024-042" />
                          </Field>
                          <Field label="Adopční poplatek (Kč)">
                            <input type="number" className={inputCls + ' bg-white'} value={form.adoption_fee} onChange={e => set('adoption_fee', e.target.value)} placeholder="0 = zdarma" min="0" />
                          </Field>
                        </div>
                        <div className="text-xs font-bold text-[#993C1D] uppercase tracking-wide mb-2">👤 Adoptér (nový majitel) <LawBadge>§25b — zákonný záznam</LawBadge></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field label="Jméno a příjmení" required>
                            <input className={inputCls + ' bg-white'} value={form.adopter_name} onChange={e => set('adopter_name', e.target.value)} placeholder="Jana Dvořáková" />
                          </Field>
                          <Field label="Telefon" required>
                            <input type="tel" className={inputCls + ' bg-white'} value={form.adopter_phone} onChange={e => set('adopter_phone', e.target.value)} placeholder="+420 777 123 456" />
                          </Field>
                          <Field label="E-mail">
                            <input type="email" className={inputCls + ' bg-white'} value={form.adopter_email} onChange={e => set('adopter_email', e.target.value)} placeholder="jana@email.cz" />
                          </Field>
                          <div className="sm:col-span-3">
                            <Field label="Trvalá adresa" required law="Zákon" hint="Povinné dle §25b zák. 246/1992 — uchováno 3 roky">
                              <input className={inputCls + ' bg-white'} value={form.adopter_address} onChange={e => set('adopter_address', e.target.value)} placeholder="Ulice 12, Praha 5, 150 00" />
                            </Field>
                          </div>
                        </div>
                        {animalId && (
                          <div className="mt-3 p-2.5 bg-white rounded-lg border border-[#F0EDE8] text-xs text-[#8B6550] flex items-center gap-2">
                            <span>ℹ️</span>
                            <span>Po uložení bude automaticky vygenerována</span>
                            <a href={`/admin/animals/${animalId}/pdf/adoption`} target="_blank" rel="noopener noreferrer"
                              className="font-bold text-[#E8634A] hover:underline">adopční smlouva ke stažení (PDF) →</a>
                          </div>
                        )}
                      </div>
                    )}

                    {form.exit_type === opt.value && opt.value === 'returned' && (
                      <div className="mt-1 p-4 rounded-xl bg-[#FDEAE6] border-2 border-[#E8634A]/20">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field label="Datum vrácení" law="Zákon"><input type="date" className={inputCls + ' bg-white'} value={form.exit_date} onChange={e => set('exit_date', e.target.value)} /></Field>
                          <Field label="Jméno majitele" law="Zákon"><input className={inputCls + ' bg-white'} value={form.adopter_name} onChange={e => set('adopter_name', e.target.value)} /></Field>
                          <Field label="Doklad totožnosti č."><input className={inputCls + ' bg-white'} value={form.adopter_id_number} onChange={e => set('adopter_id_number', e.target.value)} placeholder="OP: 123456789" /></Field>
                        </div>
                      </div>
                    )}

                    {form.exit_type === opt.value && opt.value === 'transferred' && (
                      <div className="mt-1 p-4 rounded-xl bg-[#FDEAE6] border-2 border-[#E8634A]/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="Cílová instituce" law="Zákon"><input className={inputCls + ' bg-white'} value={form.transfer_institution} onChange={e => set('transfer_institution', e.target.value)} placeholder="Útulek Brno - Medlánky" /></Field>
                          <Field label="Datum přemístění" law="Zákon"><input type="date" className={inputCls + ' bg-white'} value={form.exit_date} onChange={e => set('exit_date', e.target.value)} /></Field>
                          <Field label="Číslo přepravního dokladu"><input className={inputCls + ' bg-white'} value={form.transfer_doc_number} onChange={e => set('transfer_doc_number', e.target.value)} /></Field>
                        </div>
                      </div>
                    )}

                    {form.exit_type === opt.value && opt.value === 'deceased' && (
                      <div className="mt-1 p-4 rounded-xl bg-[#FDEAE6] border-2 border-[#E8634A]/20">
                        <InfoBox type="warn" icon="⚖️">
                          <strong>Zákonná povinnost:</strong> Úhyn / eutanazie musí být evidovány dle §25b zák. 246/1992 Sb. Způsob likvidace těla musí být proveden v souladu s VZ č. 255/2012 Sb.
                        </InfoBox>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field label="Datum úhynu / eutanazie" required law="Zákon"><input type="date" className={inputCls + ' bg-white'} value={form.death_date} onChange={e => set('death_date', e.target.value)} /></Field>
                          <Field label="Typ" required>
                            <select className={selectCls + ' bg-white'} value={form.death_type} onChange={e => set('death_type', e.target.value)}>
                              <option value="">Vyberte...</option>
                              <option value="natural">Přirozený úhyn</option>
                              <option value="euthanasia">Eutanazie — lékařský důvod</option>
                              <option value="accident">Nehoda / úraz</option>
                              <option value="unknown">Jiné</option>
                            </select>
                          </Field>
                          <Field label="Provádějící veterinář" law="Zákon"><input className={inputCls + ' bg-white'} value={form.death_vet} onChange={e => set('death_vet', e.target.value)} placeholder="MVDr. Jan Novák" /></Field>
                          <div className="sm:col-span-3">
                            <Field label="Příčina / diagnóza" law="Zákon"><textarea className={textareaCls + ' bg-white !min-h-[60px]'} rows={2} value={form.death_cause} onChange={e => set('death_cause', e.target.value)} /></Field>
                          </div>
                          <Field label="Způsob likvidace těla" required law="VZ 255/2012">
                            <select className={selectCls + ' bg-white'} value={form.disposal_method} onChange={e => set('disposal_method', e.target.value)}>
                              <option value="">Vyberte...</option>
                              <option value="incineration">Spalovna (RASEKO / Asanace)</option>
                              <option value="composting">Kompostování</option>
                              <option value="burial">Pohřbení (povolené pozemky)</option>
                              <option value="rendering">Asanační podnik</option>
                              <option value="other">Jiné</option>
                            </select>
                          </Field>
                          <Field label="Číslo dokladu o likvidaci"><input className={inputCls + ' bg-white'} value={form.disposal_doc_number} onChange={e => set('disposal_doc_number', e.target.value)} /></Field>
                          <Field label="Firma / asanační podnik"><input className={inputCls + ' bg-white'} value={form.disposal_company} onChange={e => set('disposal_company', e.target.value)} placeholder="RASEKO s.r.o." /></Field>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>


            <Divider />

            <SectionTitle>🔒 Interní</SectionTitle>
            <div className="flex flex-col gap-2 mb-5">
              {isShelter && (
                <ToggleRow label="Zvíře je v dočasné péči" desc="Nachází se u pečovatele, ne v útulku"
                  checked={form.in_foster} onChange={v => set('in_foster', v)} />
              )}
              <ToggleRow label="Publikovat na webu" desc="Zobrazí se na veřejných stránkách zozio.cz"
                checked={form.published} onChange={v => set('published', v)} />
            </div>
            <Field label="Interní poznámky" hint="Vidí jen tým instituce">
              <textarea className={textareaCls} rows={2} value={form.internal_notes}
                onChange={e => set('internal_notes', e.target.value)} />
            </Field>
          </div>
        )}

        {/* ═══ TAB: RESCUE (rescue_station) ═══ */}
        {activeTab === 'rescue' && !isShelter && (
          <div>
            <InfoBox type="law" icon="⚖️">
              <strong>§54 zák. č. 114/1992 Sb.</strong> (Zákon o ochraně přírody) — Záchranné stanice jsou povinny vést evidenci chráněných živočichů, oznamovat jejich příjem orgánu státní správy a dokumentovat vypuštění nebo trvalé umístění.
            </InfoBox>

            {/* Záchrana — základní info */}
            <SectionTitle>🦉 Záchrana — základní info</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Druh / okolnosti nálezu">
                <input className={inputCls} value={form.rescue_find_type}
                  onChange={e => set('rescue_find_type', e.target.value)}
                  placeholder="Střet s vozidlem, vypadlé z hnízda, omámené..." />
              </Field>
              <Field label="Prognóza">
                <select className={selectCls} value={form.rescue_prognosis} onChange={e => set('rescue_prognosis', e.target.value)}>
                  {RESCUE_PROGNOSIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Místo nálezu" law="Zákon">
                <input className={inputCls} value={form.found_location} onChange={e => set('found_location', e.target.value)} placeholder="Silnice E55 u Říčan, GPS: 49.98, 14.65" />
              </Field>
              <Field label="Datum nálezu" law="Zákon">
                <input type="date" className={inputCls} value={form.found_date} onChange={e => set('found_date', e.target.value)} />
              </Field>
            </div>

            <Divider />

            {/* Nálezce */}
            <SectionTitle>👤 Nálezce</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Jméno a příjmení" law="Zákon">
                <input className={inputCls} value={form.intake_finder_name}
                  onChange={e => set('intake_finder_name', e.target.value)} placeholder="Jan Procházka" />
              </Field>
              <Field label="Telefon" law="Zákon">
                <input type="tel" className={inputCls} value={form.intake_finder_phone}
                  onChange={e => set('intake_finder_phone', e.target.value)} placeholder="+420 777 123 456" />
              </Field>
              <Field label="E-mail">
                <input type="email" className={inputCls} value={form.intake_finder_email}
                  onChange={e => set('intake_finder_email', e.target.value)} placeholder="jan@email.cz" />
              </Field>
            </div>

            <Divider />

            {/* Vypuštění */}
            <SectionTitle>🌿 Vypuštění do přírody</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Datum vypuštění" law="Zákon">
                <input type="date" className={inputCls} value={form.release_date} onChange={e => set('release_date', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Místo vypuštění (lokalita)" law="Zákon">
                  <input className={inputCls} value={form.release_location} onChange={e => set('release_location', e.target.value)} placeholder="Název lokality, obec, GPS souřadnice..." />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field label="Poznámky k vypuštění" law="Zákon">
                  <textarea className={textareaCls} value={form.release_notes} onChange={e => set('release_notes', e.target.value)} placeholder="Podmínky při vypuštění, chování zvířete, přítomné osoby..." />
                </Field>
              </div>
            </div>

            <Divider />

            {/* CITES */}
            <SectionTitle>🌍 CITES & zvláštní ochrana</SectionTitle>
            <div className="mb-4">
              <ToggleRow
                label="Zvíře podléhá CITES / zvláštní ochraně"
                desc="Úmluva o mezinárodním obchodu s ohroženými druhy · §54 zák. 114/1992 Sb."
                checked={form.cites_protected}
                onChange={v => set('cites_protected', v)}
              />
              {form.cites_protected && (
                <div className="mt-2 border-2 border-[#185FA5] bg-[#E6F1FB] rounded-xl p-4">
                  <div className="text-[13px] font-extrabold text-[#185FA5] mb-3">🌍 Záznamy CITES a zákonné povinnosti</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Evidenční číslo MŽP" law="§54 Zákon">
                      <input className={inputCls + ' bg-white font-mono'} value={form.cites_number} onChange={e => set('cites_number', e.target.value)} placeholder="CZ-CITES-2026-001" />
                    </Field>
                    <Field label="Stupeň ochrany">
                      <select className={selectCls + ' bg-white'} value={form.cites_level} onChange={e => set('cites_level', e.target.value)}>
                        <option value="">Vyberte...</option>
                        <option value="I">CITES I — přísná ochrana</option>
                        <option value="II">CITES II — kontrolovaný obchod</option>
                        <option value="cz_special">Zvláště chráněný druh ČR (§48)</option>
                        <option value="cz_endangered">Ohrožený druh ČR (§49)</option>
                        <option value="cz_critical">Silně ohrožený druh ČR (§50)</option>
                      </select>
                    </Field>
                    <Field label="Datum oznámení orgánu SSP">
                      <input type="date" className={inputCls + ' bg-white'} value={form.cites_notification_date} onChange={e => set('cites_notification_date', e.target.value)} />
                    </Field>
                    <Field label="Orgán (KÚ / AOPK / MŽP)">
                      <input className={inputCls + ' bg-white'} value={form.cites_authority} onChange={e => set('cites_authority', e.target.value)} placeholder="KÚ Středočeského kraje" />
                    </Field>
                    <Field label="Číslo povolení k držení">
                      <input className={inputCls + ' bg-white font-mono'} value={form.cites_permit} onChange={e => set('cites_permit', e.target.value)} placeholder="KÚ-2026-CITES-042" />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            <Divider />

            {/* Kroužkování */}
            <SectionTitle>🦅 Kroužkování (ptáci)</SectionTitle>
            <div className="mb-5">
              <ToggleRow
                label="Zvíře bylo okroužkováno"
                desc="BTO / CEVN kroužek při vypuštění"
                checked={form.ringed}
                onChange={v => set('ringed', v)}
              />
              {form.ringed && (
                <div className="mt-2">
                  <Field label="Číslo kroužku">
                    <input className={inputCls} value={form.ring_number} onChange={e => set('ring_number', e.target.value)} placeholder="Praha-CZ A 12345" />
                  </Field>
                </div>
              )}
            </div>

            <Divider />

            {/* Popis */}
            <SectionTitle>📝 Veřejný popis případu</SectionTitle>
            <div className="mb-5">
              <Field label="Záchranný příběh zobrazený na webu">
                <textarea className={textareaCls + ' min-h-[100px]'} value={form.rescue_public_description}
                  onChange={e => set('rescue_public_description', e.target.value)} placeholder="Sova byla nalezena..." />
              </Field>
            </div>
          </div>
        )}

        {/* ═══ TAB: HISTORY ═══ */}
        {activeTab === 'history' && (
          <div>
            <SectionTitle>🕐 Historie stavů</SectionTitle>
            {statusHistory.length === 0 ? (
              <div className="text-center py-10 text-[#A09890]">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">Zatím žádná história stavů</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#F0EDE8]" />
                <div className="space-y-4">
                  {statusHistory.map((h, i) => {
                    const date = new Date(h.changed_at)
                    const dateStr = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })
                    const timeStr = date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
                    const isFirst = i === 0
                    return (
                      <div key={h.id ?? i} className="flex gap-4 pl-10 relative">
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 top-1.5 ${isFirst ? 'bg-[#E8634A] border-[#E8634A]' : 'bg-white border-[#D5CFC8]'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isFirst ? 'bg-[#FDEAE6] text-[#993C1D]' : 'bg-[#F0EDE8] text-[#6B4030]'}`}>
                              {STATUS_LABEL[h.status] ?? h.status}
                            </span>
                            <span className="text-xs text-[#A09890]">{dateStr} · {timeStr}</span>
                          </div>
                          {h.note && <p className="text-sm text-[#6B4030] mt-1">{h.note}</p>}
                          {h.changed_by && <p className="text-xs text-[#A09890] mt-0.5">{h.changed_by}</p>}
                        </div>
                      </div>
                    )
                  })}
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
                {localHistory.map((h: StatusHistoryEntry, i: number) => {
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
                          {new Date(h.changed_at ?? h.created_at ?? '').toLocaleString('cs-CZ', {
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
            await fetch(`/api/${table}/${animal!.id}`, { method: 'DELETE' })
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
