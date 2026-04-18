'use client'
import React, { useState } from 'react'

interface Props {
  animal: Record<string, unknown>
  institution: { id: string; name: string; type: string }
  medicalRecords: Record<string, unknown>[]
}

// ── Labels ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  intake:           { bg: '#E6F1FB', text: '#185FA5', label: 'V příjmu' },
  quarantine:       { bg: '#F0E6FB', text: '#6B35B5', label: 'Karanténa' },
  available:        { bg: '#FDEAE6', text: '#E8634A', label: 'K adopci' },
  reserved:         { bg: '#FFF3D6', text: '#7a5800', label: 'Rezervováno' },
  adopted:          { bg: '#EAF3DE', text: '#2D8A4E', label: 'Adoptováno' },
  foster:           { bg: '#EDE9FB', text: '#6D3BE8', label: 'Dočasná péče' },
  treatment:        { bg: '#FCEBEB', text: '#D83030', label: 'V léčbě' },
  released:         { bg: '#EAF3DE', text: '#2D8A4E', label: 'Vypuštěn' },
  deceased:         { bg: '#F0EDE8', text: '#8B6550', label: 'Uhynul' },
  not_for_adoption: { bg: '#F0EDE8', text: '#8B6550', label: 'Není k adopci' },
  conditional:      { bg: '#FFF0E6', text: '#C05000', label: 'Podmíněná adopce' },
}

const ORIGIN_LABELS: Record<string, string> = {
  found:             'Nalezeno',
  municipal_capture: 'Odchyceno obcí',
  surrendered:       'Odevzdáno majitelem',
  seized:            'Odebráno (SVS/Policie)',
  transferred:       'Přemístěno z jiného útulku',
  other:             'Jiné',
}

const EXIT_LABELS: Record<string, string> = {
  adopted:     'Adoptováno',
  transferred: 'Přemístěno',
  deceased:    'Uhynul',
  returned:    'Vráceno majiteli',
  escaped:     'Utekl',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: unknown): string {
  if (!d) return '—'
  const dt = new Date(String(d))
  if (isNaN(dt.getTime())) return '—'
  return `${dt.getDate()}. ${dt.getMonth() + 1}. ${dt.getFullYear()}`
}

function daysFrom(d: unknown): number {
  if (!d) return 0
  return Math.floor((Date.now() - new Date(String(d)).getTime()) / 86400000)
}

function daysUntil(d: unknown): number {
  if (!d) return 0
  return Math.ceil((new Date(String(d)).getTime() - Date.now()) / 86400000)
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

// ── Phase detection ──────────────────────────────────────────────────────────

type PhaseKey = 'prijem' | 'karantena' | 'ochrana' | 'kadopci' | 'odchod'

interface PhaseInfo {
  key:   PhaseKey
  icon:  string
  label: string
}

const PHASES: PhaseInfo[] = [
  { key: 'prijem',   icon: '📥', label: 'Příjem' },
  { key: 'karantena', icon: '🔒', label: 'Karanténa' },
  { key: 'ochrana',  icon: '⏳', label: 'Ochranná doba' },
  { key: 'kadopci',  icon: '🏠', label: 'K adopci' },
  { key: 'odchod',   icon: '🚪', label: 'Odchod' },
]

function detectPhase(a: Record<string, unknown>): PhaseKey {
  const status = String(a.adoption_status ?? 'intake')

  // Finální odchod
  if (a.exit_type) return 'odchod'
  if (['adopted', 'deceased'].includes(status)) return 'odchod'

  // Podmíněná adopce = stále v ochranné době
  if (status === 'conditional') return 'ochrana'

  // Karanténa aktivní — PŘED kontrolou adoption_status
  const qEnd = a.quarantine_end ? new Date(String(a.quarantine_end)) : null
  if (a.quarantine_start && qEnd && qEnd > new Date()) return 'karantena'

  // Ochranná doba — POUZE pokud karanténa PROBĚHLA (qEnd v minulosti)
  // Pokud karanténa ještě nezačala (quarantine_start null), zůstaň v příjmu
  const foundOrigins = ['found', 'municipal_capture']
  if (foundOrigins.includes(String(a.origin ?? '')) && a.intake_date) {
    const quarantineDone = qEnd !== null && qEnd <= new Date()
    if (quarantineDone) {
      const protectionEnd = new Date(addMonths(String(a.intake_date), 4))
      if (protectionEnd > new Date()) return 'ochrana'
    }
  }

  // K adopci / rezervace / foster / léčba
  if (['available', 'reserved', 'foster', 'treatment'].includes(status)) return 'kadopci'

  return 'prijem'
}

function phaseIndex(key: PhaseKey): number {
  return PHASES.findIndex(p => p.key === key)
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: unknown }) {
  const display: React.ReactNode =
    value === null || value === undefined || value === ''
      ? '—'
      : React.isValidElement(value)
      ? value
      : String(value as string)
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0" style={{ borderColor: '#F5F0EB' }}>
      <span className="text-sm flex-shrink-0" style={{ color: '#8B6550' }}>{label}</span>
      <span className="text-sm font-semibold text-right" style={{ color: '#2C1810' }}>{display}</span>
    </div>
  )
}

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: bg, color }}>
      {children}
    </span>
  )
}

function AlertBox({ type, children }: { type: 'warn' | 'info' | 'error'; children: React.ReactNode }) {
  const s = {
    warn:  { bg: '#FFF3D6', border: '#F0A500', text: '#7a5800' },
    info:  { bg: '#E6F1FB', border: '#4A9EE0', text: '#185FA5' },
    error: { bg: '#FCEBEB', border: '#D83030', text: '#D83030' },
  }[type]
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 text-sm font-semibold"
      style={{ background: s.bg, borderLeftColor: s.border, color: s.text }}>
      {children}
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #F0EDE8' }}>
      <h3 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: '#8B6550' }}>
        {icon && <span>{icon}</span>}{title}
      </h3>
      {children}
    </div>
  )
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="flex-shrink-0 text-base">{done ? '✅' : '⚪'}</span>
      <span className="text-sm" style={{ color: done ? '#2D8A4E' : '#8B6550' }}>{label}</span>
    </li>
  )
}

