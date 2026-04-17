'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HEALTH_STATUS_LABEL } from '@/lib/animal-labels'

/* ─── Types ─────────────────────────────────────────────── */
interface Species { id: string; name_cs: string }

interface MedRecord {
  _id: string
  record_date: string
  record_type: 'vaccination' | 'deworming' | 'medication' | 'exam' | 'treatment' | 'note'
  title: string
  description: string
  vet_name: string
}

interface WizardData {
  // Step 1 — Základní info
  name: string
  species_id: string
  sex: string
  adoption_status: string
  breed: string
  breed_is_new: boolean  // true = rasa není v číselníku → přidá se jako vlastní
  age_years: string
  weight_kg: string
  color: string
  // Step 2 — Příjem
  intake_date: string
  intake_time: string
  intake_worker: string
  origin: string
  found_location: string
  found_date: string
  box: string
  finder_name: string
  finder_phone: string
  finder_email: string
  finder_address: string
  // Step 3 — Identifikace
  chip_number: string
  crz_registered: boolean
  crz_registry: string     // 'crz' | 'cmku' | 'other'
  crz_reg_date: string
  passport_number: string
  // Step 4 — Karanténa & zdraví
  quarantine_start: string
  quarantine_vet: string
  health_status: string
  weight_on_arrival: string
  med_records: MedRecord[]
}

const TODAY = new Date().toISOString().slice(0, 10)

const INITIAL: WizardData = {
  name: '', species_id: '', sex: '', adoption_status: 'intake',
  breed: '', breed_is_new: false, age_years: '', weight_kg: '', color: '',
  intake_date: TODAY, intake_time: '', intake_worker: '',
  origin: 'found', found_location: '', found_date: '', box: '',
  finder_name: '', finder_phone: '', finder_email: '', finder_address: '',
  chip_number: '', crz_registered: false, crz_registry: 'crz', crz_reg_date: '', passport_number: '',
  quarantine_start: TODAY, quarantine_vet: '', health_status: '', weight_on_arrival: '',
  med_records: [],
}

const STEPS = [
  { label: 'Základní\ninfo',    icon: '🐾' },
  { label: 'Příjem &\nnálezce', icon: '📥' },
  { label: 'Identifi-\nkace',   icon: '🔖' },
  { label: 'Karanténa\n& zdraví', icon: '🔒' },
  { label: 'Shrnutí',           icon: '📋' },
]

const STEP_TITLES = [
  'Základní informace',
  'Příjem a nálezce',
  'Identifikace',
  'Karanténa a zdraví',
  'Shrnutí',
]
const STEP_SUBTITLES = [
  'Druh, jméno, pohlaví a status zvířete',
  'Zákonné záznamy o příjmu · §25b zák. 246/1992 Sb. — nelze přeskočit',
  'Čip, CRZ registrace, cestovní pas',
  'Zahájení karantény, zdravotní stav a záznamy',
  'Přehled zadaných dat · po odeslání přejdeš na profil zvířete',
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '6px', border: '2px solid #F0EDE8',
  background: 'white', fontSize: '13px', color: '#2C1810', outline: 'none', fontFamily: 'inherit',
  appearance: 'none' as React.CSSProperties['appearance'],
}

/* ─── Field helper ───────────────────────────────────────── */
function Field({ label, children, lawTag, hint, req }: {
  label: string; children: React.ReactNode; lawTag?: boolean; hint?: string; req?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-black uppercase text-xs flex flex-wrap items-center gap-1" style={{ color: '#8B6550', letterSpacing: '.06em' }}>
        {label}
        {req && <span style={{ color: '#E8634A' }}>*</span>}
        {lawTag && <span className="rounded font-black normal-case tracking-normal px-1.5 py-0.5" style={{ fontSize: '9px', background: '#E6F1FB', color: '#185FA5' }}>Zákon</span>}
      </label>
      {children}
      {hint && <span className="text-xs" style={{ color: '#A09890' }}>{hint}</span>}
    </div>
  )
}

/* ─── Status card ────────────────────────────────────────── */
function StatusCard({ value, label, icon, current, onClick }: { value: string; label: string; icon: string; current: string; onClick: () => void }) {
  const sel = current === value
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg cursor-pointer transition-all"
      style={{ padding: '12px', border: `2px solid ${sel ? '#E8634A' : '#F0EDE8'}`, background: sel ? '#FFF8F7' : 'white' }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <span className="font-black text-xs" style={{ color: sel ? '#E8634A' : '#6B4030' }}>{label}</span>
    </div>
  )
}

