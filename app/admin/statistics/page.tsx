import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Statistiky — Zozio Admin' }

/* ── typy ── */
interface Animal {
  id: string
  adoption_status: string
  intake_date: string | null
  created_at: string
  species: { name_cs: string; icon: string } | null
}

interface RescueCase {
  id: string
  status: string
  intake_date: string | null
}

interface AdoptionApplication {
  id: string
  status: string
}

/* ── helpers ── */
function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function daysBetween(a: string, b: Date = new Date()): number {
  return Math.floor((b.getTime() - new Date(a).getTime()) / 86_400_000)
}

/* ── komponenty ── */
function SummaryCard({
  label,
  value,
  sub,
  color = '#E8634A',
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
      <div className="text-xs font-bold text-[#A09890] uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display font-extrabold text-3xl" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-[#A09890] mt-1 font-semibold">{sub}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display font-extrabold text-xl text-[#2C1810] mb-4">{title}</h2>
      {children}
    </div>
  )
}

const ANIMAL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available:      { label: 'K adopci',       color: '#16A34A', bg: '#F0FDF4' },
  reserved:       { label: 'Rezervováno',    color: '#CA8A04', bg: '#FEFCE8' },
  adopted:        { label: 'Adoptováno',     color: '#2563EB', bg: '#EFF6FF' },
  foster:         { label: 'Dočasná péče',   color: '#7C3AED', bg: '#F5F3FF' },
  treatment:      { label: 'V léčbě',        color: '#DC2626', bg: '#FEF2F2' },
  rehabilitation: { label: 'Rehabilitace',   color: '#EA580C', bg: '#FFF7ED' },
}

const RESCUE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  intake:         { label: 'Příjem',         color: '#CA8A04', bg: '#FEFCE8' },
  treatment:      { label: 'V léčbě',        color: '#DC2626', bg: '#FEF2F2' },
  rehabilitation: { label: 'Rehabilitace',   color: '#EA580C', bg: '#FFF7ED' },
  released:       { label: 'Propuštěno',     color: '#16A34A', bg: '#F0FDF4' },
  deceased:       { label: 'Uhynulo',        color: '#6B7280', bg: '#F9FAFB' },
}