// ── Phase panels ─────────────────────────────────────────────────────────────

function PhasePrijem({ a, id }: { a: Record<string, unknown>; id: string }) {
  const hasQ = Boolean(a.quarantine_start)
  const [starting, setStarting] = useState(false)
  const [done, setDone] = useState(false)

  async function startQuarantine() {
    setStarting(true)
    const today = new Date().toISOString().slice(0, 10)
    const end   = addMonths(today, 0).replace(/\d{2}$/, '') + String(new Date().getDate() + 14).padStart(2, '0')
    // 14 dní od dneška
    const qEnd  = new Date(); qEnd.setDate(qEnd.getDate() + 14)
    await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        in_quarantine:   true,
        quarantine_start: today,
        quarantine_end:   qEnd.toISOString().slice(0, 10),
      }),
    })
    setDone(true)
    setStarting(false)
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <div className="space-y-4">
      {/* Karanténa varování */}
      {!hasQ && (
        <div className="rounded-xl p-5" style={{ background: '#FFF3D6', border: '2px solid #F0A500' }}>
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <div className="text-sm font-bold mb-1" style={{ color: '#7a5800' }}>Zahajte karanténu</div>
              <div className="text-xs mb-3" style={{ color: '#7a5800' }}>
                Dle § 5 vyhl. č. 380/2022 Sb. je nově přijaté zvíře povinně umístěno do karantény (14 dní). Karanténu musí zahájit prosím zde.
              </div>
              <button
                onClick={startQuarantine}
                disabled={starting || done}
                className="w-full py-2.5 rounded-xl text-white text-sm font-black border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{ background: '#F0A500' }}>
                {done ? '✓ Karanténa zahájena' : starting ? 'Zahajuji…' : '🔒 Zahájit karanténu (14 dní)'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <Row label="Datum příjmu"    value={fmt(a.intake_date)} />
        <Row label="Čas příjmu"      value={a.intake_time ? String(a.intake_time) : '—'} />
        <Row label="Způsob příjmu"   value={ORIGIN_LABELS[String(a.origin ?? '')] ?? '—'} />
        <Row label="Přijal pracovník" value={a.intake_worker ? String(a.intake_worker) : '—'} />
        <Row label="Evidenční č."    value={a.evidence_number ? String(a.evidence_number) : '—'} />
        <Row label="Místo nálezu"    value={a.found_location ? String(a.found_location) : '—'} />
        <Row label="Datum nálezu"    value={fmt(a.found_date)} />
      </div>

      <div className="pt-1">
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A09080' }}>Nálezce / předchozí majitel</p>
        <Row label="Jméno"    value={a.intake_finder_name ?? a.finder_name ?? '—'} />
        <Row label="Telefon"  value={a.intake_finder_phone ?? a.finder_phone ?? '—'} />
        <Row label="Adresa"   value={a.intake_finder_address ?? '—'} />
        <Row label="E-mail"   value={a.intake_finder_email ?? '—'} />
      </div>

      <ul className="space-y-0.5 mt-2">
        <CheckItem done={Boolean(a.evidence_number)}  label="Evidenční číslo přiděleno" />
        <CheckItem done={Boolean(a.origin)}            label="Způsob příjmu zaznamenán" />
        <CheckItem done={Boolean(a.intake_worker)}     label="Přijímací pracovník uveden" />
        <CheckItem done={Boolean(a.found_location) || !['found','municipal_capture'].includes(String(a.origin))} label="Místo nálezu zaznamenáno" />
        <CheckItem done={hasQ}                         label="Karanténa zahájena" />
      </ul>
    </div>
  )
}

function PhaseKarantena({ a, id, medRecords }: { a: Record<string, unknown>; id: string; medRecords: Record<string, unknown>[] }) {
  const remaining = daysUntil(a.quarantine_end)
  const elapsed   = daysFrom(a.quarantine_start)
  const qRecords  = medRecords.filter(r => String(r.quarantine_note ?? '').length > 0 || daysFrom(r.record_date) <= elapsed)

  const [extending, setExtending] = useState(false)
  const [extDays, setExtDays]     = useState(7)
  const [extDone, setExtDone]     = useState(false)

  const [addingRec, setAddingRec] = useState(false)
  const [recForm, setRecForm]     = useState({ title: '', record_type: 'exam', description: '' })
  const [savingRec, setSavingRec] = useState(false)

  async function extendQuarantine() {
    const newEnd = new Date(String(a.quarantine_end))
    newEnd.setDate(newEnd.getDate() + extDays)
    await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarantine_end: newEnd.toISOString().slice(0, 10) }),
    })
    setExtDone(true)
    setTimeout(() => window.location.reload(), 800)
  }

  async function endQuarantine(result: 'negative' | 'positive') {
    await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        in_quarantine:    false,
        quarantine_end:   new Date().toISOString().slice(0, 10),
        quarantine_result: result,
      }),
    })
    window.location.reload()
  }

  async function saveRecord() {
    if (!recForm.title.trim()) return
    setSavingRec(true)
    await fetch(`/api/animals/${id}/medical-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...recForm,
        record_date: new Date().toISOString().slice(0, 10),
        description: `[Karanténa] ${recForm.description}`,
      }),
    })
    setSavingRec(false)
    setAddingRec(false)
    setRecForm({ title: '', record_type: 'exam', description: '' })
    window.location.reload()
  }

  return (
    <div className="space-y-5">
      {/* Countdown */}
      <div className="rounded-xl p-4 text-center" style={{ background: remaining > 0 ? '#FCEBEB' : '#EAF3DE', border: `1px solid ${remaining > 0 ? '#F5C4B3' : '#BDE8D0'}` }}>
        {remaining > 0 ? (
          <>
            <div className="text-4xl font-black mb-1" style={{ color: '#D83030' }}>{remaining}</div>
            <div className="text-sm font-semibold" style={{ color: '#D83030' }}>dní zbývá do konce karantény</div>
            <div className="text-xs mt-1" style={{ color: '#8B6550' }}>
              Zahájeno: {fmt(a.quarantine_start)} · Konec: {fmt(a.quarantine_end)}
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl mb-1">✅</div>
            <div className="text-sm font-bold" style={{ color: '#2D8A4E' }}>Karanténa ukončena</div>
            <div className="text-xs mt-1" style={{ color: '#8B6550' }}>{fmt(a.quarantine_start)} – {fmt(a.quarantine_end)}</div>
          </>
        )}
      </div>

      <div>
        <Row label="Veterinář"      value={a.quarantine_vet} />
        <Row label="Box"            value={a.quarantine_box} />
        <Row label="Důvod"          value={a.quarantine_reason} />
        <Row label="Výsledek"       value={
          a.quarantine_result === 'negative' ? '✅ Negativní' :
          a.quarantine_result === 'positive' ? '⚠️ Pozitivní' :
          a.quarantine_result === 'inconclusive' ? '❓ Neprůkazné' : '—'
        } />
      </div>

      {/* Akce */}
      {remaining > 0 && (
        <div className="space-y-3">
          {/* Ukončit karanténu */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A09080' }}>Ukončit karanténu</p>
            <div className="flex gap-2">
              <button onClick={() => endQuarantine('negative')}
                className="flex-1 py-2 rounded-lg text-xs font-bold border-none cursor-pointer hover:opacity-90"
                style={{ background: '#EAF3DE', color: '#2D8A4E' }}>
                ✅ Negativní výsledek
              </button>
              <button onClick={() => endQuarantine('positive')}
                className="flex-1 py-2 rounded-lg text-xs font-bold border-none cursor-pointer hover:opacity-90"
                style={{ background: '#FCEBEB', color: '#D83030' }}>
                ⚠️ Pozitivní výsledek
              </button>
            </div>
          </div>

          {/* Prodloužit */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A09080' }}>Prodloužit karanténu</p>
            {extending ? (
              <div className="flex gap-2 items-center">
                <select value={extDays} onChange={e => setExtDays(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg border-2 text-sm outline-none"
                  style={{ borderColor: '#F0EDE8' }}>
                  {[3,5,7,10,14,21,30].map(d => <option key={d} value={d}>+ {d} dní</option>)}
                </select>
                <button onClick={extendQuarantine} disabled={extDone}
                  className="px-4 py-2 rounded-lg text-white text-xs font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#E8634A' }}>
                  {extDone ? '✓ Uloženo' : 'Prodloužit'}
                </button>
                <button onClick={() => setExtending(false)}
                  className="px-3 py-2 rounded-lg text-xs font-bold border-none cursor-pointer"
                  style={{ background: '#F0EDE8', color: '#8B6550' }}>
                  Zrušit
                </button>
              </div>
            ) : (
              <button onClick={() => setExtending(true)}
                className="w-full py-2 rounded-lg text-xs font-bold border-2 cursor-pointer hover:border-[#E8634A] transition-colors"
                style={{ borderColor: '#F0EDE8', color: '#6B4030', background: 'white' }}>
                + Prodloužit karanténu
              </button>
            )}
          </div>

          {/* Záznam během karantény */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A09080' }}>Zdravotní záznam během karantény</p>
            {addingRec ? (
              <div className="space-y-2 p-3 rounded-xl" style={{ background: '#FAFAF8', border: '1px solid #F0EDE8' }}>
                <select value={recForm.record_type} onChange={e => setRecForm(f => ({ ...f, record_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border-2 text-sm outline-none"
                  style={{ borderColor: '#F0EDE8' }}>
                  <option value="exam">Vyšetření</option>
                  <option value="vaccination">Vakcinace</option>
                  <option value="medication">Léčivo</option>
                  <option value="treatment">Ošetření</option>
                  <option value="note">Poznámka</option>
                </select>
                <input value={recForm.title} onChange={e => setRecForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Název záznamu *"
                  className="w-full px-3 py-2 rounded-lg border-2 text-sm outline-none"
                  style={{ borderColor: '#F0EDE8' }} />
                <textarea value={recForm.description} onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Popis (volitelné)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border-2 text-sm outline-none resize-none"
                  style={{ borderColor: '#F0EDE8' }} />
                <div className="flex gap-2">
                  <button onClick={saveRecord} disabled={savingRec || !recForm.title.trim()}
                    className="flex-1 py-2 rounded-lg text-white text-xs font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#E8634A' }}>
                    {savingRec ? 'Ukládám…' : 'Uložit záznam'}
                  </button>
                  <button onClick={() => setAddingRec(false)}
                    className="px-3 py-2 rounded-lg text-xs font-bold border-none cursor-pointer"
                    style={{ background: '#F0EDE8', color: '#8B6550' }}>
                    Zrušit
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingRec(true)}
                className="w-full py-2 rounded-lg text-xs font-bold border-2 cursor-pointer hover:border-[#E8634A] transition-colors"
                style={{ borderColor: '#F0EDE8', color: '#6B4030', background: 'white' }}>
                + Přidat záznam z karantény
              </button>
            )}
          </div>
        </div>
      )}

      {/* Záznamy z karantény */}
      {medRecords.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A09080' }}>Záznamy z karantény ({medRecords.length})</p>
          <ul className="space-y-2">
            {medRecords.map((r, i) => (
              <li key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#FAFAF8', border: '1px solid #F0EDE8' }}>
                <span className="text-base flex-shrink-0">💊</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: '#2C1810' }}>{String(r.title ?? '')}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>{fmt(r.record_date)} · {String(r.record_type ?? '')}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-0.5 pt-1">
        <CheckItem done={Boolean(a.quarantine_start)}  label="Karanténa zahájena" />
        <CheckItem done={Boolean(a.quarantine_vet)}    label="Veterinář přiřazen" />
        <CheckItem done={Boolean(a.quarantine_box)}    label="Box karantény přiřazen" />
        <CheckItem done={Boolean(a.quarantine_result)} label="Výsledek karantény zaznamenán" />
        <CheckItem done={remaining <= 0}               label="Karanténa ukončena" />
      </ul>
    </div>
  )
}

function PhaseOchrana({ a, id }: { a: Record<string, unknown>; id: string }) {
  const intakeDate = String(a.intake_date ?? '')
  const protEnd    = intakeDate ? addMonths(intakeDate, 4) : ''
  const remaining  = protEnd ? daysUntil(protEnd) : 0
  const elapsed    = intakeDate ? daysFrom(intakeDate) : 0
  const isConditional = String(a.adoption_status) === 'conditional'

  // Conditional adoption form state
  const [showCondForm, setShowCondForm] = useState(false)
  const [condName,  setCondName]  = useState('')
  const [condPhone, setCondPhone] = useState('')
  const [condEmail, setCondEmail] = useState('')
  const [condNote,  setCondNote]  = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved,  setSaved]        = useState(false)

  async function startConditional() {
    if (!condName || !condPhone) return
    setSaving(true)
    await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adoption_status:           'conditional',
        conditional_adopter_name:  condName,
        conditional_adopter_phone: condPhone,
        conditional_adopter_email: condEmail || null,
        conditional_adoption_since: new Date().toISOString().slice(0, 10),
        conditional_adoption_note: condNote || null,
        published: false,  // stáhnout z webu
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => window.location.reload(), 800)
  }

  async function finalizeAdoption() {
    await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adoption_status: 'adopted',
        exit_type:       'adopted',
        exit_date:       new Date().toISOString().slice(0, 10),
        adopter_name:    String(a.conditional_adopter_name ?? ''),
        adopter_phone:   String(a.conditional_adopter_phone ?? ''),
        adopter_email:   String(a.conditional_adopter_email ?? ''),
        adopted_at:      new Date().toISOString().slice(0, 10),
      }),
    })
    window.location.reload()
  }

  async function cancelConditional() {
    await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adoption_status:           'intake',
        conditional_adopter_name:  null,
        conditional_adopter_phone: null,
        conditional_adopter_email: null,
        conditional_adoption_since: null,
        conditional_adoption_note: null,
        published: true,
      }),
    })
    window.location.reload()
  }

  // ── Conditional adoption active ──
  if (isConditional) {
    return (
      <div className="space-y-4">
        {/* Status banner */}
        <div className="rounded-xl p-4 text-center" style={{ background: '#FFF0E6', border: '1px solid #F5C4A0' }}>
          <div className="text-3xl mb-1">🤝</div>
          <div className="text-sm font-bold" style={{ color: '#C05000' }}>Podmíněná adopce aktivní</div>
          <div className="text-xs mt-1" style={{ color: '#8B6550' }}>
            {remaining > 0
              ? `Ochranná lhůta ještě běží — zbývá ${remaining} dní (do ${fmt(protEnd)})`
              : 'Ochranná lhůta uplynula — adopci lze finalizovat'}
          </div>
        </div>

        {/* Adopter info */}
        <div>
          <Row label="Podmíněný adoptér" value={String(a.conditional_adopter_name ?? '—')} />
          <Row label="Telefon"           value={String(a.conditional_adopter_phone ?? '—')} />
          <Row label="E-mail"            value={String(a.conditional_adopter_email ?? '—')} />
          <Row label="Podmíněno od"      value={fmt(a.conditional_adoption_since)} />
          {Boolean(a.conditional_adoption_note) && (
            <Row label="Poznámka" value={String(a.conditional_adoption_note)} />
          )}
        </div>

        {/* Legal reminder */}
        {remaining > 0 && (
          <AlertBox type="warn">
            <span>⚖️</span>
            <div>Ochranná lhůta stále běží. Pokud se původní majitel přihlásí, zvíře musí být vráceno. Finalizaci adopce proveďte až po uplynutí {remaining} dní.</div>
          </AlertBox>
        )}

        {/* Actions */}
        {remaining <= 0 ? (
          /* Ochranná lhůta právě vypršela — výzva k finalizaci */
          <div className="rounded-xl p-5" style={{ background: '#EAF3DE', border: '2px solid #2D8A4E' }}>
            <div className="text-center mb-3">
              <div className="text-2xl mb-1">🎉</div>
              <div className="text-sm font-black" style={{ color: '#2D8A4E' }}>Ochranná lhůta uplynula!</div>
              <div className="text-xs mt-1" style={{ color: '#2D8A4E' }}>Podmíněnou adopci lze nyní finalizovat jako standardní.</div>
            </div>
            <button onClick={finalizeAdoption}
              className="w-full py-3 rounded-xl text-white text-base font-black border-none cursor-pointer hover:opacity-90 mb-2"
              style={{ background: '#2D8A4E' }}>
              ✅ Finalizovat adopci
            </button>
            <button onClick={cancelConditional}
              className="w-full py-2 rounded-xl text-sm font-bold border-none cursor-pointer hover:opacity-80"
              style={{ background: '#FCEBEB', color: '#D83030' }}>
              ✕ Zrušit podmíněnou adopci
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancelConditional}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer hover:opacity-80"
              style={{ background: '#FCEBEB', color: '#D83030' }}>
              ✕ Zrušit podmíněnou adopci
            </button>
          </div>
        )}

        <ul className="space-y-0.5 pt-1">
          <CheckItem done={true}                        label="Podmíněná adopce zahájena" />
          <CheckItem done={Boolean(a.conditional_adopter_email)} label="E-mail adoptéra vyplněn" />
          <CheckItem done={remaining <= 0}              label="Ochranná lhůta uplynula" />
          <CheckItem done={false}                       label="Adopce finalizována" />
        </ul>
      </div>
    )
  }

  // ── Normal ochrana view ──
  return (
    <div className="space-y-4">
      <AlertBox type="info">
        <span>⚖️</span>
        <div>
          Dle <strong>§ 1059 OZ (zákon č. 89/2012 Sb.)</strong> může obec / útulek nabýt vlastnictví nalezeného zvířete po <strong>4 měsících</strong>, pokud se majitel nepřihlásí.
        </div>
      </AlertBox>

      {/* Countdown / expired alert */}
      {remaining > 0 ? (
        <div className="rounded-xl p-4 text-center" style={{ background: '#FFF3D6', border: '1px solid #F5D8A0' }}>
          <div className="text-4xl font-black mb-1" style={{ color: '#7a5800' }}>{remaining}</div>
          <div className="text-sm font-semibold" style={{ color: '#7a5800' }}>dní zbývá ochranné doby</div>
          <div className="text-xs mt-1" style={{ color: '#8B6550' }}>
            Příjem: {fmt(a.intake_date)} · Konec ochrany: {fmt(protEnd)} · Uplynulo: {elapsed} dní
          </div>
        </div>
      ) : (
        /* Ochranná lhůta vypršela BEZ podmíněné adopce — výzva k akci */
        <div className="rounded-xl p-5 text-center" style={{ background: '#EAF3DE', border: '2px solid #2D8A4E' }}>
          <div className="text-3xl mb-2">🏠</div>
          <div className="text-base font-black mb-1" style={{ color: '#2D8A4E' }}>Ochranná lhůta uplynula!</div>
          <div className="text-sm mb-4" style={{ color: '#2D8A4E' }}>
            Zvíře je nyní volné k adopci. Zveřejněte profil a nastavte standardní adopci.
          </div>
          <button
            onClick={async () => {
              await fetch(`/api/animals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adoption_status: 'available' }),
              })
              window.location.reload()
            }}
            className="w-full py-3 rounded-xl text-white text-base font-black border-none cursor-pointer hover:opacity-90"
            style={{ background: '#2D8A4E' }}>
            → Přejít k standardní adopci
          </button>
        </div>
      )}

      <div>
        <Row label="Datum příjmu"    value={fmt(a.intake_date)} />
        <Row label="Konec ochrany"   value={fmt(protEnd)} />
        <Row label="Evidenční číslo" value={a.evidence_number} />
        <Row label="CRZ registrace"  value={a.crz_registered ? '✅ Ano' : '❌ Ne'} />
      </div>

      {/* Conditional adoption section — pouze pokud lhůta ještě běží */}
      {remaining > 0 && (!showCondForm ? (
        <div className="rounded-xl p-4" style={{ background: '#FFF0E6', border: '1px solid #F5C4A0' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#C05000' }}>🤝 Podmíněná adopce</p>
          <p className="text-xs mb-3" style={{ color: '#8B6550' }}>
            Zvíře lze svěřit rodině ještě během ochranné lhůty. Adopce je podmíněná — pokud se přihlásí původní majitel, zvíře musí být vráceno.
          </p>
          <button onClick={() => setShowCondForm(true)}
            className="w-full py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90"
            style={{ background: '#C05000', color: 'white' }}>
            🤝 Zahájit podmíněnou adopci
          </button>
        </div>
      ) : (
        /* Conditional adoption form */
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#FFF0E6', border: '1px solid #F5C4A0' }}>
          <p className="text-sm font-bold" style={{ color: '#C05000' }}>🤝 Zahájit podmíněnou adopci</p>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#6B4030' }}>Jméno adoptéra *</label>
            <input type="text" value={condName} onChange={e => setCondName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 text-sm font-semibold focus:outline-none"
              style={{ borderColor: '#F5C4A0', background: 'white', color: '#2C1810' }}
              placeholder="Jana Nováková" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#6B4030' }}>Telefon *</label>
            <input type="tel" value={condPhone} onChange={e => setCondPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 text-sm font-semibold focus:outline-none"
              style={{ borderColor: '#F5C4A0', background: 'white', color: '#2C1810' }}
              placeholder="+420 777 888 999" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#6B4030' }}>E-mail</label>
            <input type="email" value={condEmail} onChange={e => setCondEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 text-sm font-semibold focus:outline-none"
              style={{ borderColor: '#F5C4A0', background: 'white', color: '#2C1810' }}
              placeholder="jana@example.com" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#6B4030' }}>Poznámka (podmínky smlouvy)</label>
            <textarea value={condNote} onChange={e => setCondNote(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border-2 text-sm font-semibold focus:outline-none resize-none"
              style={{ borderColor: '#F5C4A0', background: 'white', color: '#2C1810' }}
              placeholder="Adopce podmíněná — vrácení do 30 dní při přihlášení majitele..." />
          </div>
          <div className="flex gap-2">
            <button onClick={startConditional} disabled={!condName || !condPhone || saving || saved}
              className="flex-1 py-2 rounded-lg text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
              style={{ background: '#C05000' }}>
              {saved ? '✓ Uloženo' : saving ? 'Ukládám…' : '🤝 Potvrdit podmíněnou adopci'}
            </button>
            <button onClick={() => setShowCondForm(false)}
              className="px-3 py-2 rounded-lg text-sm font-bold border-none cursor-pointer"
              style={{ background: '#F0EDE8', color: '#8B6550' }}>
              Zrušit
            </button>
          </div>
        </div>
      ))}

      <ul className="space-y-0.5 pt-1">
        <CheckItem done={Boolean(a.evidence_number)}   label="Evidenční číslo přiděleno" />
        <CheckItem done={Boolean(a.crz_registered)}    label="Registrace v centrální evidenci" />
        <CheckItem done={Boolean(a.chip_number)}       label="Čip zkontrolován / naskenován" />
        <CheckItem done={remaining <= 0}               label="Ochranná doba uplynula" />
      </ul>
    </div>
  )
}

function PhaseKAdopci({ a }: { a: Record<string, unknown> }) {
  const photos = Array.isArray(a.photos) ? a.photos : []
  return (
    <div className="space-y-4">
      <div>
        <Row label="Status" value={
          <Badge bg={STATUS_BADGE[String(a.adoption_status ?? '')]?.bg ?? '#F0EDE8'}
                 color={STATUS_BADGE[String(a.adoption_status ?? '')]?.text ?? '#8B6550'}>
            {STATUS_BADGE[String(a.adoption_status ?? '')]?.label ?? String(a.adoption_status ?? '—')}
          </Badge>
        } />
        <Row label="Zveřejněno"   value={a.published ? <Badge bg="#EAF3DE" color="#2D8A4E">✓ Ano</Badge> : <Badge bg="#F0EDE8" color="#8B6550">Ne</Badge>} />
        <Row label="Urgentní"     value={a.urgent ? <Badge bg="#FDEAE6" color="#E8634A">🆘 Ano</Badge> : 'Ne'} />
        <Row label="Adopční poplatek" value={a.adoption_fee ? `${a.adoption_fee} Kč` : 'Zdarma'} />
        {a.adoption_status === 'foster' && (
          <>
            <Row label="Pečovatel"  value={a.foster_name} />
            <Row label="Telefon"    value={a.foster_phone} />
            <Row label="Foster od"  value={fmt(a.foster_since)} />
          </>
        )}
      </div>

      <ul className="space-y-0.5">
        <CheckItem done={Boolean(a.published)}               label="Profil zveřejněn na webu" />
        <CheckItem done={photos.length > 0}                  label={`Fotografie nahrány (${photos.length})`} />
        <CheckItem done={Boolean(a.description)}             label="Popis povahy vyplněn" />
        <CheckItem done={Boolean(a.story)}                   label="Příběh zvířete vyplněn" />
        <CheckItem done={Boolean(a.primary_photo)}           label="Titulní fotografie zvolena" />
        <CheckItem done={Boolean(a.good_with_kids)}          label="Kompatibilita vyplněna" />
        <CheckItem done={Boolean(a.adoption_fee !== null)}   label="Adopční poplatek nastaven" />
      </ul>
    </div>
  )
}

function PhaseOdchod({ a }: { a: Record<string, unknown> }) {
  const exitType = String(a.exit_type ?? '')
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 text-center" style={{ background: '#EAF3DE', border: '1px solid #BDE8D0' }}>
        <div className="text-3xl mb-1">{exitType === 'deceased' ? '🕊️' : exitType === 'transferred' ? '🔄' : '✅'}</div>
        <div className="text-sm font-bold" style={{ color: '#2D8A4E' }}>
          {EXIT_LABELS[exitType] ?? 'Odchod zazanamenán'}
        </div>
        <div className="text-xs mt-1" style={{ color: '#8B6550' }}>{fmt(a.exit_date)}</div>
      </div>

      {exitType === 'adopted' && (
        <div>
          <Row label="Adoptér"      value={a.adopter_name} />
          <Row label="Telefon"      value={a.adopter_phone} />
          <Row label="E-mail"       value={a.adopter_email} />
          <Row label="Datum adopce" value={fmt(a.adopted_at ?? a.exit_date)} />
          <Row label="Č. smlouvy"   value={a.adoption_contract_num} />
        </div>
      )}

      {exitType === 'transferred' && (
        <div>
          <Row label="Přemístěno do"  value={a.transfer_institution} />
          <Row label="Datum"          value={fmt(a.transfer_date)} />
          <Row label="Č. dokumentu"   value={a.transfer_doc_number} />
        </div>
      )}

      {exitType === 'deceased' && (
        <div>
          <Row label="Datum"    value={fmt(a.death_date)} />
          <Row label="Příčina"  value={a.death_cause} />
          <Row label="Typ"      value={a.death_type === 'euthanasia' ? 'Eutanazie' : a.death_type === 'natural' ? 'Přirozená smrt' : String(a.death_type ?? '—')} />
          <Row label="Veterinář" value={a.death_vet} />
        </div>
      )}

      <ul className="space-y-0.5">
        <CheckItem done={Boolean(a.exit_type)}                               label="Způsob odchodu zaznamenán" />
        <CheckItem done={Boolean(a.exit_date)}                               label="Datum odchodu" />
        <CheckItem done={exitType !== 'adopted' || Boolean(a.adopter_name)}  label="Údaje adoptéra" />
        <CheckItem done={exitType !== 'adopted' || Boolean(a.adoption_contract_num)} label="Číslo adopční smlouvy" />
      </ul>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AnimalWorkflowDashboard({ animal: a, institution, medicalRecords }: Props) {
  const id           = String(a.id ?? '')
  const name         = String(a.name ?? 'Zvíře')
  const status       = String(a.adoption_status ?? 'intake')

  // Karanténa jako odvozený zobrazovací stav
  const qEnd = a.quarantine_end ? new Date(String(a.quarantine_end)) : null
  const isInQuarantine = Boolean(a.quarantine_start) && qEnd != null && qEnd > new Date()
  const displayStatus = isInQuarantine ? 'quarantine' : status
  const statusBadge   = STATUS_BADGE[displayStatus] ?? STATUS_BADGE.intake
  const daysInShelter = daysFrom(a.intake_date)
  const currentPhase = detectPhase(a)
  const curIdx       = phaseIndex(currentPhase)

  // Varování o dlouhém pobytu
  const showLongStay = daysInShelter > 60 && !['adopted', 'deceased', 'transferred'].includes(status) && !a.exit_type

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FFFCF8' }}>

      {/* ── Header ── */}
      <div className="bg-white border-b px-5 py-4" style={{ borderColor: '#F0EDE8' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <a href="/admin/animals" className="inline-flex items-center gap-1 text-xs font-semibold mb-2 no-underline hover:opacity-70 transition-opacity" style={{ color: '#8B6550' }}>
              ← Všechna zvířata
            </a>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black" style={{ color: '#2C1810' }}>{name}</h1>
              <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: statusBadge.bg, color: statusBadge.text }}>
                {statusBadge.label}
              </span>
              {Boolean(a.urgent) && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#FDEAE6', color: '#E8634A' }}>🆘 Urgentní</span>}
              {Boolean(a.evidence_number) && <span className="font-mono text-xs" style={{ color: '#A09080' }}>#{String(a.evidence_number)}</span>}
            </div>
            <p className="text-xs mt-1" style={{ color: '#8B6550' }}>
              {institution.name} · {daysInShelter} dní v útulku
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/admin/animals/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 no-underline transition-colors hover:border-[#E8634A] hover:text-[#E8634A]"
              style={{ borderColor: '#F0EDE8', color: '#6B4030' }}>
              ✏️ Upravit
            </a>
            <a href={`/admin/animals/${id}/pdf`} target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold no-underline text-white hover:opacity-90"
              style={{ background: '#2C1810' }}>
              📄 PDF
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">

        {/* ── Průběh pobytu stepper ── */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #F0EDE8' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#8B6550' }}>Průběh pobytu</p>
          <div className="flex items-start">
            {PHASES.map((phase, idx) => {
              const isCompleted = idx < curIdx
              const isCurrent   = idx === curIdx
              const isFuture    = idx > curIdx
              return (
                <React.Fragment key={phase.key}>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ minWidth: 56 }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all"
                      style={{
                        background:   isCompleted ? '#EAF3DE' : isCurrent ? '#E8634A' : '#F5F2EE',
                        borderColor:  isCompleted ? '#2D8A4E' : isCurrent ? '#E8634A' : '#D5CFC8',
                        color:        isCompleted ? '#2D8A4E' : isCurrent ? 'white' : '#A09080',
                      }}>
                      {isCompleted ? '✓' : phase.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-center leading-tight" style={{
                      color: isCompleted ? '#2D8A4E' : isCurrent ? '#E8634A' : '#A09080', maxWidth: 52,
                    }}>
                      {phase.label}
                    </span>
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className="flex-1 h-0.5 mt-5 mx-1 rounded-full"
                      style={{ background: idx < curIdx ? '#2D8A4E' : '#E5DFD8' }} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Dlouhý pobyt varování ── */}
        {showLongStay && (
          <AlertBox type="warn">
            <span>⏰</span>
            <span><strong>{name}</strong> je v útulku již <strong>{daysInShelter} dní</strong>. Zvažte urgentní adopci nebo přemístění.</span>
          </AlertBox>
        )}

        {/* Varování o nekonzistentním stavu */}
        {status === 'available' && currentPhase !== 'kadopci' && (
          <AlertBox type="error">
            <span>🚫</span>
            <span>
              <strong>Nekonzistentní stav:</strong> Zvíře má status „K adopci" ale aktuální fáze to neumožňuje ({PHASES[curIdx]?.label}).{' '}
              <a href={`/admin/animals/${id}/edit`} style={{ color: 'inherit', fontWeight: 800 }}>Opravit stav →</a>
            </span>
          </AlertBox>
        )}

        {/* Blokátory adopce */}
        {currentPhase !== 'odchod' && (
          (() => {
            const qEnd2 = a.quarantine_end ? new Date(String(a.quarantine_end)) : null
            const isQuarantine = Boolean(a.quarantine_start) && qEnd2 != null && qEnd2 > new Date()
            const isProtected = ['found', 'municipal_capture'].includes(String(a.origin ?? '')) && a.intake_date &&
              new Date(addMonths(String(a.intake_date), 4)) > new Date()
            const hasReason = Boolean((a as any).not_for_adoption_reason)

            const blockers = [
              isQuarantine && { icon: '🔒', label: 'Karanténa', desc: 'Adopce možná až po ukončení karantény', temp: true },
              isProtected  && { icon: '⏳', label: 'Ochranná lhůta', desc: 'Právní 4měsíční lhůta dle § 1059 OZ', temp: true },
              status === 'not_for_adoption' && !hasReason && { icon: '🚫', label: 'Nevhodný k adopci', desc: 'Důvod není specifikován — doplňte v editaci', temp: false },
              status === 'not_for_adoption' && hasReason && { icon: '🚫', label: 'Nevhodný k adopci', desc: String((a as any).not_for_adoption_reason), temp: false },
            ].filter(Boolean) as Array<{ icon: string; label: string; desc: string; temp: boolean }>

            if (!blockers.length) return null
            return (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: '#FFF5F2', border: '1px solid #F5C4B3' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#993C1D' }}>🚫 Blokátory adopce</p>
                {blockers.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: '#F5D0C0' }}>
                    <span className="text-lg flex-shrink-0">{b.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: '#993C1D' }}>{b.label}</div>
                      <div className="text-xs" style={{ color: '#C06040' }}>{b.desc}</div>
                    </div>
                    {b.temp && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#FFF3D6', color: '#7a5800' }}>dočasná</span>}
                    {!b.temp && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#FCEBEB', color: '#D83030' }}>trvalá</span>}
                  </div>
                ))}
              </div>
            )
          })()
        )}

        {/* ── Hlavní obsah 2 sloupce ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Aktuální fáze — panel */}
          <div className="lg:col-span-2">
            <SectionCard
              icon={PHASES[curIdx]?.icon}
              title={`Aktuální fáze: ${PHASES[curIdx]?.label ?? ''}`}>
              {currentPhase === 'prijem'    && <PhasePrijem    a={a} id={id} />}
              {currentPhase === 'karantena' && <PhaseKarantena a={a} id={id} medRecords={medicalRecords} />}
              {currentPhase === 'ochrana'   && <PhaseOchrana   a={a} id={id} />}
              {currentPhase === 'kadopci'   && <PhaseKAdopci   a={a} />}
              {currentPhase === 'odchod'    && <PhaseOdchod    a={a} />}
            </SectionCard>
          </div>

          {/* Sidebar — základní info */}
          <div className="space-y-4">
            <SectionCard title="Pobyt v útulku" icon="📋">
              <Row label="Evidenční č."  value={a.evidence_number ? <span className="font-mono font-bold" style={{ color: '#E8634A' }}>#{String(a.evidence_number)}</span> : '—'} />
              <Row label="Příjem"        value={fmt(a.intake_date)} />
              <Row label="Způsob"        value={ORIGIN_LABELS[String(a.origin ?? '')] ?? '—'} />
              <Row label="Dní v útulku"  value={<span style={{ color: daysInShelter > 60 ? '#E8634A' : '#2C1810', fontWeight: 'bold' }}>{daysInShelter}</span>} />
              <Row label="Zveřejněno"    value={a.published ? <Badge bg="#EAF3DE" color="#2D8A4E">Ano</Badge> : <Badge bg="#F0EDE8" color="#8B6550">Ne</Badge>} />
            </SectionCard>

            <SectionCard title="Zdraví" icon="💊">
              <Row label="Zdravotní stav" value={
                a.health_status === 'healthy'    ? '✅ Zdravý'           :
                a.health_status === 'sick'       ? '🤒 Nemocný'          :
                a.health_status === 'injured'    ? '🩹 Zraněný'          :
                a.health_status === 'recovering' ? '🔄 Rekonvalescence'  :
                a.health_status === 'chronic'    ? '💊 Chronické'        : '—'
              } />
              <Row label="Očkovaný"   value={a.vaccinated  ? '✅ Ano' : '❌ Ne'} />
              <Row label="Kastrovaný" value={a.neutered    ? '✅ Ano' : '❌ Ne'} />
              <Row label="Čipovaný"   value={a.microchipped ? `✅ ${String(a.chip_number ?? '')}` : '❌ Ne'} />
              {Boolean(a.special_needs) && <Row label="Spec. potřeby" value={<span style={{ color: '#D83030' }}>{String(a.special_needs)}</span>} />}
            </SectionCard>

            {/* Rychlé akce */}
            <SectionCard title="Akce" icon="⚡">
              <div className="space-y-2">
                <a href={`/admin/animals/${id}/edit`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold no-underline border-2 transition-all hover:border-[#E8634A] hover:text-[#E8634A]"
                  style={{ borderColor: '#F0EDE8', color: '#6B4030' }}>
                  ✏️ Upravit profil
                </a>
                <a href={`/admin/animals/${id}/pdf`} target="_blank"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold no-underline border-2 transition-all hover:border-[#E8634A] hover:text-[#E8634A]"
                  style={{ borderColor: '#F0EDE8', color: '#6B4030' }}>
                  📄 PDF karta
                </a>
                <a href={`/admin/animals/${id}/qr`} target="_blank"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold no-underline border-2 transition-all hover:border-[#E8634A] hover:text-[#E8634A]"
                  style={{ borderColor: '#F0EDE8', color: '#6B4030' }}>
                  ▣ QR karta
                </a>
                <a href={`/admin/animals/${id}/pdf/records`} target="_blank"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold no-underline border-2 transition-all hover:border-[#E8634A] hover:text-[#E8634A]"
                  style={{ borderColor: '#F0EDE8', color: '#6B4030' }}>
                  📋 Zákonná evidence
                </a>
                {currentPhase !== 'odchod' && (
                  <a href={`/admin/animals/${id}/edit?tab=adopce`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold no-underline text-white hover:opacity-90"
                    style={{ background: '#E8634A' }}>
                    🚪 Zaznamenat odchod
                  </a>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Spodní lišta ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 border-t" style={{ background: '#2C1810', borderColor: '#3D2515' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto">
          <a href="/admin/animals"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.10)', color: '#D0C0B0' }}>
            ← Seznam
          </a>
          <div className="flex-1" />
          <a href={`/admin/animals/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.10)', color: '#D0C0B0' }}>
            ✏️ Upravit profil
          </a>
          <a href={`/admin/animals/${id}/pdf`} target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.10)', color: '#D0C0B0' }}>
            📄 PDF
          </a>
          <a href={`/admin/animals/${id}/qr`} target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.10)', color: '#D0C0B0' }}>
            ▣ QR
          </a>
          {currentPhase !== 'odchod' && (
            <a href={`/admin/animals/${id}/edit?tab=adopce`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 text-white"
              style={{ background: '#E8634A' }}>
              🚪 Odchod
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
