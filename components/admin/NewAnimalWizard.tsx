'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WorkflowBar } from './AnimalWorkflowCard'

/* ─── Types ─────────────────────────────────────────────── */
interface Species { id: string; name_cs: string }

interface WizardData {
  // Step 1 — Základní info
  name: string
  species_id: string
  sex: string
  adoption_status: string
  urgent: boolean
  breed: string
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
  municipality: string
  finder_name: string
  finder_phone: string
  finder_email: string
  finder_address: string
  // Step 3 — Identifikace
  chip_number: string
  crz_registered: boolean
  passport_number: string
  passport_in_shelter: boolean
  // Step 4 — Karanténa & zdraví
  quarantine_start: string
  quarantine_vet: string
  health_status: string
  weight_on_arrival: string
  vaccination_notes: string
  // Step 5 — Profil & fotky
  story: string
  good_with_kids: boolean
  good_with_dogs: boolean
  good_with_cats: boolean
  published: boolean
  adoption_fee: string
  energy_level: string
  care_level: string
  suitable_for: string[]
  good_with_seniors: boolean
}

const INITIAL: WizardData = {
  name: '', species_id: '', sex: '', adoption_status: 'intake', urgent: false,
  breed: '', age_years: '', weight_kg: '', color: '',
  intake_date: new Date().toISOString().slice(0, 10), intake_time: '', intake_worker: '',
  origin: 'found', found_location: '', found_date: '', box: '', municipality: '',
  finder_name: '', finder_phone: '', finder_email: '', finder_address: '',
  chip_number: '', crz_registered: false, passport_number: '', passport_in_shelter: false,
  quarantine_start: new Date().toISOString().slice(0, 10), quarantine_vet: '', health_status: '', weight_on_arrival: '', vaccination_notes: '',
  story: '', good_with_kids: false, good_with_dogs: false, good_with_cats: false, published: false, adoption_fee: '',
  energy_level: '', care_level: '', suitable_for: [], good_with_seniors: false,
}

const STEPS = [
  { label: 'Základní\ninfo',   icon: '🐾' },
  { label: 'Příjem &\nnálezce', icon: '📥' },
  { label: 'Identifi-\nkace',  icon: '🔖' },
  { label: 'Karanténa\n& zdraví', icon: '🔒' },
  { label: 'Profil &\nfotky',  icon: '📷' },
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
      style={{
        padding: '12px', border: `2px solid ${sel ? '#E8634A' : '#F0EDE8'}`,
        background: sel ? '#FFF8F7' : 'white',
      }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <span className="font-black text-xs" style={{ color: sel ? '#E8634A' : '#6B4030' }}>{label}</span>
    </div>
  )
}

