import React from 'react'

interface AnimalWorkflowDashboardProps {
  animal: Record<string, unknown>
  institution: { id: string; name: string; type: string }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  not_for_adoption: { bg: '#E6F1FB', text: '#185FA5', label: 'V příjmu' },
  intake:           { bg: '#E6F1FB', text: '#185FA5', label: 'V příjmu' },
  available: { bg: '#FDEAE6', text: '#E8634A', label: 'K adopci' },
  reserved: { bg: '#FFF3D6', text: '#7a5800', label: 'Rezervováno' },
  adopted: { bg: '#EAF3DE', text: '#2D8A4E', label: 'Adoptováno' },
  foster: { bg: '#E6F1FB', text: '#185FA5', label: 'Dočasná péče' },
  treatment: { bg: '#FCEBEB', text: '#D83030', label: 'V léčbě' },
  rehabilitation: { bg: '#FFF3D6', text: '#7a5800', label: 'Rehabilitace' },
  released: { bg: '#EAF3DE', text: '#2D8A4E', label: 'Vypuštěn' },
  deceased: { bg: '#F0EDE8', text: '#8B6550', label: 'Uhynul' },
}

const ORIGIN_LABELS: Record<string, string> = {
  found:             'Nalezeno — nálezcem',
  municipal_capture: 'Odchyceno obcí',
  surrendered:       'Odevzdáno majitelem',
  seized:            'Odebráno (SVS/Policie)',
  transferred:       'Přemístěno z jiného útulku',
  other:             'Jiné',
}

type PhaseKey = 'prijem' | 'identifikace' | 'karantena' | 'zdravi' | 'kadopci' | 'odchod'

interface Phase {
  key: PhaseKey
  label: string
  icon: string
  shortLabel: string
}

const PHASES: Phase[] = [
  { key: 'prijem', label: 'Příjem', icon: '📥', shortLabel: 'Příjem' },
  { key: 'identifikace', label: 'Identifikace', icon: '🔖', shortLabel: 'Identif.' },
  { key: 'karantena', label: 'Karanténa', icon: '🔒', shortLabel: 'Karanténa' },
  { key: 'zdravi', label: 'Zdraví', icon: '💊', shortLabel: 'Zdraví' },
  { key: 'kadopci', label: 'K adopci', icon: '🏠', shortLabel: 'K adopci' },
  { key: 'odchod', label: 'Odchod', icon: '🚪', shortLabel: 'Odchod' },
]

function isPhaseComplete(phaseKey: PhaseKey, animal: Record<string, unknown>): boolean {
  switch (phaseKey) {
    case 'prijem':
      return true
    case 'identifikace':
      return Boolean(animal.chip_number)
    case 'karantena':
      return Boolean(animal.quarantine_end) || (animal.in_quarantine === false && Boolean(animal.quarantine_start))
    case 'zdravi':
      return Boolean(animal.health_status) && animal.health_status !== 'unknown'
    case 'kadopci':
      return ['available', 'reserved', 'adopted', 'foster', 'released'].includes(String(animal.adoption_status ?? ''))
    case 'odchod':
      return Boolean(animal.exit_type)
    default:
      return false
  }
}

function getCurrentPhaseIndex(animal: Record<string, unknown>): number {
  const adoptionStatus = String(animal.adoption_status ?? 'intake')

  if (['adopted', 'deceased', 'escaped'].includes(adoptionStatus) && Boolean(animal.exit_type)) {
    return 5
  }

  // Find the last completed phase
  let lastCompleted = 0
  for (let i = 0; i < PHASES.length; i++) {
    if (isPhaseComplete(PHASES[i].key, animal)) {
      lastCompleted = i
    }
  }
  return lastCompleted
}