/* ─── Toggle ─────────────────────────────────────────────── */
function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg" style={{ padding: '11px 14px', border: '2px solid #F0EDE8', gap: '10px' }}>
      <div>
        <div className="font-black text-sm">{label}</div>
        {sub && <div className="text-xs" style={{ color: '#8B6550' }}>{sub}</div>}
      </div>
      <button
        type="button" onClick={onChange}
        className="relative flex-shrink-0 rounded-full transition-colors"
        style={{ width: '42px', height: '22px', background: checked ? '#2D8A4E' : '#D5CFC8', border: 'none', cursor: 'pointer' }}
      >
        <span
          className="absolute top-[3px] rounded-full transition-transform"
          style={{ left: '3px', width: '16px', height: '16px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════ */
export default function NewAnimalWizard({ institutionId, species }: { institutionId: string; species: Species[] }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  function set<K extends keyof WizardData>(field: K, value: WizardData[K]) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(goToEdit = false) {
    setSaving(true)
    setSubmitError(null)
    try {
      const effectiveWeight = data.weight_on_arrival
        ? Number(data.weight_on_arrival)
        : (data.weight_kg ? Number(data.weight_kg) : null)

      const body: Record<string, unknown> = {
        institution_id:        institutionId,
        name:                  data.name.trim() || 'Nové zvíře',
        species_id:            data.species_id || null,
        sex:                   data.sex || null,
        breed:                 data.breed || null,
        color:                 data.color || null,
        birth_year:            data.age_years ? new Date().getFullYear() - Number(data.age_years) : null,
        weight_kg:             effectiveWeight,
        adoption_status:       data.adoption_status,
        intake_date:           data.intake_date || null,
        intake_time:           data.intake_time || null,
        intake_worker:         data.intake_worker || null,
        origin:                data.origin || null,
        found_location:        data.found_location || null,
        found_date:            data.found_date || null,
        intake_finder_name:    data.finder_name || null,
        intake_finder_phone:   data.finder_phone || null,
        intake_finder_email:   data.finder_email || null,
        intake_finder_address: data.finder_address || null,
        chip_number:           data.chip_number || null,
        passport_number:       data.passport_number || null,
        crz_registered:        data.crz_registered,
        crz_reg_date:          data.crz_reg_date || null,
        quarantine_start:      data.quarantine_start || null,
        quarantine_vet:        data.quarantine_vet || null,
        quarantine_box:        data.box || null,
        health_status:         data.health_status || null,
        published:             false,
      }

      // Pokud je zadána rasa, která není v číselníku, přidej ji jako vlastní (is_custom: true)
      // Probíhá před vytvořením zvířete, ale neblokuje — chyba (duplikát) je ignorována
      if (data.breed.trim() && data.species_id && data.breed_is_new) {
        fetch('/api/breeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ species_id: data.species_id, name_cs: data.breed.trim() }),
        }).catch(() => {}) // ignoruj chybu (duplikát atd.)
      }

      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json().catch(() => null) as { id?: string; error?: string } | null

      if (!res.ok) {
        setSubmitError(json?.error || `Uložení selhalo (HTTP ${res.status})`)
        return
      }

      const animalId = json?.id
      if (!animalId) {
        setSubmitError('Server nevrátil ID vytvořeného zvířete.')
        return
      }

      // Uložit zdravotní záznamy (neblokující selhání)
      if (data.med_records.length > 0) {
        await Promise.allSettled(
          data.med_records.map(rec =>
            fetch(`/api/animals/${animalId}/medical-records`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                record_date:  rec.record_date,
                record_type:  rec.record_type,
                title:        rec.title,
                description:  rec.description || null,
                vet_name:     rec.vet_name || null,
              }),
            })
          )
        )
      }

      router.push(goToEdit ? `/admin/animals/${animalId}/edit` : `/admin/animals/${animalId}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Neočekávaná chyba při ukládání.')
    } finally {
      setSaving(false)
    }
  }

  const stepLabels = STEPS.map(s => s.label.split('\n'))

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F7F4F0' }}>
      <div className="max-w-[900px] mx-auto px-4 pt-6">
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <a href="/admin/animals" className="text-xs font-semibold mb-2 block hover:opacity-75" style={{ color: '#8B6550' }}>
            ← Zpět na seznam
          </a>
          <h1 className="font-black" style={{ fontSize: '22px', color: '#2C1810' }}>Zrychlený příjem</h1>
          <p className="text-sm mt-1" style={{ color: '#8B6550' }}>Zachyť minimum dat teď — detaily doplníš v plném formuláři na profilu zvířete.</p>
        </div>

        {/* Stepper */}
        <div className="flex overflow-x-auto pb-1 mb-5" style={{ gap: 0 }}>
          {STEPS.map((s, i) => {
            const done   = i < step
            const active = i === step
            return (
              <div key={i} className="flex flex-col items-center flex-1 relative" style={{ minWidth: '64px' }}>
                {i < STEPS.length - 1 && (
                  <div className="absolute z-0" style={{ top: '13px', left: 'calc(50% + 14px)', right: 'calc(-50% + 14px)', height: '2px', background: done ? '#2D8A4E' : '#E8E4E0' }} />
                )}
                <div
                  className="relative z-10 flex items-center justify-center rounded-full font-black"
                  style={{ width: '26px', height: '26px', fontSize: '10px', border: `2px solid ${done ? '#2D8A4E' : active ? '#E8634A' : '#D5CFC8'}`, background: done ? '#2D8A4E' : active ? '#E8634A' : 'white', color: done ? 'white' : active ? 'white' : '#B0A8A0', boxShadow: active ? '0 0 0 3px rgba(232,99,74,.2)' : undefined }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div className="text-center font-black mt-1" style={{ fontSize: '10px', color: done ? '#2D8A4E' : active ? '#E8634A' : '#B0A8A0', lineHeight: 1.2 }}>
                  {stepLabels[i].map((l, li) => <span key={li}>{l}{li < stepLabels[i].length - 1 && <br />}</span>)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Step card */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid #F0EDE8' }}>
          {/* Header */}
          <div className="flex items-center gap-3 border-b-2" style={{ padding: '16px 20px', borderColor: '#F0EDE8' }}>
            <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: '38px', height: '38px', background: '#FDEAE6', fontSize: '20px' }}>
              {STEPS[step].icon}
            </div>
            <div>
              <h2 className="font-black" style={{ fontSize: '16px', color: '#2C1810' }}>Krok {step + 1} — {STEP_TITLES[step]}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8B6550' }}>{STEP_SUBTITLES[step]}</p>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px' }}>
            {step === 0 && <Step1 data={data} set={set} species={species} />}
            {step === 1 && <Step2 data={data} set={set} />}
            {step === 2 && <Step3 data={data} set={set} />}
            {step === 3 && <Step4 data={data} set={set} />}
            {step === 4 && <Step5Summary data={data} species={species} />}
          </div>

          {/* Error */}
          {submitError && (
            <div className="flex items-start gap-2 text-xs font-semibold" style={{ padding: '12px 20px', background: '#FDEAE6', borderTop: '2px solid #F0EDE8', borderLeft: '3px solid #E8634A', color: '#A0321F' }} role="alert">
              <span style={{ fontSize: '15px', flexShrink: 0 }}>⚠️</span>
              <div>
                <div className="font-black">Zvíře se nepodařilo uložit</div>
                <div className="mt-0.5">{submitError}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t-2" style={{ padding: '14px 20px', borderColor: '#F0EDE8', background: '#FDFCFA' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#8B6550' }}>
              <span>Krok {step + 1} z 5</span>
              <div style={{ width: '80px', height: '4px', background: '#F0EDE8', borderRadius: '2px' }}>
                <div style={{ height: '100%', background: '#E8634A', borderRadius: '2px', width: `${((step + 1) / 5) * 100}%`, transition: 'width .3s' }} />
              </div>
              <span className="font-black" style={{ color: '#2D8A4E' }}>{Math.round(((step + 1) / 5) * 100)} %</span>
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="font-black rounded-lg" style={{ padding: '6px 12px', fontSize: '12px', background: 'white', border: '2px solid #F0EDE8', color: '#6B4030', cursor: 'pointer' }}>
                  ← Zpět
                </button>
              )}
              {step < 4 ? (
                <button onClick={() => setStep(s => s + 1)} className="font-black rounded-lg text-white" style={{ padding: '6px 12px', fontSize: '12px', background: '#E8634A', border: 'none', cursor: 'pointer' }}>
                  Pokračovat: {STEPS[step + 1]?.label.split('\n')[0]} →
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={saving}
                    className="font-black rounded-lg text-white"
                    style={{ padding: '6px 14px', fontSize: '12px', background: '#2D8A4E', border: 'none', cursor: saving ? 'wait' : 'pointer', opacity: saving ? .7 : 1 }}
                  >
                    {saving ? 'Ukládám…' : '✓ Přijmout zvíře'}
                  </button>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={saving}
                    className="font-black rounded-lg"
                    style={{ padding: '6px 14px', fontSize: '12px', background: 'white', border: '2px solid #E8634A', color: '#E8634A', cursor: saving ? 'wait' : 'pointer', opacity: saving ? .7 : 1 }}
                  >
                    📋 Přejít na plný formulář
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 1 ─────────────────────────────────────────────── */
function Step1({ data, set, species }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void; species: Species[] }) {
  const [breedSuggestions, setBreedSuggestions] = useState<string[]>([])

  useEffect(() => {
    const sid = data.species_id
    if (!sid) { setBreedSuggestions([]); return }
    fetch(`/api/breeds?species_id=${sid}`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: { name_cs?: string }[]) => {
        const names = rows.map(r => r.name_cs ?? '').filter(Boolean)
        setBreedSuggestions(names)
        // Přehodnoť, zda je aktuální rasa nová
        if (data.breed) {
          const isNew = !names.some(n => n.toLowerCase() === data.breed.toLowerCase())
          set('breed_is_new', isNew)
        }
      })
      .catch(() => {})
  }, [data.species_id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleBreedChange(value: string) {
    set('breed', value)
    if (!value.trim()) { set('breed_is_new', false); return }
    const isNew = !breedSuggestions.some(n => n.toLowerCase() === value.toLowerCase())
    set('breed_is_new', isNew)
  }

  const showNewBreedHint = data.breed_is_new && data.breed.trim().length > 1 && !!data.species_id

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Jméno">
          <input value={data.name} onChange={e => set('name', e.target.value)} placeholder="Bella" style={inputStyle} />
        </Field>
        <Field label="Druh">
          <select value={data.species_id} onChange={e => set('species_id', e.target.value)} style={inputStyle}>
            <option value="">Vyberte druh…</option>
            {species.map(s => <option key={s.id} value={s.id}>{s.name_cs}</option>)}
          </select>
        </Field>
        <Field label="Pohlaví">
          <select value={data.sex} onChange={e => set('sex', e.target.value)} style={inputStyle}>
            <option value="">Vyberte...</option>
            <option value="male">Samec</option>
            <option value="female">Samice</option>
            <option value="unknown">Neznámé</option>
          </select>
        </Field>

        <div className="col-span-3 sm:col-span-1 flex flex-col gap-1">
          <Field label="Plemeno / rasa">
            <input
              value={data.breed}
              onChange={e => handleBreedChange(e.target.value)}
              placeholder="Labrador mix"
              list="breed-suggestions"
              style={inputStyle}
            />
            <datalist id="breed-suggestions">
              <option value="Kříženec" />
              {breedSuggestions.map(b => <option key={b} value={b} />)}
            </datalist>
          </Field>
          {showNewBreedHint && (
            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: '#2D8A4E' }}>
              ✨ Nová rasa — přidá se do číselníku ke schválení
            </span>
          )}
        </div>

        <Field label="Věk (roky)">
          <input type="number" min={0} max={30} value={data.age_years} onChange={e => set('age_years', e.target.value)} placeholder="3" style={inputStyle} />
        </Field>
        <Field label="Váha (kg)">
          <input type="number" min={0} step={0.1} value={data.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="22" style={inputStyle} />
        </Field>
      </div>

      <div>
        <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#8B6550', letterSpacing: '.05em' }}>Status při příjmu</div>
        <p className="text-xs mb-2" style={{ color: '#A09890' }}>
          Zvíře v karanténě → <strong>V příjmu</strong>. Jde rovnou k pečovateli → <strong>Dočasná péče</strong>.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatusCard value="intake" label="V příjmu" icon="📥" current={data.adoption_status} onClick={() => set('adoption_status', 'intake')} />
          <StatusCard value="foster" label="Dočasná péče" icon="🤲" current={data.adoption_status} onClick={() => set('adoption_status', 'foster')} />
        </div>
      </div>
    </div>
  )
}

/* ─── Step 2 ─────────────────────────────────────────────── */
function Step2({ data, set }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-lg text-xs font-semibold" style={{ padding: '12px 14px', background: '#E6F1FB', borderLeft: '3px solid #185FA5', color: '#185FA5' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>⚖️</span>
        <span>Tato data jsou <strong>zákonně povinná</strong> a musí být dostupná pro kontrolu SVS.</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Datum příjmu" lawTag>
          <input type="date" value={data.intake_date} onChange={e => set('intake_date', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Čas příjmu">
          <input type="time" value={data.intake_time} onChange={e => set('intake_time', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Přijal (pracovník)" lawTag>
          <input placeholder="Jana Nováková" value={data.intake_worker} onChange={e => set('intake_worker', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Způsob příjmu" lawTag>
          <select value={data.origin} onChange={e => set('origin', e.target.value)} style={inputStyle}>
            <option value="found">Nalezeno — nálezcem</option>
            <option value="municipal_capture">Odchyceno obcí</option>
            <option value="surrendered">Odevzdáno majitelem</option>
            <option value="seized">Odebráno (SVS/Policie)</option>
            <option value="transferred">Přemístěno z jiného útulku</option>
            <option value="other">Jiné</option>
          </select>
        </Field>
        <Field label="Místo nálezu" lawTag>
          <input placeholder="Ulice, obec, čtvrť..." value={data.found_location} onChange={e => set('found_location', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Datum nálezu" lawTag hint="Pokud se liší od data příjmu">
          <input type="date" value={data.found_date} onChange={e => set('found_date', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Box / výběh">
          <input placeholder="B-12, K-4..." value={data.box} onChange={e => set('box', e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <div style={{ height: '1px', background: '#F0EDE8', margin: '4px 0' }} />
      <div className="text-sm font-black mb-1 flex items-center gap-2">
        👤 Nálezce / Odevzdávající
        <span className="rounded font-black normal-case tracking-normal px-1.5 py-0.5" style={{ fontSize: '9px', background: '#E6F1FB', color: '#185FA5' }}>§25b — povinné</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Jméno a příjmení" lawTag>
          <input placeholder="Jana Dvořáková" value={data.finder_name} onChange={e => set('finder_name', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Telefon" lawTag>
          <input type="tel" placeholder="+420 777 123 456" value={data.finder_phone} onChange={e => set('finder_phone', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="E-mail">
          <input type="email" placeholder="jana@email.cz" value={data.finder_email} onChange={e => set('finder_email', e.target.value)} style={inputStyle} />
        </Field>
        <div className="col-span-3">
          <Field label="Trvalá adresa" lawTag>
            <input placeholder="Ulice 12, Praha 5, 150 00" value={data.finder_address} onChange={e => set('finder_address', e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 3 ─────────────────────────────────────────────── */
function Step3({ data, set }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-lg text-xs font-semibold" style={{ padding: '12px 14px', background: '#EAF3DE', borderLeft: '3px solid #2D8A4E', color: '#1a5e2e' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>🔖</span>
        <span>Čip umožňuje dohledání majitele. Dohledání v ČMKU nebo jiném registru pomáhá ověřit původ.</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Číslo čipu" lawTag>
          <input placeholder="203 000 123 456 789" value={data.chip_number} onChange={e => set('chip_number', e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </Field>
        <Field label="Číslo pasu">
          <input placeholder="CZ 87654321" value={data.passport_number} onChange={e => set('passport_number', e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <Toggle
          checked={data.crz_registered}
          onChange={() => set('crz_registered', !data.crz_registered)}
          label="Registrováno v plemenné knize / registru"
          sub="Pro psy zákonem povinné (CRZ/ČMKU) · pro ostatní druhy doporučeno"
        />

        {data.crz_registered && (
          <div className="rounded-lg" style={{ padding: '14px', background: '#F7F4F0', border: '1px solid #F0EDE8' }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Registr" lawTag>
                <select value={data.crz_registry} onChange={e => set('crz_registry', e.target.value)} style={inputStyle}>
                  <option value="crz">CRZ — Centrální registr zvířat</option>
                  <option value="cmku">ČMKU — Česká kynologická unie</option>
                  <option value="upl">ÚPL — Ústřední plemenná kniha</option>
                  <option value="other">Jiný registr</option>
                </select>
              </Field>
              <Field label="Datum registrace">
                <input type="date" value={data.crz_reg_date} onChange={e => set('crz_reg_date', e.target.value)} style={inputStyle} />
              </Field>
            </div>
            {data.crz_registry === 'crz' && (
              <div className="mt-2 text-[11px] font-semibold flex gap-1.5" style={{ color: '#185FA5' }}>
                <span>⚖️</span>
                <span>CRZ registrace psů je povinná dle §13 zák. 449/2001 Sb. a vyhl. 136/2004 Sb. Lhůta: do 72 h od příjmu nalezeného psa.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Med Records Editor (Step 4) ───────────────────────── */
const MED_TYPES: { value: MedRecord['record_type']; label: string; icon: string }[] = [
  { value: 'vaccination', label: 'Vakcína',     icon: '💉' },
  { value: 'deworming',   label: 'Odčervení',   icon: '🐛' },
  { value: 'medication',  label: 'Lék',         icon: '💊' },
  { value: 'exam',        label: 'Vyšetření',   icon: '🔬' },
  { value: 'treatment',   label: 'Ošetření',    icon: '🩺' },
  { value: 'note',        label: 'Poznámka',    icon: '📝' },
]

const TYPE_SUGGESTIONS: Record<string, string[]> = {
  vaccination: ['Vzteklina', 'Kombinovaná (DHLPP)', 'Bordetella', 'Leishmanióza', 'FeLV'],
  deworming:   ['Milbemax', 'Drontal Plus', 'Advocate'],
  medication:  [],
  exam:        ['Vstupní veterinární vyšetření', 'Krevní testy', 'RTG'],
  treatment:   ['Ošetření ran', 'Infuze', 'Obvaz'],
  note:        [],
}

function MedRecordsEditor({
  records,
  onChange,
}: {
  records: MedRecord[]
  onChange: (records: MedRecord[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Omit<MedRecord, '_id'>>({
    record_date: TODAY,
    record_type: 'vaccination',
    title: '',
    description: '',
    vet_name: '',
  })

  function addRecord() {
    if (!draft.title.trim()) return
    onChange([...records, { ...draft, _id: crypto.randomUUID() }])
    setDraft({ record_date: TODAY, record_type: 'vaccination', title: '', description: '', vet_name: '' })
    setAdding(false)
  }

  function removeRecord(id: string) {
    onChange(records.filter(r => r._id !== id))
  }

  const typeInfo = (t: string) => MED_TYPES.find(x => x.value === t)

  return (
    <div className="flex flex-col gap-3">
      {/* Existing records */}
      {records.map(rec => {
        const t = typeInfo(rec.record_type)
        return (
          <div key={rec._id} className="flex items-start gap-3 rounded-lg" style={{ padding: '10px 12px', background: '#F7F4F0', border: '1px solid #F0EDE8' }}>
            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>{t?.icon ?? '📋'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm" style={{ color: '#2C1810' }}>{rec.title}</span>
                <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: '#E8E4E0', color: '#6B4030' }}>{t?.label}</span>
              </div>
              {rec.description && <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>{rec.description}</div>}
              <div className="flex gap-2 mt-1 text-[11px]" style={{ color: '#A09890' }}>
                <span>📅 {new Date(rec.record_date).toLocaleDateString('cs-CZ')}</span>
                {rec.vet_name && <span>· 👨‍⚕️ {rec.vet_name}</span>}
              </div>
            </div>
            <button onClick={() => removeRecord(rec._id)} className="text-xs font-black flex-shrink-0" style={{ color: '#C4B8A8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>✕</button>
          </div>
        )
      })}

      {/* Add form */}
      {adding ? (
        <div className="flex flex-col gap-3 rounded-lg" style={{ padding: '14px', background: '#FDFCFA', border: '2px solid #E8634A' }}>
          {/* Type selector */}
          <div className="flex flex-wrap gap-1.5">
            {MED_TYPES.map(t => (
              <button
                key={t.value} type="button"
                onClick={() => setDraft(d => ({ ...d, record_type: t.value, title: '' }))}
                className="text-[11px] font-black rounded-full px-2.5 py-1"
                style={{ border: `2px solid ${draft.record_type === t.value ? '#E8634A' : '#F0EDE8'}`, background: draft.record_type === t.value ? '#FDEAE6' : 'white', color: draft.record_type === t.value ? '#E8634A' : '#6B4030', cursor: 'pointer' }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Název / popis" req>
              <input
                placeholder={TYPE_SUGGESTIONS[draft.record_type]?.[0] ?? 'Název záznamu'}
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                list="med-suggestions"
                style={inputStyle}
              />
              <datalist id="med-suggestions">
                {(TYPE_SUGGESTIONS[draft.record_type] ?? []).map(s => <option key={s} value={s} />)}
              </datalist>
            </Field>
            <Field label="Datum">
              <input type="date" value={draft.record_date} onChange={e => setDraft(d => ({ ...d, record_date: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Veterinář">
              <input placeholder="MVDr. Horáková" value={draft.vet_name} onChange={e => setDraft(d => ({ ...d, vet_name: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Poznámka">
              <input placeholder="Dávka, výrobce, reakce..." value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} style={inputStyle} />
            </Field>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addRecord}
              disabled={!draft.title.trim()}
              className="font-black text-xs text-white rounded-lg"
              style={{ padding: '7px 16px', background: '#2D8A4E', border: 'none', cursor: draft.title.trim() ? 'pointer' : 'default', opacity: draft.title.trim() ? 1 : 0.5 }}
            >
              + Přidat záznam
            </button>
            <button
              onClick={() => setAdding(false)}
              className="font-black text-xs rounded-lg"
              style={{ padding: '7px 12px', background: 'white', border: '2px solid #F0EDE8', color: '#8B6550', cursor: 'pointer' }}
            >
              Zrušit
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-lg font-bold text-sm"
          style={{ padding: '11px 14px', border: '2px dashed #D5CFC8', background: 'white', color: '#8B6550', cursor: 'pointer', width: '100%' }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          Přidat zdravotní záznam
          <span className="text-xs font-semibold ml-auto" style={{ color: '#B0A8A0' }}>vakcína, odčervení, vyšetření…</span>
        </button>
      )}
    </div>
  )
}

/* ─── Step 4 ─────────────────────────────────────────────── */
function Step4({ data, set }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 rounded-lg text-xs font-semibold" style={{ padding: '12px 14px', background: '#E6F1FB', borderLeft: '3px solid #185FA5', color: '#185FA5' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>⚖️</span>
        <span>Karanténa trvá min. 14 dní dle §25 zák. 246/1992 Sb. Zdravotní záznamy jsou zákonně povinné.</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Zahájení karantény" lawTag>
          <input type="date" value={data.quarantine_start} onChange={e => set('quarantine_start', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Veterinář karantény" lawTag>
          <input placeholder="MVDr. Horáková" value={data.quarantine_vet} onChange={e => set('quarantine_vet', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Zdravotní stav" lawTag>
          <select value={data.health_status} onChange={e => set('health_status', e.target.value)} style={inputStyle}>
            <option value="">Vyberte...</option>
            {Object.entries(HEALTH_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Váha při příjmu (kg)">
          <input type="number" step={0.1} min={0} placeholder="22.5" value={data.weight_on_arrival} onChange={e => set('weight_on_arrival', e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <div>
        <div className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: '#2C1810' }}>
          💊 Zdravotní záznamy
          <span className="rounded font-black normal-case tracking-normal px-1.5 py-0.5" style={{ fontSize: '9px', background: '#E6F1FB', color: '#185FA5' }}>Zákon</span>
          {data.med_records.length > 0 && (
            <span className="text-xs font-bold rounded-full px-2 py-0.5 ml-1" style={{ background: '#EAF3DE', color: '#2D8A4E' }}>
              {data.med_records.length} {data.med_records.length === 1 ? 'záznam' : data.med_records.length < 5 ? 'záznamy' : 'záznamů'}
            </span>
          )}
        </div>
        <MedRecordsEditor records={data.med_records} onChange={recs => set('med_records', recs)} />
      </div>
    </div>
  )
}

/* ─── Step 5 — Shrnutí ───────────────────────────────────── */
const ORIGIN_LABEL: Record<string, string> = {
  found:            'Nalezeno nálezcem',
  municipal_capture:'Odchyceno obcí',
  surrendered:      'Odevzdáno majitelem',
  seized:           'Odebráno (SVS/Policie)',
  transferred:      'Přemístěno z útulku',
  other:            'Jiné',
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="flex-shrink-0 w-5 text-center">{icon}</span>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#8B6550', minWidth: '100px' }}>{label}</span>
      <span className="text-xs font-black" style={{ color: '#2C1810' }}>{value}</span>
    </div>
  )
}

function Step5Summary({ data, species }: { data: WizardData; species: Species[] }) {
  const speciesName  = species.find(s => s.id === data.species_id)?.name_cs
  const sexLabel     = data.sex === 'male' ? 'Samec' : data.sex === 'female' ? 'Samice' : data.sex === 'unknown' ? 'Neznámé' : null
  const statusLabels: Record<string, string> = { intake: 'V příjmu', available: 'K adopci', reserved: 'Rezervovaný', foster: 'Dočasná péče' }
  const healthLabel  = data.health_status ? (HEALTH_STATUS_LABEL as Record<string, string>)[data.health_status] : null
  const quarEnd      = data.quarantine_start
    ? new Date(new Date(data.quarantine_start).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')
    : null

  const nextSteps = [
    { done: !!data.name,            label: 'Jméno zvířete' },
    { done: !!data.species_id,      label: 'Druh zvířete' },
    { done: !!data.intake_date,     label: 'Datum příjmu' },
    { done: !!data.finder_name,     label: 'Nálezce / odevzdávající' },
    { done: !!data.chip_number,     label: 'Číslo čipu' },
    { done: data.crz_registered,    label: 'CRZ registrace' },
    { done: !!data.quarantine_start,label: 'Zahájení karantény' },
    { done: !!data.quarantine_vet,  label: 'Veterinář karantény' },
    { done: !!data.health_status,   label: 'Zdravotní stav' },
    { done: data.med_records.length > 0, label: 'Zdravotní záznamy' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Info */}
      <div className="flex gap-2 rounded-lg text-xs font-semibold" style={{ padding: '12px 14px', background: '#EAF3DE', borderLeft: '3px solid #2D8A4E', color: '#1a5e2e' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>✅</span>
        <span>Vše připraveno. Stiskni <strong>Přijmout zvíře</strong> pro uložení záznamu — profil nebude zveřejněn.</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Základní info */}
        <div className="rounded-lg" style={{ padding: '14px', background: '#FDFCFA', border: '1px solid #F0EDE8' }}>
          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>🐾 Základní info</div>
          <SummaryRow icon="" label="Jméno" value={data.name || '—'} />
          <SummaryRow icon="" label="Druh" value={speciesName ?? null} />
          <SummaryRow icon="" label="Pohlaví" value={sexLabel} />
          <SummaryRow icon="" label="Plemeno" value={data.breed || null} />
          <SummaryRow icon="" label="Věk" value={data.age_years ? `${data.age_years} r.` : null} />
          <SummaryRow icon="" label="Váha" value={data.weight_on_arrival || data.weight_kg ? `${data.weight_on_arrival || data.weight_kg} kg` : null} />
          <SummaryRow icon="" label="Status" value={statusLabels[data.adoption_status] ?? null} />
        </div>

        {/* Příjem */}
        <div className="rounded-lg" style={{ padding: '14px', background: '#FDFCFA', border: '1px solid #F0EDE8' }}>
          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>📥 Příjem</div>
          <SummaryRow icon="" label="Datum" value={data.intake_date ? new Date(data.intake_date).toLocaleDateString('cs-CZ') : null} />
          <SummaryRow icon="" label="Pracovník" value={data.intake_worker || null} />
          <SummaryRow icon="" label="Způsob" value={ORIGIN_LABEL[data.origin] ?? null} />
          <SummaryRow icon="" label="Místo nálezu" value={data.found_location || null} />
          <SummaryRow icon="" label="Nálezce" value={data.finder_name || null} />
          <SummaryRow icon="" label="Box" value={data.box || null} />
        </div>

        {/* Karanténa & zdraví */}
        <div className="rounded-lg" style={{ padding: '14px', background: '#FDFCFA', border: '1px solid #F0EDE8' }}>
          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>🔒 Karanténa a zdraví</div>
          <SummaryRow icon="" label="Start karantény" value={data.quarantine_start ? new Date(data.quarantine_start).toLocaleDateString('cs-CZ') : null} />
          <SummaryRow icon="" label="Konec (min. 14 d.)" value={quarEnd} />
          <SummaryRow icon="" label="Veterinář" value={data.quarantine_vet || null} />
          <SummaryRow icon="" label="Zdravotní stav" value={healthLabel} />
          <SummaryRow icon="" label="Záznamy" value={data.med_records.length > 0 ? `${data.med_records.length} přidaných` : null} />
        </div>

        {/* Chybějící data */}
        <div className="rounded-lg" style={{ padding: '14px', background: '#FDFCFA', border: '1px solid #F0EDE8' }}>
          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>📋 Co doplnit v profilu</div>
          <div className="flex flex-col gap-1.5">
            {nextSteps.map(s => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span style={{ width: '14px', height: '14px', flexShrink: 0, borderRadius: '3px', background: s.done ? '#2D8A4E' : '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 900 }}>
                  {s.done ? '✓' : ''}
                </span>
                <span style={{ color: s.done ? '#2D8A4E' : '#8B6550', textDecoration: s.done ? 'none' : 'none' }}>{s.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs mt-1 pt-1" style={{ borderTop: '1px solid #F0EDE8' }}>
              <span style={{ width: '14px', height: '14px', flexShrink: 0, borderRadius: '3px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', fontSize: '9px', fontWeight: 900 }}>→</span>
              <span style={{ color: '#185FA5' }}>Fotky — po příjmu v profilu zvířete</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ width: '14px', height: '14px', flexShrink: 0, borderRadius: '3px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', fontSize: '9px', fontWeight: 900 }}>→</span>
              <span style={{ color: '#185FA5' }}>Povaha a příběh — až zvíře poznáte</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ width: '14px', height: '14px', flexShrink: 0, borderRadius: '3px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', fontSize: '9px', fontWeight: 900 }}>→</span>
              <span style={{ color: '#185FA5' }}>Po karanténě přepnout na K adopci</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
