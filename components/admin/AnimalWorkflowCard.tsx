import React from 'react'

/* ─── Types ─────────────────────────────────────────────── */
export interface Animal {
  id: string
  name: string
  species?: string
  breed?: string
  sex?: string
  age_years?: number | null
  weight_kg?: number | null
  adoption_status?: string
  evidence_number?: string
  intake_date?: string
  origin?: string
  published?: boolean
  published_at?: string
  chip_number?: string
  passport_number?: string
  crz_registered?: boolean
  quarantine_start?: string
  quarantine_end?: string
  in_quarantine?: boolean
  quarantine_vet?: string
  quarantine_result?: string
  health_status?: string
  good_with_kids?: boolean
  description?: string
  story?: string
  adoption_fee?: number | null
  photos?: unknown[]
  primary_photo?: string | null
  exit_type?: string
  exit_date?: string
  adopter_name?: string
  found_location?: string
  finder_name?: string
  finder_phone?: string
  institution_id?: string
  [key: string]: unknown
}

export interface Institution {
  id: string
  name: string
  type: string
}

/* ─── Constants ──────────────────────────────────────────── */
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string; dot?: string }> = {
  intake:         { bg: '#E6F1FB', text: '#185FA5', label: 'V příjmu' },
  available:      { bg: '#FDEAE6', text: '#993C1D', label: 'K adopci', dot: '●' },
  reserved:       { bg: '#FFF3D6', text: '#7a5800', label: 'Rezervováno' },
  adopted:        { bg: '#EAF3DE', text: '#1a5e2e', label: 'Adoptováno' },
  foster:         { bg: '#E6F1FB', text: '#185FA5', label: 'Dočasná péče' },
  treatment:      { bg: '#FCEBEB', text: '#D83030', label: 'V léčbě' },
  rehabilitation: { bg: '#FFF3D6', text: '#7a5800', label: 'Rehabilitace' },
  released:       { bg: '#EAF3DE', text: '#1a5e2e', label: 'Vypuštěn' },
  deceased:       { bg: '#F0EDE8', text: '#8B6550', label: 'Uhynul' },
  escaped:        { bg: '#FCEBEB', text: '#D83030', label: 'Uprchlý' },
}

const ORIGIN_LABELS: Record<string, string> = {
  found:           'Nalezeno',
  surrendered:     'Odevzdáno majitelem',
  transferred:     'Přemístěno z jiného útulku',
  born_in_shelter: 'Narozeno v útulku',
  rescue:          'Záchrana',
  confiscated:     'Konfiskace',
  other:           'Jiné',
}

const SPECIES_ICON: Record<string, string> = {
  dog:   '🐕',
  cat:   '🐈',
  bird:  '🐦',
  rabbit:'🐇',
  other: '🐾',
}

type PhaseKey = 'prijem' | 'identifikace' | 'karantena' | 'zdravi' | 'kadopci' | 'odchod'

interface Phase {
  key: PhaseKey
  label: string
  icon: string
  shortLabel: string
  activeIcon: string
}

const PHASES: Phase[] = [
  { key: 'prijem',       label: 'Příjem',       icon: '📥', shortLabel: 'Příjem',    activeIcon: '📥' },
  { key: 'identifikace', label: 'Identifikace', icon: '🔖', shortLabel: 'Identif.',  activeIcon: '🔖' },
  { key: 'karantena',    label: 'Karanténa',    icon: '🔒', shortLabel: 'Karanténa', activeIcon: '🔒' },
  { key: 'zdravi',       label: 'Zdraví',       icon: '💊', shortLabel: 'Zdraví',    activeIcon: '💊' },
  { key: 'kadopci',      label: 'K adopci',     icon: '🏠', shortLabel: 'K adopci',  activeIcon: '🏠' },
  { key: 'odchod',       label: 'Odchod',       icon: '✅', shortLabel: 'Odchod',    activeIcon: '✅' },
]