/* ─── Toggle ─────────────────────────────────────────────── */
function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg"
      style={{ padding: '11px 14px', border: '2px solid #F0EDE8', gap: '10px' }}
    >
      <div>
        <div className="font-black text-sm">{label}</div>
        {sub && <div className="text-xs" style={{ color: '#8B6550' }}>{sub}</div>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className="relative flex-shrink-0 rounded-full transition-colors"
        style={{ width: '42px', height: '22px', background: checked ? '#2D8A4E' : '#D5CFC8', border: 'none', cursor: 'pointer' }}
      >
        <span
          className="absolute top-[3px] rounded-full transition-transform"
          style={{
            left: '3px', width: '16px', height: '16px', background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════ */
export default function NewAnimalWizard({ institutionId, species }: { institutionId: string; species: Species[] }) {
  const [step, setStep] = useState(0) // 0-indexed
  const [data, setData] = useState<WizardData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function set(field: keyof WizardData, value: string | boolean | string[]) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(goToEdit = false) {
    setSaving(true)
    try {
      // Explicitní mapování — pouze existující DB sloupce
      const body: Record<string, unknown> = {
        institution_id:      institutionId,
        name:                data.name.trim() || 'Nové zvíře',
        species_id:          data.species_id || null,
        sex:                 data.sex || null,
        breed:               data.breed || null,
        color:               data.color || null,
        birth_year:          data.age_years ? new Date().getFullYear() - Number(data.age_years) : null,
        weight_kg:           data.weight_kg ? Number(data.weight_kg) : null,
        adoption_status:     data.adoption_status,
        urgent:              data.urgent,
        intake_date:         data.intake_date || null,
        intake_time:         data.intake_time || null,
        intake_worker:       data.intake_worker || null,
        origin:              data.origin || null,
        found_location:      data.found_location || null,
        found_date:          data.found_date || null,
        intake_finder_name:  data.finder_name || null,
        intake_finder_phone: data.finder_phone || null,
        intake_finder_email: data.finder_email || null,
        intake_finder_address: data.finder_address || null,
        chip_number:         data.chip_number || null,
        passport_number:     data.passport_number || null,
        crz_registered:      data.crz_registered,
        quarantine_start:    data.quarantine_start || null,
        quarantine_vet:      data.quarantine_vet || null,
        health_status:       data.health_status || null,
        story:               data.story || null,
        adoption_fee:        data.adoption_fee ? Number(data.adoption_fee) : null,
        activity_level:      data.energy_level || null,
        care_difficulty:     data.care_level || null,
        suitable_for_flat:   data.suitable_for.includes('flat'),
        suitable_for_house:  data.suitable_for.includes('house'),
        good_with_kids:      data.good_with_kids,
        good_with_dogs:      data.good_with_dogs,
        good_with_cats:      data.good_with_cats,
        good_with_adults:    data.good_with_seniors,
        published:           false, // wizard nikdy nepublikuje
      }

      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const json = await res.json() as { id?: string; error?: string }
        if (json.id) {
          router.push(goToEdit ? `/admin/animals/${json.id}/edit` : `/admin/animals/${json.id}`)
          return
        }
      }
      router.push('/admin/animals')
    } catch {
      router.push('/admin/animals')
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

        {/* Steps stepper */}
        <div className="flex overflow-x-auto pb-1 mb-5" style={{ gap: 0 }}>
          {STEPS.map((s, i) => {
            const done   = i < step
            const active = i === step
            return (
              <div key={i} className="flex flex-col items-center flex-1 relative" style={{ minWidth: '64px' }}>
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute z-0"
                    style={{
                      top: '13px',
                      left: 'calc(50% + 14px)',
                      right: 'calc(-50% + 14px)',
                      height: '2px',
                      background: done ? '#2D8A4E' : '#E8E4E0',
                    }}
                  />
                )}
                <div
                  className="relative z-10 flex items-center justify-center rounded-full font-black"
                  style={{
                    width: '26px', height: '26px', fontSize: '10px',
                    border: `2px solid ${done ? '#2D8A4E' : active ? '#E8634A' : '#D5CFC8'}`,
                    background: done ? '#2D8A4E' : active ? '#E8634A' : 'white',
                    color: done ? 'white' : active ? 'white' : '#B0A8A0',
                    boxShadow: active ? '0 0 0 3px rgba(232,99,74,.2)' : undefined,
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div
                  className="text-center font-black mt-1"
                  style={{ fontSize: '10px', color: done ? '#2D8A4E' : active ? '#E8634A' : '#B0A8A0', lineHeight: 1.2 }}
                >
                  {stepLabels[i].map((l, li) => <span key={li}>{l}{li < stepLabels[i].length - 1 && <br />}</span>)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Step card */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid #F0EDE8' }}>
          {/* wz-header */}
          <div className="flex items-center gap-3 border-b-2" style={{ padding: '16px 20px', borderColor: '#F0EDE8' }}>
            <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: '38px', height: '38px', background: '#FDEAE6', fontSize: '20px' }}>
              {STEPS[step].icon}
            </div>
            <div>
              <h2 className="font-black" style={{ fontSize: '16px', color: '#2C1810' }}>Krok {step + 1} — {STEP_TITLES[step]}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8B6550' }}>{STEP_SUBTITLES[step]}</p>
            </div>
          </div>

          {/* wz-body */}
          <div style={{ padding: '20px' }}>
            {step === 0 && <Step1 data={data} set={set} species={species} />}
            {step === 1 && <Step2 data={data} set={set} />}
            {step === 2 && <Step3 data={data} set={set} />}
            {step === 3 && <Step4 data={data} set={set} />}
            {step === 4 && <Step5 data={data} set={set} />}
          </div>

          {/* wz-footer */}
          <div
            className="flex items-center justify-between gap-3 border-t-2"
            style={{ padding: '14px 20px', borderColor: '#F0EDE8', background: '#FDFCFA' }}
          >
            <div className="flex items-center gap-2 text-xs" style={{ color: '#8B6550' }}>
              <span>Krok {step + 1} z 5</span>
              <div style={{ width: '80px', height: '4px', background: '#F0EDE8', borderRadius: '2px' }}>
                <div style={{ height: '100%', background: '#E8634A', borderRadius: '2px', width: `${((step + 1) / 5) * 100}%`, transition: 'width .3s' }} />
              </div>
              <span className="font-black" style={{ color: '#2D8A4E' }}>{Math.round(((step + 1) / 5) * 100)} %</span>
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="font-black rounded-lg"
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'white', border: '2px solid #F0EDE8', color: '#6B4030', cursor: 'pointer' }}
                >
                  ← Zpět
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="font-black rounded-lg text-white"
                  style={{ padding: '6px 12px', fontSize: '12px', background: '#E8634A', border: 'none', cursor: 'pointer' }}
                >
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

        {/* Next steps hint */}
        <div className="mt-3 rounded-lg" style={{ padding: '14px', background: 'white', border: '1px solid #F0EDE8' }}>
          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>Další kroky po dokončení</div>
          <div className="flex gap-2 flex-wrap">
            {['🔖 3. Čip + pas + CRZ', '🔒 4. Karanténa (auto-start)', '💊 4. Vakcíny + léky', '📷 5. Fotky + profil'].map(t => (
              <span key={t} className="rounded-full text-xs font-black" style={{ padding: '5px 12px', background: '#F0EDE8', color: '#6B4030' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <WorkflowBar active="new" />
    </div>
  )
}

const STEP_TITLES = [
  'Základní informace',
  'Příjem a nálezce',
  'Identifikace',
  'Karanténa a zdraví',
  'Profil a fotky',
]
const STEP_SUBTITLES = [
  'Druh, jméno, pohlaví a status zvířete',
  'Zákonné záznamy o příjmu · §25b zák. 246/1992 Sb. — nelze přeskočit',
  'Čip, CRZ registrace, cestovní pas',
  'Zahájení karantény a základní zdravotní stav',
  'Příběh, fotky a zveřejnění profilu',
]

/* ─── Step 1 ─────────────────────────────────────────────── */
function Step1({ data, set, species }: { data: WizardData; set: (k: keyof WizardData, v: string | boolean | string[]) => void; species: Species[] }) {
  const [breedSuggestions, setBreedSuggestions] = useState<string[]>([])

  useEffect(() => {
    const sid = data.species_id
    if (!sid) return
    fetch(`/api/breeds?species_id=${sid}`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: { name_cs?: string }[]) => {
        const names = rows.map(r => r.name_cs ?? '').filter(Boolean)
        setBreedSuggestions(names)
      })
      .catch(() => {})
  }, [data.species_id])

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
        <Field label="Plemeno / rasa">
          <input
            value={data.breed}
            onChange={e => set('breed', e.target.value)}
            placeholder="Labrador mix"
            list="breed-suggestions"
            style={inputStyle}
          />
          <datalist id="breed-suggestions">
            <option value="Kříženec" />
            {breedSuggestions.map(b => <option key={b} value={b} />)}
          </datalist>
        </Field>
        <Field label="Věk (roky)">
          <input type="number" min={0} max={30} value={data.age_years} onChange={e => set('age_years', e.target.value)} placeholder="3" style={inputStyle} />
        </Field>
        <Field label="Váha (kg)">
          <input type="number" min={0} step={0.1} value={data.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="22" style={inputStyle} />
        </Field>
      </div>

      <div>
        <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.05em' }}>Status při příjmu</div>
        <div className="grid grid-cols-4 gap-2">
          <StatusCard value="intake"   label="V příjmu"    icon="📥" current={data.adoption_status} onClick={() => set('adoption_status', 'intake')} />
          <StatusCard value="available" label="K adopci"   icon="🏠" current={data.adoption_status} onClick={() => set('adoption_status', 'available')} />
          <StatusCard value="treatment" label="V léčbě"    icon="💊" current={data.adoption_status} onClick={() => set('adoption_status', 'treatment')} />
          <StatusCard value="foster"   label="Dočasná péče" icon="🤲" current={data.adoption_status} onClick={() => set('adoption_status', 'foster')} />
        </div>
      </div>

      <Toggle
        checked={data.urgent}
        onChange={() => set('urgent', !data.urgent)}
        label="Urgentní příjem"
        sub="Zvíře potřebuje okamžitou péči nebo je ve špatném stavu"
      />
    </div>
  )
}

/* ─── Step 2 ─────────────────────────────────────────────── */
function Step2({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: string | boolean | string[]) => void }) {
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
            <option value="municipal">Odchyceno obcí</option>
            <option value="surrendered">Odevzdáno majitelem</option>
            <option value="confiscated">Odebráno (SVS/Policie)</option>
            <option value="transferred">Přemístěno z jiného útulku</option>
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
        <Field label="Obec / plátce">
          <input placeholder="Město Praha..." value={data.municipality} onChange={e => set('municipality', e.target.value)} style={inputStyle} />
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
function Step3({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: string | boolean | string[]) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-lg text-xs font-semibold" style={{ padding: '12px 14px', background: '#EAF3DE', borderLeft: '3px solid #2D8A4E', color: '#1a5e2e' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>🔖</span>
        <span>Čip umožňuje dohledání majitele. Registrace v CRZ je zákonná povinnost do 72 hodin.</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Číslo čipu" lawTag>
          <input placeholder="203 000 123 456 789" value={data.chip_number} onChange={e => set('chip_number', e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </Field>
        <Field label="Číslo pasu">
          <input placeholder="CZ 87654321" value={data.passport_number} onChange={e => set('passport_number', e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Toggle
          checked={data.crz_registered}
          onChange={() => set('crz_registered', !data.crz_registered)}
          label="Zaregistrováno v CRZ"
          sub="Centrální registr zvířat — zákonná povinnost"
        />
        <Toggle
          checked={data.passport_in_shelter}
          onChange={() => set('passport_in_shelter', !data.passport_in_shelter)}
          label="Pas je v útulku"
          sub="Cestovní pas zvířete byl předán útulku"
        />
      </div>
    </div>
  )
}

/* ─── Step 4 ─────────────────────────────────────────────── */
function Step4({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: string | boolean | string[]) => void }) {
  return (
    <div className="flex flex-col gap-4">
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
            <option value="good">Dobrý</option>
            <option value="fair">Uspokojivý</option>
            <option value="poor">Špatný</option>
            <option value="critical">Kritický</option>
            <option value="unknown">Neznámý</option>
          </select>
        </Field>
        <Field label="Váha při příjmu (kg)">
          <input type="number" step={0.1} min={0} placeholder="22.5" value={data.weight_on_arrival} onChange={e => set('weight_on_arrival', e.target.value)} style={inputStyle} />
        </Field>
        <div className="col-span-2">
          <Field label="Poznámka k vakcínám / léčbě">
            <input placeholder="Vakcína vzteklina: 15. 3. 2024..." value={data.vaccination_notes} onChange={e => set('vaccination_notes', e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>
    </div>
  )
}

/* ─── RadioPills helper ──────────────────────────────────── */
function RadioPills({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-black uppercase text-xs" style={{ color: '#8B6550', letterSpacing: '.06em' }}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const sel = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="rounded-full text-xs font-black transition-colors"
              style={{
                padding: '5px 14px',
                border: `2px solid ${sel ? '#E8634A' : '#F0EDE8'}`,
                background: sel ? '#FDEAE6' : 'white',
                color: sel ? '#E8634A' : '#6B4030',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step 5 ─────────────────────────────────────────────── */
function Step5({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: string | boolean | string[]) => void }) {
  function toggleSuitableFor(val: string) {
    const current = data.suitable_for
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val]
    set('suitable_for', next)
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Příběh zvířete">
        <textarea
          rows={4}
          placeholder="Bella byla nalezena v parku... Miluje procházky a hraní si s míčem..."
          value={data.story}
          onChange={e => set('story', e.target.value)}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '88px' }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Adopční poplatek (Kč)">
          <input type="number" min={0} step={100} placeholder="3000" value={data.adoption_fee} onChange={e => set('adoption_fee', e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <RadioPills
        label="Aktivita (energy_level)"
        options={[
          { value: 'low',       label: 'Nízká' },
          { value: 'medium',    label: 'Střední' },
          { value: 'high',      label: 'Vysoká' },
          { value: 'very_high', label: 'Velmi vysoká' },
        ]}
        value={data.energy_level}
        onChange={v => set('energy_level', v)}
      />

      <RadioPills
        label="Náročnost chovu (care_level)"
        options={[
          { value: 'easy',   label: 'Lehká' },
          { value: 'medium', label: 'Střední' },
          { value: 'hard',   label: 'Náročná' },
        ]}
        value={data.care_level}
        onChange={v => set('care_level', v)}
      />

      <div className="flex flex-col gap-1">
        <label className="font-black uppercase text-xs" style={{ color: '#8B6550', letterSpacing: '.06em' }}>Vhodné bydlení</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'flat',    label: 'Byt' },
            { value: 'house',   label: 'Dům se zahradou' },
            { value: 'country', label: 'Venkov' },
          ].map(opt => {
            const sel = data.suitable_for.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleSuitableFor(opt.value)}
                className="rounded-full text-xs font-black transition-colors"
                style={{
                  padding: '5px 14px',
                  border: `2px solid ${sel ? '#E8634A' : '#F0EDE8'}`,
                  background: sel ? '#FDEAE6' : 'white',
                  color: sel ? '#E8634A' : '#6B4030',
                  cursor: 'pointer',
                }}
              >
                {sel ? '☑ ' : ''}{opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#8B6550', letterSpacing: '.05em' }}>Kompatibilita</div>
        <Toggle checked={data.good_with_kids}    onChange={() => set('good_with_kids',    !data.good_with_kids)}    label="Vhodné pro děti" />
        <Toggle checked={data.good_with_seniors} onChange={() => set('good_with_seniors', !data.good_with_seniors)} label="Vhodné pro seniory" />
        <Toggle checked={data.good_with_dogs}    onChange={() => set('good_with_dogs',    !data.good_with_dogs)}    label="Vychází se psy" />
        <Toggle checked={data.good_with_cats}    onChange={() => set('good_with_cats',    !data.good_with_cats)}    label="Vychází s kočkami" />
      </div>

      <div className="rounded-lg" style={{ padding: '14px', background: '#F7F4F0', border: '1px solid #F0EDE8' }}>
        <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550' }}>Fotky</div>
        <div className="flex items-center justify-center rounded-lg text-sm font-semibold cursor-pointer hover:opacity-75" style={{ padding: '20px', border: '2px dashed #D5CFC8', color: '#8B6550', background: 'white' }}>
          📷 Přetáhněte fotky sem nebo klikněte pro výběr
        </div>
        <p className="text-xs mt-2" style={{ color: '#A09890' }}>Fotky lze přidat i po vytvoření karty zvířete.</p>
      </div>

      <div className="rounded-lg flex gap-2 text-xs" style={{ padding: '12px 14px', background: '#E6F1FB', borderLeft: '3px solid #185FA5', color: '#185FA5' }}>
        <span>ℹ️</span>
        <span>Profil <strong>nebude zveřejněn</strong>. Zveřejnění provedeš ručně na profilu zvířete po doplnění fotek a popisu.</span>
      </div>
    </div>
  )
}
