import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UpgradePrompt } from '@/components/admin/UpgradePrompt'
import { hasFeature } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

export const metadata = { title: 'Pokročilé reporty — Zozio Admin' }

const MONTHS = ['Led','Úno','Bře','Dub','Kvě','Čvn','Čvc','Srp','Zář','Říj','Lis','Pro']

function daysBetween(a: string, b: Date = new Date()) {
  return Math.floor((b.getTime() - new Date(a).getTime()) / 86_400_000)
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { period = '12m' } = await searchParams

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

  if (!hasFeature(
    (institution as any).plan as SubscriptionPlan ?? 'free',
    (institution as any).plan_expires_at ?? null,
    'advanced_reports'
  )) {
    return <UpgradePrompt feature="advanced_reports" />
  }

  const iid = membership.institution_id

  // Období
  const periodDays: Record<string, number> = { '3m': 90, '6m': 180, '12m': 365, '24m': 730 }
  const periodLabel: Record<string, string> = { '3m': '3 měsíce', '6m': '6 měsíců', '12m': '12 měsíců', '24m': '24 měsíců' }
  const days = periodDays[period] ?? 365
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  // Data
  const [
    { data: allAnimals = [] },
    { data: periodAnimals = [] },
    { data: allApps = [] },
    { data: periodApps = [] },
    { data: allVolunteers = [] },
    { data: allFundraisers = [] },
  ] = await Promise.all([
    service.from('animals').select('id, name, adoption_status, intake_date, created_at, species:animal_species(name_cs, icon)').eq('institution_id', iid),
    service.from('animals').select('id, name, adoption_status, intake_date, created_at').eq('institution_id', iid).gte('created_at', since),
    service.from('adoption_applications').select('id, status, created_at, updated_at').eq('institution_id', iid),
    service.from('adoption_applications').select('id, status, created_at, updated_at').eq('institution_id', iid).gte('created_at', since),
    service.from('volunteers').select('id, status, created_at').eq('institution_id', iid),
    service.from('fundraisers').select('id, title, goal_amount, current_amount, active, created_at').eq('institution_id', iid),
  ])

  // ── Adoption funnel ──
  const funnelTotal    = periodApps?.length ?? 0
  const funnelReview   = (periodApps ?? []).filter((a: any) => ['reviewing','meeting_scheduled','approved','adopted'].includes(a.status)).length
  const funnelMeeting  = (periodApps ?? []).filter((a: any) => ['meeting_scheduled','adopted'].includes(a.status)).length
  const funnelAdopted  = (periodApps ?? []).filter((a: any) => a.status === 'adopted').length

  // ── Měsíční intake / adopce ──
  const now = new Date()
  const monthlyData: { label: string; intake: number; adopted: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const intake  = (periodAnimals ?? []).filter((a: any) => { const ad = new Date(a.created_at); return ad.getFullYear() === y && ad.getMonth() === m }).length
    const adopted = (allAnimals ?? []).filter((a: any) => a.adoption_status === 'adopted' && (() => { const ad = new Date(a.created_at); return ad.getFullYear() === y && ad.getMonth() === m })()).length
    monthlyData.push({ label: `${MONTHS[m]} ${y !== now.getFullYear() ? y : ''}`.trim(), intake, adopted })
  }

  // ── Dlouhodobě ubytovaná zvířata ──
  const inCareStatuses = ['available', 'reserved', 'foster', 'treatment', 'rehabilitation', 'intake', 'conditional', 'not_for_adoption']
  const longStay = (allAnimals ?? [])
    .filter((a: any) => a.intake_date && inCareStatuses.includes(a.adoption_status))
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      species: (a.species as any)?.name_cs ?? '—',
      icon: (a.species as any)?.icon ?? '🐾',
      status: a.adoption_status,
      days: daysBetween(a.intake_date),
    }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 20)

  // ── Konverzní trychtýř (celoživotní) ──
  const lifetimeApps    = allApps?.length ?? 0
  const lifetimeAdopted = (allApps ?? []).filter((a: any) => a.status === 'adopted').length

  // ── Dobrovolníci ──
  const volTotal   = allVolunteers?.length ?? 0
  const volActive  = (allVolunteers ?? []).filter((v: any) => v.status === 'active').length
  const volPending = (allVolunteers ?? []).filter((v: any) => v.status === 'pending').length

  // ── Sbírky ──
  const activeFr  = (allFundraisers ?? []).filter((f: any) => f.active)
  const totalGoal = activeFr.reduce((s: number, f: any) => s + (f.goal_amount ?? 0), 0)
  const totalRaised = activeFr.reduce((s: number, f: any) => s + (f.current_amount ?? 0), 0)

  const PERIOD_OPTIONS = ['3m', '6m', '12m', '24m']

  return (
    <div className="space-y-10 max-w-[960px]">

      {/* Hlavička */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso">📊 Pokročilé reporty</h1>
          <p className="text-sm text-[#8B6550] mt-1 font-semibold">{institution.name}</p>
        </div>
        {/* Přepínač období */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F5F0EC]">
          {PERIOD_OPTIONS.map(p => (
            <Link key={p} href={`?period=${p}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold no-underline transition-all ${
                period === p
                  ? 'bg-white text-espresso shadow-sm'
                  : 'text-[#8B6550] hover:text-espresso'
              }`}>
              {periodLabel[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPI řádek ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Nová zvířata', value: periodAnimals?.length ?? 0, sub: `za ${periodLabel[period]}`, color: '#E8634A' },
          { label: 'Žádosti o adopci', value: funnelTotal, sub: `za ${periodLabel[period]}`, color: '#2C1810' },
          { label: 'Adoptováno', value: funnelAdopted, sub: `konverze ${pct(funnelAdopted, funnelTotal)} %`, color: '#16A34A' },
          { label: 'Celkem adoptováno', value: lifetimeAdopted, sub: `z ${lifetimeApps} žádostí`, color: '#2563EB' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-[#F0EDE8] shadow-sm">
            <div className="text-xs font-bold text-[#A09890] uppercase tracking-wider mb-1">{label}</div>
            <div className="font-display font-extrabold text-3xl" style={{ color }}>{value}</div>
            <div className="text-xs text-[#A09890] mt-1 font-semibold">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Adoption funnel ── */}
      <section>
        <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Adopční trychtýř — {periodLabel[period]}</h2>
        <div className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm p-5 md:p-6">
          {funnelTotal === 0 ? (
            <p className="text-sm text-[#A09890] text-center py-6">V tomto období žádné žádosti.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: '📋 Přijaté žádosti',   count: funnelTotal,   color: '#E8634A' },
                { label: '🔍 Posuzováno',         count: funnelReview,  color: '#F0A500' },
                { label: '🤝 Schůzka sjednána',   count: funnelMeeting, color: '#2563EB' },
                { label: '🏠 Adoptováno',          count: funnelAdopted, color: '#16A34A' },
              ].map(({ label, count, color }) => {
                const width = pct(count, funnelTotal)
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-espresso">{label}</span>
                      <span className="text-sm font-bold" style={{ color }}>{count} <span className="text-[#A09890] font-normal text-xs">({width} %)</span></span>
                    </div>
                    <div className="h-6 bg-[#F5F0EC] rounded-lg overflow-hidden">
                      <div className="h-full rounded-lg transition-all"
                        style={{ width: `${Math.max(width, 2)}%`, background: color + '33', borderRight: `3px solid ${color}` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Měsíční přehled ── */}
      <section>
        <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Měsíční přehled (posledních 12 měsíců)</h2>
        <div className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#F0EDE8] bg-[#FFFCF8]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Měsíc</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Nová zvířata</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Adoptováno</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Rozdíl</th>
                <th className="px-4 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(({ label, intake, adopted }, i) => {
                const diff = adopted - intake
                return (
                  <tr key={i} className="border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                    <td className="px-4 py-3 font-semibold text-espresso">{label}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-extrabold text-lg text-espresso">{intake}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-extrabold text-lg text-[#16A34A]">{adopted}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${diff > 0 ? 'text-[#16A34A]' : diff < 0 ? 'text-[#DC2626]' : 'text-[#A09890]'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5 items-end h-5">
                        {intake > 0 && (
                          <div className="rounded-sm" style={{ width: 8, height: `${Math.min(pct(intake, Math.max(intake, adopted, 1)), 100)}%`, minHeight: 4, background: '#E8634A55' }} />
                        )}
                        {adopted > 0 && (
                          <div className="rounded-sm" style={{ width: 8, height: `${Math.min(pct(adopted, Math.max(intake, adopted, 1)), 100)}%`, minHeight: 4, background: '#16A34A88' }} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Dlouhodobě ubytovaná ── */}
      {longStay.length > 0 && (
        <section>
          <h2 className="font-display font-extrabold text-lg text-espresso mb-1">Dlouhodobě v péči</h2>
          <p className="text-sm text-[#8B6550] mb-4">Zvířata seřazená dle délky pobytu — kandidáti na prioritní adopci.</p>
          <div className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EDE8] bg-[#FFFCF8]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Zvíře</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Druh</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Dní v péči</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-[#A09890] uppercase tracking-wider">Stav</th>
                </tr>
              </thead>
              <tbody>
                {longStay.map(({ id, name, species, icon, status, days }, i) => (
                  <tr key={id} className={`border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors ${days >= 180 ? 'bg-[#FFF8F8]' : ''}`}>
                    <td className="px-4 py-3 text-[#A09890] font-semibold text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/animals/${id}`} className="font-bold text-espresso no-underline hover:text-coral transition-colors">
                        {name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#8B6550]">{icon} {species}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-display font-extrabold text-lg ${days >= 180 ? 'text-[#DC2626]' : days >= 90 ? 'text-[#D97706]' : 'text-espresso'}`}>
                        {days}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-pill font-bold bg-[#F5F0EC] text-[#8B6550]">{status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Sbírky + Dobrovolníci ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm p-5">
          <h2 className="font-display font-extrabold text-base text-espresso mb-4">💛 Sbírky</h2>
          <div className="space-y-3">
            {[
              { label: 'Aktivní sbírky', value: activeFr.length },
              { label: 'Cílová částka', value: `${totalGoal.toLocaleString('cs-CZ')} Kč` },
              { label: 'Vybráno celkem', value: `${totalRaised.toLocaleString('cs-CZ')} Kč` },
              { label: 'Plnění', value: `${pct(totalRaised, totalGoal)} %` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-[#F5F0EC] last:border-0">
                <span className="text-sm text-[#8B6550] font-semibold">{label}</span>
                <span className="font-bold text-espresso text-sm">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm p-5">
          <h2 className="font-display font-extrabold text-base text-espresso mb-4">🙋 Dobrovolníci</h2>
          <div className="space-y-3">
            {[
              { label: 'Celkem registrovaných', value: volTotal },
              { label: 'Aktivní', value: volActive },
              { label: 'Čeká na schválení', value: volPending },
              { label: 'Aktivační poměr', value: `${pct(volActive, volTotal)} %` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-[#F5F0EC] last:border-0">
                <span className="text-sm text-[#8B6550] font-semibold">{label}</span>
                <span className="font-bold text-espresso text-sm">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  )
}