/* ══════════════════════════════════════════════════════════════
   Stránka
══════════════════════════════════════════════════════════════ */
export default async function StatisticsPage() {
  /* ── auth ── */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, type, plan, plan_expires_at')
    .eq('id', membership.institution_id)
    .single()
  if (!institution) redirect('/admin/dashboard')

  const iid = membership.institution_id
  const isShelter = institution.type === 'shelter'

  /* ── data ── */
  const [
    { data: animals = [] },
    { data: rescueCases = [] },
    { data: applications = [] },
  ] = await Promise.all([
    service
      .from('animals')
      .select('id, adoption_status, intake_date, created_at, species:animal_species(name_cs, icon)')
      .eq('institution_id', iid),
    service
      .from('rescue_cases')
      .select('id, status, intake_date')
      .eq('institution_id', iid),
    service
      .from('adoption_applications')
      .select('id, status')
      .eq('institution_id', iid),
  ])

  const typedAnimals = ((animals ?? []) as unknown) as Animal[]
  const typedCases   = (rescueCases ?? []) as RescueCase[]
  const typedApps    = (applications ?? []) as AdoptionApplication[]

  const now = new Date()
  const cy  = now.getFullYear()
  const ly  = cy - 1

  /* ── animals stats ── */
  const totalAnimals   = typedAnimals.length
  const adoptedAnimals = typedAnimals.filter(a => a.adoption_status === 'adopted')
  const totalAdopted   = adoptedAnimals.length
  const adoptedThisYear = adoptedAnimals.filter(a => new Date(a.created_at).getFullYear() === cy).length
  const adoptedLastYear = adoptedAnimals.filter(a => new Date(a.created_at).getFullYear() === ly).length
  const adoptedYoY = adoptedLastYear > 0
    ? Math.round(((adoptedThisYear - adoptedLastYear) / adoptedLastYear) * 100)
    : null

  const inCareStatuses = ['available', 'reserved', 'foster', 'treatment', 'rehabilitation']
  const inCare = typedAnimals.filter(a => inCareStatuses.includes(a.adoption_status)).length

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  for (const a of typedAnimals) {
    statusCounts[a.adoption_status] = (statusCounts[a.adoption_status] ?? 0) + 1
  }

  // Species breakdown
  const speciesMap: Record<string, { count: number; icon: string }> = {}
  for (const a of typedAnimals) {
    const name = a.species?.name_cs ?? 'Neznámý'
    const icon = a.species?.icon ?? '🐾'
    if (!speciesMap[name]) speciesMap[name] = { count: 0, icon }
    speciesMap[name].count++
  }
  const speciesList = Object.entries(speciesMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  // Pobytové statistiky — pouze zvířata aktuálně v péči
  const staysInCare = typedAnimals
    .filter(a => a.intake_date && inCareStatuses.includes(a.adoption_status))
    .map(a => daysBetween(a.intake_date!))
  const avgStay  = staysInCare.length ? Math.round(staysInCare.reduce((s, d) => s + d, 0) / staysInCare.length) : 0
  const medStay  = median(staysInCare)
  const minStay  = staysInCare.length ? Math.min(...staysInCare) : 0
  const maxStay  = staysInCare.length ? Math.max(...staysInCare) : 0
  const over90   = staysInCare.filter(d => d >= 90).length
  const over180  = staysInCare.filter(d => d >= 180).length

  /* ── rescue cases stats ── */
  const totalCases = typedCases.length
  const caseCounts: Record<string, number> = {}
  for (const c of typedCases) {
    caseCounts[c.status] = (caseCounts[c.status] ?? 0) + 1
  }
  const activeCases    = typedCases.filter(c => ['intake', 'treatment', 'rehabilitation'].includes(c.status)).length
  const releasedCases  = caseCounts['released'] ?? 0
  const releaseRate    = totalCases > 0 ? Math.round((releasedCases / totalCases) * 100) : 0

  // Průměrná doba péče aktivních záchranných případů
  const caseStays = typedCases
    .filter(c => c.intake_date && ['intake', 'treatment', 'rehabilitation'].includes(c.status))
    .map(c => daysBetween(c.intake_date!))
  const avgCaseStay = caseStays.length ? Math.round(caseStays.reduce((s, d) => s + d, 0) / caseStays.length) : 0

  /* ── applications — jen čekající ── */
  const appCounts: Record<string, number> = {}
  for (const a of typedApps) {
    appCounts[a.status] = (appCounts[a.status] ?? 0) + 1
  }
  const pendingApps = (appCounts['pending'] ?? 0) + (appCounts['reviewing'] ?? 0) + (appCounts['meeting_scheduled'] ?? 0)

  /* ══ RENDER ══ */
  return (
    <div className="space-y-10">

      {/* Nadpis */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#2C1810]">📊 Statistiky</h1>
          <p className="text-sm text-[#8B6550] mt-1 font-semibold">{institution.name} · aktuální stav</p>
        </div>
        <Link
          href="/admin/reports"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold no-underline transition-opacity hover:opacity-80 mt-1"
          style={{ background: '#F5E6D3', color: '#8B6550' }}
        >
          📋 Historické reporty →
        </Link>
      </div>

      {/* ─── SOUHRNNÉ KARTY ─── */}
      <Section title="Přehled">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isShelter ? (
            <>
              <SummaryCard label="Celkem zvířat"    value={totalAnimals}   color="#2C1810" />
              <SummaryCard label="Aktuálně v péči"  value={inCare}         color="#E8634A" />
              <SummaryCard label="Adoptováno celkem" value={totalAdopted}  color="#2563EB" />
              <SummaryCard
                label={`Adoptováno ${cy}`}
                value={adoptedThisYear}
                color="#16A34A"
                sub={adoptedYoY !== null
                  ? `${adoptedYoY >= 0 ? '+' : ''}${adoptedYoY} % vs. ${ly}`
                  : undefined}
              />
            </>
          ) : (
            <>
              <SummaryCard label="Celkem případů"   value={totalCases}    color="#2C1810" />
              <SummaryCard label="Aktivní případy"  value={activeCases}   color="#E8634A" />
              <SummaryCard label="Propuštěno"        value={releasedCases} color="#16A34A" />
              <SummaryCard label="Míra propuštění"   value={`${releaseRate} %`} color="#7C3AED" />
            </>
          )}
        </div>
      </Section>

      {/* ─── STATUS BREAKDOWN ─── */}
      {isShelter ? (
        <Section title="Zvířata dle statusu">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(ANIMAL_STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="rounded-lg p-4 border border-[#F0EDE8]"
                style={{ background: cfg.bg }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: cfg.color }}>{cfg.label}</div>
                <div className="font-display font-extrabold text-3xl" style={{ color: cfg.color }}>
                  {statusCounts[key] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section title="Případy dle statusu">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(RESCUE_STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="rounded-lg p-4 border border-[#F0EDE8]"
                style={{ background: cfg.bg }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: cfg.color }}>{cfg.label}</div>
                <div className="font-display font-extrabold text-3xl" style={{ color: cfg.color }}>
                  {caseCounts[key] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── DRUHY ZVÍŘAT (pouze útulek) ─── */}
      {isShelter && speciesList.length > 0 && (
        <Section title="Druhy zvířat">
          <div className="bg-white rounded-lg border border-[#F0EDE8] shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#F0EDE8]">
              {speciesList.map(([name, { count, icon }]) => (
                <div key={name} className="bg-white p-4">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="font-display font-extrabold text-2xl text-[#2C1810]">{count}</div>
                  <div className="text-xs font-semibold text-[#A09890] mt-0.5">{name}</div>
                  <div className="text-xs text-[#A09890]">
                    {totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0} %
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ─── POBYTOVÉ STATISTIKY ─── */}
      <Section title={isShelter ? 'Pobyt v útulku' : 'Délka péče'}>
        {isShelter ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Průměr (dny)"  value={avgStay} color="#E8634A" />
              <SummaryCard label="Medián (dny)"  value={medStay} color="#2C1810" />
              <SummaryCard label="Nejkratší"     value={minStay} color="#16A34A" sub="dní" />
              <SummaryCard label="Nejdelší"      value={maxStay} color="#DC2626" sub="dní" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
                <div className="text-xs font-bold text-[#A09890] uppercase tracking-wider mb-1">90+ dní</div>
                <div className="font-display font-extrabold text-3xl text-[#DC2626]">{over90}</div>
                <div className="text-xs text-[#A09890] mt-1">zvířat čeká déle než 3 měsíce</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
                <div className="text-xs font-bold text-[#A09890] uppercase tracking-wider mb-1">180+ dní</div>
                <div className="font-display font-extrabold text-3xl text-[#991B1B]">{over180}</div>
                <div className="text-xs text-[#A09890] mt-1">zvířat čeká déle než 6 měsíců</div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard label="Průměrná doba péče" value={avgStay}     color="#E8634A" sub="dní (všichni)" />
            <SummaryCard label="Průměr aktivních"   value={avgCaseStay} color="#2C1810" sub="dní" />
          </div>
        )}
      </Section>

      {/* ─── ŽÁDOSTI O ADOPCI (přehledová karta) ─── */}
      {isShelter && (
        <Section title="Žádosti o adopci">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard label="Celkem žádostí"    value={typedApps.length}   color="#2C1810" />
            <SummaryCard label="Čeká na vyřízení"  value={pendingApps}        color="#CA8A04"
              sub="pending + posuzování + schůzka" />
            <SummaryCard label="Úspěšně adoptováno" value={appCounts['adopted'] ?? 0} color="#2563EB" />
          </div>
          {pendingApps > 0 && (
            <div className="mt-3">
              <Link
                href="/admin/applications"
                className="inline-flex items-center gap-1.5 text-sm font-bold no-underline transition-colors"
                style={{ color: '#E8634A' }}
              >
                Zobrazit čekající žádosti ({pendingApps}) →
              </Link>
            </div>
          )}
        </Section>
      )}

      {/* ─── ODKAZ NA REPORTY ─── */}
      <div
        className="rounded-2xl border border-[#F0EDE8] p-5 flex flex-col sm:flex-row items-center gap-4"
        style={{ background: '#FFFCF8' }}
      >
        <div className="text-3xl flex-shrink-0">📋</div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-extrabold text-base text-[#2C1810] mb-0.5">
            Historická analýza v Pokročilých reportech
          </div>
          <p className="text-xs text-[#8B6550] font-semibold">
            Adopční trychtýř, měsíční trendy, long-stay žebříček, sbírky a dobrovolníci — vše přehledně za zvolené období.
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-full font-bold text-sm text-white no-underline transition-opacity hover:opacity-90"
          style={{ background: '#E8634A' }}
        >
          Otevřít reporty
        </Link>
      </div>

    </div>
  )
}
