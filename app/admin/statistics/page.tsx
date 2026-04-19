import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { hasFeature } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

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
  created_at: string
}

interface AdoptionApplication {
  id: string
  status: string
  created_at: string
  updated_at: string
}

interface Volunteer {
  id: string
  status: string
  created_at: string
}

interface Fundraiser {
  id: string
  title: string
  goal_amount: number
  current_amount: number
  active: boolean
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

function thisYear(): number { return new Date().getFullYear() }
function lastYear(): number { return thisYear() - 1 }

function countByMonth(
  items: { created_at: string }[],
  year: number,
): number[] {
  const counts = Array(12).fill(0) as number[]
  for (const item of items) {
    const d = new Date(item.created_at)
    if (d.getFullYear() === year) counts[d.getMonth()]++
  }
  return counts
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

const MONTH_LABELS = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

const ANIMAL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available:      { label: 'K adopci',       color: '#16A34A', bg: '#F0FDF4' },
  reserved:       { label: 'Rezervováno',    color: '#CA8A04', bg: '#FEFCE8' },
  adopted:        { label: 'Adoptováno',     color: '#2563EB', bg: '#EFF6FF' },
  foster:         { label: 'Dočasná péče', color: '#7C3AED', bg: '#F5F3FF' },
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

const APP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:           { label: 'Čeká',                color: '#CA8A04' },
  reviewing:         { label: 'Posuzování',           color: '#2563EB' },
  meeting_scheduled: { label: 'Schůzka',             color: '#7C3AED' },
  adopted:           { label: 'Adoptováno',           color: '#16A34A' },
  rejected:          { label: 'Zamítnuto',            color: '#DC2626' },
  cancelled:         { label: 'Zrušeno',              color: '#6B7280' },
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

  const hasAdvancedStats = hasFeature(
    (institution as any).plan as SubscriptionPlan ?? 'free',
    (institution as any).plan_expires_at ?? null,
    'advanced_stats'
  )

  /* ── data ── */
  const [
    { data: animals = [] },
    { data: rescueCases = [] },
    { data: applications = [] },
    { data: volunteers = [] },
    { data: fundraisers = [] },
  ] = await Promise.all([
    service
      .from('animals')
      .select('id, adoption_status, intake_date, created_at, species:animal_species(name_cs, icon)')
      .eq('institution_id', iid),
    service
      .from('rescue_cases')
      .select('id, status, intake_date, created_at')
      .eq('institution_id', iid),
    service
      .from('adoption_applications')
      .select('id, status, created_at, updated_at')
      .eq('institution_id', iid),
    service
      .from('volunteers')
      .select('id, status, created_at')
      .eq('institution_id', iid),
    service
      .from('fundraisers')
      .select('id, title, goal_amount, current_amount, active')
      .eq('institution_id', iid),
  ])

  const typedAnimals = ((animals ?? []) as unknown) as Animal[]
  const typedCases   = (rescueCases ?? []) as RescueCase[]
  const typedApps    = (applications ?? []) as AdoptionApplication[]
  const typedVolunteers = (volunteers ?? []) as Volunteer[]
  const typedFundraisers = (fundraisers ?? []) as Fundraiser[]

  const now = new Date()
  const cy = thisYear()
  const ly = lastYear()

  /* ── animals stats ── */
  const totalAnimals = typedAnimals.length
  const adoptedAnimals = typedAnimals.filter(a => a.adoption_status === 'adopted')
  const totalAdopted = adoptedAnimals.length
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

  // Pobytové statistiky (pouze zvířata s intake_date)
  const staysInCare = typedAnimals
    .filter(a => a.intake_date && inCareStatuses.includes(a.adoption_status))
    .map(a => daysBetween(a.intake_date!))
  const avgStay  = staysInCare.length ? Math.round(staysInCare.reduce((s, d) => s + d, 0) / staysInCare.length) : 0
  const medStay  = median(staysInCare)
  const minStay  = staysInCare.length ? Math.min(...staysInCare) : 0
  const maxStay  = staysInCare.length ? Math.max(...staysInCare) : 0
  const over90   = staysInCare.filter(d => d >= 90).length
  const over180  = staysInCare.filter(d => d >= 180).length

  // Adopce po měsících
  const adoptThisYear = countByMonth(adoptedAnimals, cy)
  const adoptLastYear = countByMonth(adoptedAnimals, ly)

  /* ── rescue cases stats ── */
  const totalCases = typedCases.length
  const caseCounts: Record<string, number> = {}
  for (const c of typedCases) {
    caseCounts[c.status] = (caseCounts[c.status] ?? 0) + 1
  }
  const activeCases = typedCases.filter(c =>
    ['intake', 'treatment', 'rehabilitation'].includes(c.status)
  ).length
  const releasedCases = caseCounts['released'] ?? 0
  const deceasedCases = caseCounts['deceased'] ?? 0
  const releaseRate = totalCases > 0
    ? Math.round((releasedCases / totalCases) * 100)
    : 0

  // Pobyt záchranných případů
  const caseStays = typedCases
    .filter(c => c.intake_date && ['intake', 'treatment', 'rehabilitation'].includes(c.status))
    .map(c => daysBetween(c.intake_date!))
  const avgCaseStay = caseStays.length ? Math.round(caseStays.reduce((s, d) => s + d, 0) / caseStays.length) : 0

  /* ── applications stats ── */
  const totalApps = typedApps.length
  const appCounts: Record<string, number> = {}
  for (const a of typedApps) {
    appCounts[a.status] = (appCounts[a.status] ?? 0) + 1
  }
  const adoptedApps = appCounts['adopted'] ?? 0
  const conversionRate = totalApps > 0 ? Math.round((adoptedApps / totalApps) * 100) : 0

  /* ── volunteers stats ── */
  const totalVol = typedVolunteers.length
  const activeVol  = typedVolunteers.filter(v => v.status === 'active').length
  const pendingVol = typedVolunteers.filter(v => v.status === 'pending').length
  const rejectedVol = typedVolunteers.filter(v => v.status === 'rejected').length

  /* ── fundraisers stats ── */
  const activeFundraisers = typedFundraisers.filter(f => f.active)
  const totalGoal    = activeFundraisers.reduce((s, f) => s + (f.goal_amount ?? 0), 0)
  const totalRaised  = activeFundraisers.reduce((s, f) => s + (f.current_amount ?? 0), 0)
  const avgCompletion = activeFundraisers.length > 0
    ? Math.round(activeFundraisers.reduce((s, f) => {
        const pct = f.goal_amount > 0 ? (f.current_amount / f.goal_amount) * 100 : 0
        return s + pct
      }, 0) / activeFundraisers.length)
    : 0

  /* ══ RENDER ══ */
  return (
    <div className="space-y-10">
      {/* Nadpis */}
      <div>
        <h1 className="font-display font-extrabold text-3xl text-[#2C1810]">📊 Statistiky</h1>
        <p className="text-sm text-[#8B6550] mt-1 font-semibold">{institution.name}</p>
      </div>

      {/* ─── SOUHRNNÉ KARTY ─── */}
      <Section title="Přehled">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isShelter ? (
            <>
              <SummaryCard label="Celkem zvířat" value={totalAnimals} color="#2C1810" />
              <SummaryCard label="Aktuálně v péči" value={inCare} color="#E8634A" />
              <SummaryCard label="Adoptováno celkem" value={totalAdopted} color="#2563EB" />
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
              <SummaryCard label="Celkem případů" value={totalCases} color="#2C1810" />
              <SummaryCard label="Aktivní případy" value={activeCases} color="#E8634A" />
              <SummaryCard label="Propuštěno" value={releasedCases} color="#16A34A" />
              <SummaryCard label="Míra propuštění" value={`${releaseRate} %`} color="#7C3AED" />
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Průměr (dny)" value={avgStay} color="#E8634A" />
          {isShelter ? (
            <>
              <SummaryCard label="Medián (dny)"   value={medStay}  color="#2C1810" />
              <SummaryCard label="Nejkratší"       value={minStay}  color="#16A34A" sub="dní" />
              <SummaryCard label="Nejdelší"        value={maxStay}  color="#DC2626" sub="dní" />
            </>
          ) : (
            <SummaryCard label="Průměr aktivních případů" value={avgCaseStay} color="#2C1810" sub="dní" />
          )}
        </div>
        {isShelter && (
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
        )}
      </Section>

      {/* ─── POKROČILÉ STATISTIKY — upgrade banner ─── */}
      {!hasAdvancedStats && (
        <div
          className="rounded-2xl border-2 p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6"
          style={{ borderColor: '#E8634A', background: '#FFFCF8' }}
        >
          <div className="text-5xl flex-shrink-0">📈</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-extrabold text-lg text-espresso mb-1">
              Pokročilé statistiky
            </h3>
            <p className="text-sm text-[#8B6550] mb-0">
              Měsíční trendy, srovnání rok/rok, detailní přehledy adopcí, dobrovolníků a sbírek —
              dostupné v plánu <strong className="text-espresso">Standard</strong> (490 Kč / měs).
            </p>
          </div>
          <Link
            href="/admin/billing"
            className="inline-flex items-center px-5 py-2.5 rounded-full font-bold text-sm text-white no-underline flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: '#E8634A' }}
          >
            Upgradovat
          </Link>
        </div>
      )}

      {/* ─── ADOPCE PO MĚSÍCÍCH (pouze útulek) ─── */}
      {hasAdvancedStats && isShelter && (
        <Section title={`Adopce po měsících`}>
          <div className="bg-white rounded-lg border border-[#F0EDE8] shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-[#F0EDE8]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider w-20">Měsíc</th>
                  {MONTH_LABELS.map(m => (
                    <th key={m} className="text-center px-2 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">{m}</th>
                  ))}
                  <th className="text-center px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Celkem</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#F0EDE8]">
                  <td className="px-4 py-3 font-bold text-[#2C1810] text-xs">{cy}</td>
                  {adoptThisYear.map((n, i) => (
                    <td key={i} className="text-center px-2 py-3">
                      <span className={`font-display font-extrabold text-lg ${n > 0 ? 'text-[#E8634A]' : 'text-[#D1CBC7]'}`}>
                        {n}
                      </span>
                    </td>
                  ))}
                  <td className="text-center px-4 py-3 font-display font-extrabold text-lg text-[#2C1810]">
                    {adoptThisYear.reduce((s, n) => s + n, 0)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-[#A09890] text-xs">{ly}</td>
                  {adoptLastYear.map((n, i) => (
                    <td key={i} className="text-center px-2 py-3">
                      <span className={`text-sm font-semibold ${n > 0 ? 'text-[#A09890]' : 'text-[#D1CBC7]'}`}>
                        {n}
                      </span>
                    </td>
                  ))}
                  <td className="text-center px-4 py-3 font-semibold text-[#A09890]">
                    {adoptLastYear.reduce((s, n) => s + n, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ─── POKROČILÉ SEKCE (Standard+) ─── */}
      {hasAdvancedStats && <>

      {/* ─── ŽÁDOSTI O ADOPCI ─── */}
      <Section title="Žádosti o adopci">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <SummaryCard label="Celkem žádostí" value={totalApps} color="#2C1810" />
          <SummaryCard label="Konverzní poměr" value={`${conversionRate} %`} color="#16A34A"
            sub="adoptováno / celkem" />
          <SummaryCard label="Adoptováno" value={adoptedApps} color="#2563EB" />
          <SummaryCard label="Čeká na vyřízení"
            value={(appCounts['pending'] ?? 0) + (appCounts['reviewing'] ?? 0) + (appCounts['meeting_scheduled'] ?? 0)}
            color="#CA8A04" />
        </div>
        <div className="bg-white rounded-lg border border-[#F0EDE8] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0EDE8] bg-[#FFFCF8]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Počet</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Podíl</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(APP_STATUS_CONFIG).map(([key, cfg]) => {
                const count = appCounts[key] ?? 0
                const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
                return (
                  <tr key={key} className="border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, background: cfg.color + '20' }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-extrabold text-lg text-[#2C1810]">{count}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-[#A09890]">{pct} %</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ─── DOBROVOLNÍCI ─── */}
      <Section title="Dobrovolníci">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Celkem"   value={totalVol}   color="#2C1810" />
          <SummaryCard label="Aktivní"  value={activeVol}  color="#16A34A" />
          <SummaryCard label="Čeká"     value={pendingVol} color="#CA8A04" />
          <SummaryCard label="Odmítnuto" value={rejectedVol} color="#DC2626" />
        </div>
      </Section>

      {/* ─── SBÍRKY ─── */}
      <Section title="Sbírky">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Aktivní sbírky"  value={activeFundraisers.length} color="#2C1810" />
          <SummaryCard label="Cílová částka"
            value={totalGoal > 0 ? `${totalGoal.toLocaleString('cs-CZ')} Kč` : '0 Kč'}
            color="#E8634A" />
          <SummaryCard label="Vybráno celkem"
            value={totalRaised > 0 ? `${totalRaised.toLocaleString('cs-CZ')} Kč` : '0 Kč'}
            color="#16A34A" />
          <SummaryCard label="Průměr splnění" value={`${avgCompletion} %`} color="#7C3AED" />
        </div>
        {activeFundraisers.length > 0 && (
          <div className="mt-4 bg-white rounded-lg border border-[#F0EDE8] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EDE8] bg-[#FFFCF8]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Sbírka</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Cíl</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Vybráno</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody>
                {activeFundraisers.map(f => {
                  const pct = f.goal_amount > 0 ? Math.round((f.current_amount / f.goal_amount) * 100) : 0
                  return (
                    <tr key={f.id} className="border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#2C1810] text-sm max-w-xs truncate">{f.title}</td>
                      <td className="px-4 py-3 text-right text-sm text-[#A09890]">{f.goal_amount?.toLocaleString('cs-CZ')} Kč</td>
                      <td className="px-4 py-3 text-right font-bold text-[#2C1810]">{f.current_amount?.toLocaleString('cs-CZ')} Kč</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-display font-extrabold text-lg ${pct >= 100 ? 'text-[#16A34A]' : pct >= 50 ? 'text-[#E8634A]' : 'text-[#A09890]'}`}>
                          {pct} %
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      </>}
    </div>
  )
}