function formatDate(dateStr: unknown): string {
  if (!dateStr) return '—'
  const d = new Date(String(dateStr))
  if (isNaN(d.getTime())) return '—'
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

function getDaysInShelter(animal: Record<string, unknown>): number {
  if (!animal.intake_date) return 0
  return Math.floor((Date.now() - new Date(String(animal.intake_date)).getTime()) / 86400000)
}

interface ChecklistItem {
  label: string
  done: boolean
}

function getChecklist(phaseKey: PhaseKey, animal: Record<string, unknown>): ChecklistItem[] {
  switch (phaseKey) {
    case 'prijem':
      return [
        { label: 'Evidenční číslo přiděleno', done: Boolean(animal.evidence_number) },
        { label: 'Způsob příjmu zaznamenán', done: Boolean(animal.origin) },
        { label: 'Místo nálezu zaznamenáno', done: Boolean(animal.found_location) },
      ]
    case 'identifikace':
      return [
        { label: 'Čip naskenován', done: Boolean(animal.chip_number) },
        { label: 'CRZ registrace', done: Boolean(animal.crz_registered) },
        { label: 'Pas v útulku', done: Boolean(animal.passport_in_shelter) },
      ]
    case 'karantena':
      return [
        { label: 'Karanténa zahájena', done: Boolean(animal.quarantine_start) },
        { label: 'Výsledek karantény', done: Boolean(animal.quarantine_result) },
        { label: 'Veterinář karantény', done: Boolean(animal.quarantine_vet) },
      ]
    case 'zdravi':
      return [
        { label: 'Zdravotní stav hodnocen', done: Boolean(animal.health_status) },
        {
          label: 'Vakcinace zaznamenána',
          done: Array.isArray(animal.vaccination_records)
            ? (animal.vaccination_records as unknown[]).length > 0
            : Boolean(animal.vaccination_records),
        },
        {
          label: 'Antiparazitika',
          done: Array.isArray(animal.antiparasitics_data)
            ? (animal.antiparasitics_data as unknown[]).length > 0
            : Boolean(animal.antiparasitics_data),
        },
      ]
    case 'kadopci':
      return [
        { label: 'Profil zveřejněn na webu', done: animal.published === true },
        {
          label: 'Fotky nahrány',
          done: Array.isArray(animal.photos) ? (animal.photos as unknown[]).length > 0 : Boolean(animal.photos),
        },
        { label: 'Příběh vyplněn', done: Boolean(animal.story) },
      ]
    case 'odchod':
      return [
        { label: 'Způsob odchodu zaznamenán', done: Boolean(animal.exit_type) },
        { label: 'Datum odchodu', done: Boolean(animal.exit_date) },
        {
          label: 'Záznamy adoptéra',
          done: animal.exit_type === 'adopted' ? Boolean(animal.adopter_name) : true,
        },
      ]
    default:
      return []
  }
}

function getPhaseTip(phaseKey: PhaseKey): string {
  switch (phaseKey) {
    case 'prijem':
      return 'Zaznamenejte základní informace o přijatém zvířeti včetně způsobu příjmu.'
    case 'identifikace':
      return 'Naskenujte čip, zaregistrujte v CRZ a zkontrolujte pas zvířete.'
    case 'karantena':
      return 'Zvíře je v karanténě. Sledujte zdravotní stav a zaznamenávejte výsledky.'
    case 'zdravi':
      return 'Proveďte zdravotní prohlídku, vakcinaci a antiparazitní ošetření.'
    case 'kadopci':
      return 'Zveřejněte profil zvířete, nahrajte fotografie a napište příběh pro potenciální adoptéry.'
    case 'odchod':
      return 'Zaznamenejte způsob a datum odchodu zvířete z útulku.'
    default:
      return ''
  }
}

function getSexLabel(sex: unknown): string {
  if (sex === 'female' || sex === 'f') return 'Samice'
  if (sex === 'male' || sex === 'm') return 'Samec'
  return String(sex ?? '')
}

export default function AnimalWorkflowDashboard({ animal, institution }: AnimalWorkflowDashboardProps) {
  const id = String(animal.id ?? '')
  const name = String(animal.name ?? 'Zvíře')
  const adoptionStatus = String(animal.adoption_status ?? 'intake')
  const statusInfo = STATUS_COLORS[adoptionStatus] ?? STATUS_COLORS.intake
  const evidenceNumber = String(animal.evidence_number ?? '—')
  const daysInShelter = getDaysInShelter(animal)

  const currentPhaseIndex = getCurrentPhaseIndex(animal)
  const currentPhase = PHASES[currentPhaseIndex]

  const showWarning =
    daysInShelter > 30 && !['adopted', 'deceased', 'escaped', 'released'].includes(adoptionStatus)

  const breed = String(animal.breed ?? '')
  const sex = getSexLabel(animal.sex)
  const age = animal.age_years != null ? `~${animal.age_years} ${Number(animal.age_years) === 1 ? 'rok' : Number(animal.age_years) < 5 ? 'roky' : 'let'}` : ''
  const weight = animal.weight_kg != null ? `${animal.weight_kg} kg` : ''
  const subtitle = [breed, sex, age, weight].filter(Boolean).join(' · ')

  const checklist = getChecklist(currentPhase.key, animal)

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#FFFCF8', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#F0EDE8', backgroundColor: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: name, badge, evidence number */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold" style={{ color: '#2C1810' }}>{name}</h1>
                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                >
                  {statusInfo.label}
                </span>
                <span
                  className="text-sm font-mono"
                  style={{ color: '#8B6550' }}
                >
                  #{evidenceNumber}
                </span>
              </div>
              {subtitle && (
                <p className="text-sm" style={{ color: '#8B6550' }}>{subtitle}</p>
              )}
            </div>

            {/* Right: action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <a
                href={`/admin/animals/${id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-opacity hover:opacity-75"
                style={{ borderColor: '#E8634A', color: '#E8634A', backgroundColor: 'transparent' }}
              >
                ✏️ Upravit info
              </a>
              <a
                href={`/admin/animals/${id}?tab=adopce`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-75"
                style={{ backgroundColor: '#E8634A' }}
              >
                🚪 Zaznamenat odchod
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Průběh pobytu stepper */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#fff', border: '1px solid #F0EDE8' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#8B6550' }}>
            Průběh pobytu
          </h2>
          <div className="flex items-center">
            {PHASES.map((phase, index) => {
              const complete = isPhaseComplete(phase.key, animal)
              const isCurrent = index === currentPhaseIndex
              const isFuture = !complete && !isCurrent

              return (
                <React.Fragment key={phase.key}>
                  {/* Phase node */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all"
                      style={{
                        backgroundColor: complete
                          ? '#EAF3DE'
                          : isCurrent
                          ? '#E8634A'
                          : '#F5F5F5',
                        borderColor: complete
                          ? '#2D8A4E'
                          : isCurrent
                          ? '#E8634A'
                          : '#D0C8C0',
                        color: complete ? '#2D8A4E' : isCurrent ? '#fff' : '#A09080',
                      }}
                    >
                      {complete ? '✅' : isCurrent ? phase.icon : phase.icon}
                    </div>
                    <span
                      className="text-xs font-medium text-center"
                      style={{
                        color: complete ? '#2D8A4E' : isCurrent ? '#E8634A' : '#A09080',
                        maxWidth: '3.5rem',
                      }}
                    >
                      {phase.shortLabel}
                    </span>
                  </div>

                  {/* Connector line (not after last) */}
                  {index < PHASES.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-1"
                      style={{
                        backgroundColor:
                          isPhaseComplete(PHASES[index + 1].key, animal) || index < currentPhaseIndex
                            ? '#2D8A4E'
                            : '#E0D8D0',
                      }}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Warning banner */}
        {showWarning && (
          <div
            className="rounded-xl px-5 py-4 border-l-4"
            style={{ backgroundColor: '#FFF3D6', borderLeftColor: '#F0A500', color: '#7a5800' }}
          >
            <p className="font-semibold text-sm">
              ⚡ {name} je v útulku {daysInShelter} dní. Zvažte urgentní adopci nebo přemístění.
            </p>
          </div>
        )}

        {/* Main 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column — Aktuální fáze (3/5) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F0EDE8' }}>
              {/* Card header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: '#FFF3D6' }}
              >
                <h3 className="font-bold text-base" style={{ color: '#2C1810' }}>
                  {currentPhase.icon} Aktuální fáze: {currentPhase.label}
                </h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#E8634A', color: '#fff' }}
                >
                  {daysInShelter} dní v útulku
                </span>
              </div>

              <div className="p-5 space-y-5 bg-white">
                {/* Tip */}
                {getPhaseTip(currentPhase.key) && (
                  <p className="text-sm" style={{ color: '#8B6550' }}>
                    {getPhaseTip(currentPhase.key)}
                  </p>
                )}

                {/* Checklist */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#A09080' }}>
                    Stav této fáze
                  </p>
                  <ul className="space-y-2">
                    {checklist.map((item) => (
                      <li key={item.label} className="flex items-center gap-3">
                        <span className="text-base flex-shrink-0">
                          {item.done ? '✅' : '⚪'}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: item.done ? '#2D8A4E' : '#8B6550' }}
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Pobyt v útulku sidebar (2/5) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #F0EDE8' }}>
              <h3 className="font-bold text-base" style={{ color: '#2C1810' }}>
                Pobyt v útulku
              </h3>

              <div className="space-y-3">
                {/* Evidenční č. */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm" style={{ color: '#8B6550' }}>Evidenční č.</span>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: '#E8634A' }}
                  >
                    {evidenceNumber}
                  </span>
                </div>

                {/* Příjem */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm" style={{ color: '#8B6550' }}>Příjem</span>
                  <span className="text-sm font-medium" style={{ color: '#2C1810' }}>
                    {formatDate(animal.intake_date)}
                  </span>
                </div>

                {/* Způsob */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm" style={{ color: '#8B6550' }}>Způsob</span>
                  <span className="text-sm font-medium" style={{ color: '#2C1810' }}>
                    {ORIGIN_LABELS[String(animal.origin ?? '')] ?? String(animal.origin ?? '—')}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm" style={{ color: '#8B6550' }}>Status</span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Zveřejněno */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm" style={{ color: '#8B6550' }}>Zveřejněno</span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={
                      animal.published === true
                        ? { backgroundColor: '#EAF3DE', color: '#2D8A4E' }
                        : { backgroundColor: '#F0EDE8', color: '#8B6550' }
                    }
                  >
                    {animal.published === true ? 'Ano' : 'Ne'}
                  </span>
                </div>

                {/* Dní v útulku */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm" style={{ color: '#8B6550' }}>Dní v útulku</span>
                  <span
                    className={`text-sm font-bold ${daysInShelter > 30 ? 'text-lg' : ''}`}
                    style={{ color: daysInShelter > 30 ? '#E8634A' : '#2C1810' }}
                  >
                    {daysInShelter}
                  </span>
                </div>
              </div>

              {/* Institution */}
              <div className="pt-3 border-t" style={{ borderColor: '#F0EDE8' }}>
                <p className="text-xs" style={{ color: '#A09080' }}>
                  {institution.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom workflow bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3"
        style={{ backgroundColor: '#2C1810' }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold flex-shrink-0 mr-2" style={{ color: '#8B6550' }}>
            WORKFLOW:
          </span>

          {/* 1. Karta zvířete — active */}
          <a
            href={`/admin/animals/${id}/workflow`}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E8634A', color: '#fff' }}
          >
            1. Karta zvířete
          </a>

          {/* 2. Nové zvíře */}
          <a
            href="/admin/animals/new"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-75"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#D0C0B0' }}
          >
            + 2. Nové zvíře (wizard)
          </a>

          {/* 3. Odchod */}
          <a
            href={`/admin/animals/${id}?tab=adopce`}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-75"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#D0C0B0' }}
          >
            3. Odchod (modal)
          </a>

          {/* 4. Seznam zvířat */}
          <a
            href="/admin/animals"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-75"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#D0C0B0' }}
          >
            4. Seznam zvířat
          </a>
        </div>
      </div>
    </div>
  )
}