/* ─── Phase completion logic ─────────────────────────────── */
function isPhaseComplete(key: PhaseKey, a: Animal): boolean {
  switch (key) {
    case 'prijem':       return true
    case 'identifikace': return Boolean(a.chip_number)
    case 'karantena':    return Boolean(a.quarantine_end) || (a.in_quarantine === false && Boolean(a.quarantine_start))
    case 'zdravi':       return Boolean(a.health_status) && a.health_status !== 'unknown'
    case 'kadopci':      return ['available','reserved','adopted','foster','released','treatment','rehabilitation'].includes(String(a.adoption_status ?? ''))
    case 'odchod':       return Boolean(a.exit_type)
    default:             return false
  }
}

function getCurrentPhaseIndex(a: Animal): number {
  const s = String(a.adoption_status ?? 'intake')
  if (['adopted','deceased','escaped','released'].includes(s) && a.exit_type) return 5
  if (['adopted','deceased','escaped','released'].includes(s)) return 4
  if (['available','reserved','foster','treatment','rehabilitation'].includes(s)) return 4
  if (a.health_status && a.health_status !== 'unknown') return 3
  if (a.quarantine_end || (a.in_quarantine === false && a.quarantine_start)) return 2
  if (a.chip_number) return 1
  return 0
}

/* ─── Helpers ────────────────────────────────────────────── */
function formatDate(d: unknown): string {
  if (!d) return '—'
  const dt = new Date(String(d))
  if (isNaN(dt.getTime())) return '—'
  return `${dt.getDate()}. ${dt.getMonth() + 1}. ${dt.getFullYear()}`
}

function getDays(a: Animal): number {
  if (!a.intake_date) return 0
  if (a.exit_date) {
    return Math.floor((new Date(a.exit_date).getTime() - new Date(String(a.intake_date)).getTime()) / 86400000)
  }
  return Math.floor((Date.now() - new Date(String(a.intake_date)).getTime()) / 86400000)
}

function getSexLabel(sex: unknown): string {
  if (sex === 'female' || sex === 'f') return 'Samice'
  if (sex === 'male'   || sex === 'm') return 'Samec'
  return String(sex ?? '')
}

function ageLabel(a: Animal): string {
  const y = Number(a.age_years)
  if (!a.age_years && a.age_years !== 0) return ''
  return `~${y} ${y === 1 ? 'rok' : y < 5 ? 'roky' : 'let'}`
}

/* ─── Checklist for "K adopci" phase ────────────────────── */
interface ChkItem {
  label: string
  sub: string
  done: boolean
  tag: string
  tagClass: string
}

function getAdoptionChecklist(a: Animal): ChkItem[] {
  const photos = Array.isArray(a.photos) ? a.photos : []
  return [
    {
      label: 'Profil zveřejněn na webu',
      sub:   a.published && a.published_at ? `zozio.cz — aktivní od ${formatDate(a.published_at)}` : 'zozio.cz — zatím nezveřejněno',
      done:  a.published === true,
      tag: 'Hotovo', tagClass: 'bg-[#F0EDE8] text-[#6B4030]',
    },
    {
      label: `Fotky nahrány (${photos.length} ks)`,
      sub:   a.primary_photo ? 'Hlavní foto nastaveno' : 'Hlavní foto nenastaveno',
      done:  photos.length > 0,
      tag: 'Hotovo', tagClass: 'bg-[#F0EDE8] text-[#6B4030]',
    },
    {
      label: 'Povaha a kompatibilita',
      sub:   a.good_with_kids ? 'Vhodná pro rodiny s dětmi' : (a.description ? 'Popis vyplněn' : 'Nevyplněno'),
      done:  Boolean(a.good_with_kids || a.description),
      tag: 'Hotovo', tagClass: 'bg-[#F0EDE8] text-[#6B4030]',
    },
    {
      label: 'Adopční poplatek nastaven',
      sub:   a.adoption_fee != null ? `${a.adoption_fee} Kč` : 'Poplatek nenastavěn',
      done:  a.adoption_fee != null,
      tag: 'Req', tagClass: 'bg-[#FDEAE6] text-[#993C1D]',
    },
  ]
}

/* ─── Phase tip ──────────────────────────────────────────── */
function getPhaseTip(key: PhaseKey, a: Animal): string {
  switch (key) {
    case 'prijem':       return 'Zaznamenejte základní informace o přijatém zvířeti včetně způsobu příjmu a kontaktu nálezce.'
    case 'identifikace': return 'Naskenujte čip, zaregistrujte zvíře v CRZ a zkontrolujte, zda má platný cestovní pas.'
    case 'karantena':    return 'Zvíře je v karanténě. Sledujte zdravotní stav a průběžně zaznamenávejte výsledky pozorování.'
    case 'zdravi':       return 'Proveďte zdravotní prohlídku, vakcinaci a antiparazitní ošetření. Záznamy jsou zákonně povinné.'
    case 'kadopci': {
      const pubs = a.published ? 'Zvíře je zveřejněno na zozio.cz. Čeká na vhodného adoptéra.' : 'Zveřejněte profil zvířete na zozio.cz.'
      return pubs
    }
    case 'odchod':       return 'Zaznamenejte způsob a datum odchodu zvířete z útulku. Záznamy musí být uchovány min. 3 roky.'
    default:             return ''
  }
}

/* ══════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════ */
export default function AnimalWorkflowCard({ animal: a, institution }: { animal: Animal; institution: Institution }) {
  const id = a.id
  const name = a.name ?? 'Zvíře'
  const statusKey = String(a.adoption_status ?? 'intake')
  const statusInfo = STATUS_COLORS[statusKey] ?? STATUS_COLORS.available
  const evidenceNumber = String(a.evidence_number ?? '—')
  const days = getDays(a)
  const speciesIcon = SPECIES_ICON[String(a.species ?? 'dog')] ?? '🐾'

  const currentIdx = getCurrentPhaseIndex(a)
  const currentPhase = PHASES[currentIdx]

  const showWarning = days > 30 && !['adopted','deceased','escaped','released'].includes(statusKey)

  const breed   = a.breed ? String(a.breed) : ''
  const sex     = getSexLabel(a.sex)
  const age     = ageLabel(a)
  const weight  = a.weight_kg != null ? `${a.weight_kg} kg` : ''
  const subtitle = [breed, sex, age, weight].filter(Boolean).join(' · ')

  const dayBadgeVariant = days > 60 ? 'warn' : days > 30 ? 'warn' : days < 15 ? 'ok' : 'default'

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F7F4F0' }}>
      {/* ── Header ── */}
      <div className="max-w-[900px] mx-auto px-4 pt-6 pb-0">
        <div style={{ marginBottom: '20px' }}>
          <a
            href="/admin/animals"
            className="inline-block text-xs font-semibold mb-2 hover:opacity-75"
            style={{ color: '#8B6550' }}
          >
            ← Všechna zvířata
          </a>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-2xl font-black" style={{ color: '#2C1810' }}>{speciesIcon} {name}</span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black"
                  style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                >
                  {statusInfo.dot ? `${statusInfo.dot} ` : ''}{statusInfo.label}
                </span>
                <span
                  className="text-xs font-black px-2.5 py-1 rounded"
                  style={{ fontFamily: 'monospace', background: '#F0EDE8', color: '#6B4030' }}
                >
                  {evidenceNumber}
                </span>
              </div>
              {subtitle && (
                <div className="text-sm" style={{ color: '#8B6550' }}>{subtitle}</div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`/admin/animals/${id}/edit`}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border-2 hover:border-[#E8634A] transition-colors"
                style={{ border: '2px solid #F0EDE8', color: '#6B4030', background: 'white', textDecoration: 'none' }}
              >
                ✏️ Upravit info
              </a>
              <a
                href={`/admin/animals/${id}?exit=1`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-white hover:opacity-90 transition-opacity"
                style={{ background: '#E8634A', textDecoration: 'none' }}
              >
                🚪 Zaznamenat odchod
              </a>
            </div>
          </div>
        </div>

        {/* ── Pipeline card ── */}
        <div className="rounded-xl mb-3" style={{ background: 'white', border: '1px solid #F0EDE8', padding: '18px 16px' }}>
          <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#8B6550' }}>Průběh pobytu</div>
          <div className="flex items-start overflow-x-auto pb-1" style={{ gap: 0 }}>
            {PHASES.map((phase, idx) => {
              const done    = idx < currentIdx || isPhaseComplete(phase.key, a)
              const active  = idx === currentIdx
              const future  = !done && !active

              return (
                <React.Fragment key={phase.key}>
                  <div className="flex flex-col items-center flex-1 relative" style={{ minWidth: '72px' }}>
                    {/* connector line */}
                    {idx < PHASES.length - 1 && (
                      <div
                        className="absolute top-[14px] z-0"
                        style={{
                          left: 'calc(50% + 15px)',
                          width: 'calc(100% - 30px)',
                          height: '2px',
                          background: done ? '#2D8A4E' : '#E8E4E0',
                        }}
                      />
                    )}
                    <div
                      className="relative z-10 flex items-center justify-center rounded-full text-sm font-black"
                      style={{
                        width: '30px', height: '30px',
                        border: `2px solid ${done ? '#2D8A4E' : active ? '#E8634A' : '#D5CFC8'}`,
                        background: done ? '#2D8A4E' : active ? '#E8634A' : 'white',
                        color: done ? 'white' : active ? 'white' : '#C0B8B0',
                        boxShadow: active ? '0 0 0 4px rgba(232,99,74,.2)' : undefined,
                      }}
                    >
                      {done ? '✓' : active ? phase.activeIcon : phase.icon}
                    </div>
                    <div
                      className="text-center font-black mt-1"
                      style={{
                        fontSize: '10px',
                        color: done ? '#2D8A4E' : active ? '#E8634A' : '#B0A8A0',
                        lineHeight: 1.2,
                      }}
                    >
                      {active ? `${phase.icon} ` : ''}{phase.shortLabel}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>

          {showWarning && (
            <div
              className="flex items-center gap-2 rounded-lg text-xs font-black mt-3"
              style={{ padding: '12px 14px', background: '#FFF3D6', borderLeft: '3px solid #f0a500', color: '#7a5800' }}
            >
              <span>⏰</span>
              <span>{name} je v útulku <strong>{days} dní</strong>. Zvažte urgentní adopci nebo přemístění.</span>
            </div>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>

          {/* ── Left column ── */}
          <div>
            {/* Stage panel */}
            <div className="rounded-xl overflow-hidden mb-3" style={{ border: '2px solid #E8634A' }}>
              <div className="flex items-center justify-between gap-3" style={{ background: '#E8634A', padding: '14px 18px' }}>
                <h2 className="font-black text-white" style={{ fontSize: '15px' }}>
                  {currentPhase.icon} Aktuální fáze: {currentPhase.label}
                </h2>
                <span className="text-xs font-black text-white rounded-full" style={{ padding: '3px 10px', background: 'rgba(255,255,255,.25)' }}>
                  {days} dní v útulku
                </span>
              </div>
              <div className="bg-white" style={{ padding: '18px' }}>
                {/* Tip */}
                <div className="flex gap-2 rounded-lg text-xs font-semibold mb-3" style={{ padding: '12px 14px', background: '#FFF3D6', borderLeft: '3px solid #f0a500', color: '#7a5800' }}>
                  <i style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>💡</i>
                  <span>{getPhaseTip(currentPhase.key, a)}</span>
                </div>

                {/* Checklist */}
                <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.05em' }}>
                  Stav této fáze
                </div>

                {currentPhase.key === 'kadopci' ? (
                  <div className="flex flex-col gap-2 mb-4">
                    {getAdoptionChecklist(a).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-lg"
                        style={{
                          padding: '10px 12px',
                          border: `2px solid ${item.done ? '#2D8A4E' : '#F0EDE8'}`,
                          background: item.done ? '#F5FBF0' : 'white',
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-full flex-shrink-0 font-black"
                          style={{
                            width: '22px', height: '22px', fontSize: '10px',
                            border: `2px solid ${item.done ? '#2D8A4E' : '#E8634A'}`,
                            background: item.done ? '#2D8A4E' : 'transparent',
                            color: item.done ? 'white' : '#E8634A',
                          }}
                        >
                          {item.done ? '✓' : '!'}
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-sm" style={{ color: item.done ? '#2D8A4E' : '#2C1810' }}>{item.label}</div>
                          <div className="text-xs" style={{ color: '#8B6550' }}>{item.sub}</div>
                        </div>
                        <span className="rounded text-xs font-black flex-shrink-0" style={{ fontSize: '9px', padding: '1px 6px', background: item.done ? '#F0EDE8' : '#FDEAE6', color: item.done ? '#6B4030' : '#993C1D' }}>
                          {item.done ? 'Hotovo' : item.tag === 'Req' ? 'Req' : 'Zákon'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-4">
                    {getGenericChecklist(currentPhase.key, a).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-lg"
                        style={{
                          padding: '10px 12px',
                          border: `2px solid ${item.done ? '#2D8A4E' : '#F0EDE8'}`,
                          background: item.done ? '#F5FBF0' : 'white',
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-full flex-shrink-0 font-black"
                          style={{
                            width: '22px', height: '22px', fontSize: '10px',
                            border: `2px solid ${item.done ? '#2D8A4E' : '#D5CFC8'}`,
                            background: item.done ? '#2D8A4E' : 'transparent',
                            color: item.done ? 'white' : '#B0A8A0',
                          }}
                        >
                          {item.done ? '✓' : ''}
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-sm" style={{ color: item.done ? '#2D8A4E' : '#2C1810' }}>{item.label}</div>
                          {item.sub && <div className="text-xs" style={{ color: '#8B6550' }}>{item.sub}</div>}
                        </div>
                        <span className="rounded font-black flex-shrink-0" style={{ fontSize: '9px', padding: '1px 6px', background: item.lawTag ? '#E6F1FB' : '#F0EDE8', color: item.lawTag ? '#185FA5' : '#6B4030' }}>
                          {item.lawTag ? 'Zákon' : 'Hotovo'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.05em' }}>
                  Přejít do další fáze
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/admin/animals/${id}?exit=1&type=adopted`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-white hover:opacity-90 transition-opacity"
                    style={{ background: '#2D8A4E', textDecoration: 'none' }}
                  >
                    ✅ Zaznamenat adopci
                  </a>
                  <button
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black hover:border-[#E8634A] transition-colors"
                    style={{ background: 'white', border: '2px solid #F0EDE8', color: '#6B4030' }}
                  >
                    📌 Označit rezervováno
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black hover:border-[#E8634A] transition-colors"
                    style={{ fontSize: '12px', background: 'white', border: '2px solid #F0EDE8', color: '#6B4030' }}
                  >
                    💊 Přesunout do léčby
                  </button>
                  <button
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black hover:border-red-300 transition-colors"
                    style={{ fontSize: '12px', background: 'white', border: '2px solid #FCEBEB', color: '#D83030' }}
                  >
                    🕊️ Zaznamenat úhyn
                  </button>
                </div>
              </div>
            </div>

            {/* Previous phases accordion */}
            <PreviousPhases animal={a} currentIdx={currentIdx} />
          </div>

          {/* ── Sidebar ── */}
          <div>
            {/* Pobyt v útulku */}
            <div className="rounded-xl mb-3" style={{ background: 'white', border: '1px solid #F0EDE8', padding: '16px' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>Pobyt v útulku</h3>
              <div className="flex justify-center mb-3">
                <DayBadge days={days} variant={dayBadgeVariant} />
              </div>
              <InfoRow label="Evidenční č." value={<span style={{ fontFamily: 'monospace' }}>{evidenceNumber}</span>} />
              <InfoRow label="Příjem" value={formatDate(a.intake_date)} />
              <InfoRow label="Způsob" value={ORIGIN_LABELS[String(a.origin ?? '')] ?? String(a.origin ?? '—')} />
              <InfoRow label="Status" value={
                <span className="inline-flex items-center rounded-full text-xs font-black px-2 py-0.5" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                  {statusInfo.label}
                </span>
              } />
              <InfoRow label="Zveřejněno" value={
                <span className="inline-flex items-center rounded-full text-xs font-black px-2 py-0.5" style={a.published ? { background: '#EAF3DE', color: '#1a5e2e' } : { background: '#F0EDE8', color: '#6B4030' }}>
                  {a.published ? 'Ano' : 'Ne'}
                </span>
              } />
            </div>

            {/* Identifikace */}
            <div className="rounded-xl mb-3" style={{ background: 'white', border: '1px solid #F0EDE8', padding: '16px' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>Identifikace</h3>
              <InfoRow label="Čip" value={<span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{a.chip_number ?? '—'}</span>} />
              <InfoRow label="Pas č." value={String(a.passport_number ?? '—')} />
              <InfoRow label="CRZ" value={
                a.crz_registered
                  ? <span className="inline-flex items-center rounded-full text-xs font-black px-2 py-0.5" style={{ background: '#EAF3DE', color: '#1a5e2e' }}>✓ Reg.</span>
                  : <span className="inline-flex items-center rounded-full text-xs font-black px-2 py-0.5" style={{ background: '#F0EDE8', color: '#8B6550' }}>Neregistr.</span>
              } />
            </div>

            {/* Historie */}
            <div className="rounded-xl" style={{ background: 'white', border: '1px solid #F0EDE8', padding: '16px' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#8B6550', letterSpacing: '.06em' }}>Historie</h3>
              <div className="relative">
                <div className="absolute" style={{ left: '11px', top: '6px', bottom: '6px', width: '2px', background: '#F0EDE8' }} />
                <HistoryItem status={statusInfo.label} date={formatDate(a.intake_date)} isCurrent={true} />
                {a.quarantine_start && (
                  <HistoryItem status="Karanténa" date={formatDate(a.quarantine_start)} isCurrent={false} />
                )}
                <HistoryItem status="V příjmu" date={formatDate(a.intake_date)} isCurrent={false} />
              </div>
            </div>

            {/* Institution */}
            <div className="mt-2 text-xs text-center" style={{ color: '#A09890' }}>{institution.name}</div>
          </div>
        </div>
      </div>

      {/* ── Bottom workflow bar ── */}
      <WorkflowBar animalId={id} active="card" />
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────── */

interface GenericCheckItem {
  label: string
  sub?: string
  done: boolean
  lawTag?: boolean
}

function getGenericChecklist(key: PhaseKey, a: Animal): GenericCheckItem[] {
  switch (key) {
    case 'prijem': return [
      { label: 'Evidenční číslo přiděleno', done: Boolean(a.evidence_number), lawTag: true },
      { label: 'Způsob příjmu zaznamenán',  done: Boolean(a.origin),           lawTag: true },
      { label: 'Místo nálezu zaznamenáno',  done: Boolean(a.found_location),   lawTag: true },
    ]
    case 'identifikace': return [
      { label: 'Čip naskenován',      done: Boolean(a.chip_number),        lawTag: true },
      { label: 'CRZ registrace',      done: Boolean(a.crz_registered),     lawTag: true },
      { label: 'Pas v útulku',        done: Boolean(a.passport_number),    lawTag: false },
    ]
    case 'karantena': return [
      { label: 'Karanténa zahájena',    done: Boolean(a.quarantine_start),  lawTag: true },
      { label: 'Výsledek karantény',    done: Boolean(a.quarantine_result), lawTag: true },
      { label: 'Veterinář karantény',   done: Boolean(a.quarantine_vet),    lawTag: true },
    ]
    case 'zdravi': return [
      { label: 'Zdravotní stav hodnocen', done: Boolean(a.health_status), lawTag: true },
      {
        label: 'Vakcinace zaznamenána',
        done: Array.isArray(a.vaccination_records)
          ? (a.vaccination_records as unknown[]).length > 0
          : Boolean(a.vaccination_records),
        lawTag: true,
      },
      {
        label: 'Antiparazitika',
        done: Array.isArray(a.antiparasitics_data)
          ? (a.antiparasitics_data as unknown[]).length > 0
          : Boolean(a.antiparasitics_data),
        lawTag: false,
      },
    ]
    default: return []
  }
}

function PreviousPhases({ animal: a, currentIdx }: { animal: Animal; currentIdx: number }) {
  if (currentIdx < 1) return null

  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.05em' }}>
        Předchozí fáze — záznamy
      </div>

      {/* Příjem */}
      {currentIdx > 0 && (
        <div className="rounded-lg mb-2" style={{ background: 'white', border: '1px solid #F0EDE8', borderLeft: '3px solid #2D8A4E', padding: '12px 14px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '18px' }}>📥</span>
              <div>
                <div className="font-black text-sm">Příjem — {a.intake_date ? formatDate(a.intake_date) : '—'}</div>
                <div className="text-xs font-black" style={{ color: '#2D8A4E' }}>✓ Kompletní záznamy</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full text-xs font-black px-2 py-0.5" style={{ background: '#EAF3DE', color: '#1a5e2e' }}>Zákon ✓</span>
            </div>
          </div>
          {a.origin && (
            <div className="mt-3 pt-3 grid grid-cols-2 gap-2 text-xs" style={{ borderTop: '1px solid #F0EDE8' }}>
              <div>
                <div className="font-black uppercase text-xs mb-1" style={{ color: '#8B6550', fontSize: '10px' }}>Způsob příjmu</div>
                <div className="font-black">{ORIGIN_LABELS[String(a.origin)] ?? String(a.origin)}</div>
              </div>
              {a.found_location && (
                <div>
                  <div className="font-black uppercase text-xs mb-1" style={{ color: '#8B6550', fontSize: '10px' }}>Místo nálezu</div>
                  <div className="font-black">{String(a.found_location)}</div>
                </div>
              )}
              {a.finder_name && (
                <div>
                  <div className="font-black uppercase text-xs mb-1" style={{ color: '#8B6550', fontSize: '10px' }}>Nálezce</div>
                  <div className="font-black">{String(a.finder_name)}</div>
                </div>
              )}
              {a.finder_phone && (
                <div>
                  <div className="font-black uppercase text-xs mb-1" style={{ color: '#8B6550', fontSize: '10px' }}>Kontakt</div>
                  <div className="font-black">{String(a.finder_phone)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Karanténa */}
      {currentIdx > 2 && (
        <div className="rounded-lg mb-2" style={{ background: 'white', border: '1px solid #F0EDE8', borderLeft: `3px solid ${a.quarantine_result ? '#2D8A4E' : '#f0a500'}`, padding: '12px 14px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '18px' }}>🔒</span>
              <div>
                <div className="font-black text-sm">
                  Karanténa{a.quarantine_start ? ` — ${formatDate(a.quarantine_start)}` : ''}
                  {a.quarantine_end ? `–${a.quarantine_end.slice(5, 7)}. ${a.quarantine_end.slice(0, 4)}` : ''}
                </div>
                <div className="text-xs font-black" style={{ color: a.quarantine_result ? '#2D8A4E' : '#f0a500' }}>
                  {a.quarantine_result
                    ? `✓ Ukončena${a.quarantine_vet ? ` · ${a.quarantine_vet}` : ''}`
                    : '⚠ Výsledek nezaznamenán'}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full text-xs font-black px-2 py-0.5" style={{ background: a.quarantine_result ? '#EAF3DE' : '#FFF3D6', color: a.quarantine_result ? '#1a5e2e' : '#7a5800' }}>
              {a.quarantine_result ? 'Zákon ✓' : 'Zákon ⚠'}
            </span>
          </div>
        </div>
      )}

      {/* Zdraví */}
      {currentIdx > 3 && (
        <div className="rounded-lg mb-2" style={{ background: 'white', border: '1px solid #F0EDE8', borderLeft: '3px solid #f0a500', padding: '12px 14px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '18px' }}>💊</span>
              <div>
                <div className="font-black text-sm">Zdravotní záznamy</div>
                <div className="text-xs font-black" style={{ color: '#f0a500' }}>⚠ Zkontrolujte platnost vakcín</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full text-xs font-black px-2 py-0.5" style={{ background: '#FFF3D6', color: '#7a5800' }}>Zákon ⚠</span>
              <a
                href={`/admin/animals/${a.id}/edit?tab=health`}
                className="text-xs font-black px-2 py-1 rounded-lg border-2 hover:border-[#E8634A] transition-colors"
                style={{ border: '2px solid #F0EDE8', color: '#6B4030', background: 'white', textDecoration: 'none' }}
              >
                Doplnit
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-xs" style={{ borderBottom: '1px solid #F7F4F0' }}>
      <span className="font-semibold" style={{ color: '#8B6550' }}>{label}</span>
      <span className="font-black" style={{ color: '#2C1810' }}>{value}</span>
    </div>
  )
}

function DayBadge({ days, variant }: { days: number; variant: 'warn' | 'ok' | 'default' }) {
  const styles =
    variant === 'warn' ? { bg: '#FCEBEB', text: '#D83030' } :
    variant === 'ok'   ? { bg: '#EAF3DE', text: '#2D8A4E' } :
                         { bg: '#FDEAE6', text: '#E8634A' }
  return (
    <div className="inline-flex flex-col items-center rounded-lg" style={{ background: styles.bg, padding: '4px 10px' }}>
      <div className="font-black leading-none" style={{ fontSize: '18px', color: styles.text }}>{days}</div>
      <div className="font-black uppercase tracking-wider" style={{ fontSize: '9px', color: styles.text, letterSpacing: '.05em' }}>dní v útulku</div>
    </div>
  )
}

function HistoryItem({ status, date, isCurrent }: { status: string; date: string; isCurrent: boolean }) {
  return (
    <div className="flex gap-3 relative mb-3" style={{ paddingLeft: '30px' }}>
      <div
        className="absolute rounded-full"
        style={{
          left: '6px', top: '3px',
          width: '12px', height: '12px',
          border: `2px solid ${isCurrent ? '#E8634A' : '#D5CFC8'}`,
          background: isCurrent ? '#E8634A' : '#2D8A4E',
          zIndex: 1,
        }}
      />
      <div>
        <div
          className="inline-block rounded text-xs font-black mb-0.5"
          style={{
            padding: '2px 7px',
            background: isCurrent ? '#FDEAE6' : '#F0EDE8',
            color: isCurrent ? '#993C1D' : '#6B4030',
          }}
        >
          {status}
        </div>
        <div className="text-xs" style={{ color: '#A09890' }}>{date}</div>
      </div>
    </div>
  )
}

export function WorkflowBar({ animalId, active }: { animalId?: string; active: 'card' | 'new' | 'exit' | 'list' }) {
  const btnBase = 'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black flex-shrink-0 transition-opacity'
  const btnActive = { background: '#E8634A', color: 'white' }
  const btnInactive = { background: 'rgba(255,255,255,.1)', color: '#D0C0B0' }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-2 px-4 py-2.5 overflow-x-auto" style={{ background: '#2C1810' }}>
      <span className="text-xs font-black flex-shrink-0 self-center mr-1" style={{ color: '#F0EDE8', opacity: .5 }}>WORKFLOW:</span>
      <a href={animalId ? `/admin/animals/${animalId}` : '#'}
         className={btnBase} style={active === 'card' ? btnActive : btnInactive}>
        📋 1. Karta zvířete
      </a>
      <a href="/admin/animals/new"
         className={btnBase} style={active === 'new' ? btnActive : btnInactive}>
        ➕ 2. Nové zvíře (wizard)
      </a>
      <a href={animalId ? `/admin/animals/${animalId}?exit=1` : '#'}
         className={btnBase} style={active === 'exit' ? btnActive : btnInactive}>
        🚪 3. Zaznamenat odchod
      </a>
      <a href="/admin/animals"
         className={btnBase} style={active === 'list' ? btnActive : btnInactive}>
        📊 4. Seznam zvířat
      </a>
    </div>
  )
}
