import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { Animal, RescueCase, AdoptionApplication, Fundraiser, Volunteer } from '@/types/database'

type AnimalRow = Pick<Animal, 'adoption_status' | 'intake_date' | 'created_at'>
type RescueCaseRow = Pick<RescueCase, 'status' | 'intake_date' | 'created_at'>
type AnimalOrRescueRow = AnimalRow | RescueCaseRow
type ApplicationRow = Pick<AdoptionApplication, 'status' | 'created_at'>
type FundraiserRow = Pick<Fundraiser, 'title' | 'goal_amount' | 'current_amount' | 'active'>
type VolunteerRow = Pick<Volunteer, 'status'>
type LongStayAnimalRow = Pick<Animal, 'id' | 'name' | 'intake_date'>
type LongStayRescueRow = Pick<RescueCase, 'id' | 'name' | 'case_number' | 'intake_date'>
type LongStayRow = LongStayAnimalRow | LongStayRescueRow

export default async function DashboardPage() {
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
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/auth/register')

  const isShelter = institution.type === 'shelter'

  // Datum hranice pro výpočty
  const now         = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const longStayDate   = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 dní

  const [animalsData, applicationsData, fundraisersData, volunteersData, longStayData] =
    await Promise.all([
      isShelter
        ? service.from('animals').select('adoption_status, intake_date, created_at').eq('institution_id', institution.id)
        : service.from('rescue_cases').select('status, intake_date, created_at').eq('institution_id', institution.id),
      isShelter
        ? service.from('adoption_applications').select('status, created_at').eq('institution_id', institution.id)
        : Promise.resolve({ data: [] }),
      service.from('fundraisers').select('title, goal_amount, current_amount, active').eq('institution_id', institution.id).eq('active', true),
      service.from('volunteers').select('status').eq('institution_id', institution.id),
      // Zvířata déle než 90 dní
      isShelter
        ? service.from('animals').select('id, name, intake_date').eq('institution_id', institution.id).eq('adoption_status', 'available').lt('intake_date', longStayDate).order('intake_date', { ascending: true }).limit(5)
        : service.from('rescue_cases').select('id, name, case_number, intake_date').eq('institution_id', institution.id).in('status', ['intake', 'treatment', 'rehabilitation']).lt('intake_date', longStayDate).order('intake_date', { ascending: true }).limit(5),
    ])

  const animals      = (animalsData.data    ?? []) as AnimalOrRescueRow[]
  const applications = ((applicationsData as { data: ApplicationRow[] | null }).data ?? []) as ApplicationRow[]
  const fundraisers  = (fundraisersData.data ?? []) as FundraiserRow[]
  const volunteers   = (volunteersData.data  ?? []) as VolunteerRow[]
  const longStay     = (longStayData.data    ?? []) as LongStayRow[]

  // Aktuální statistiky
  const availableAnimals = isShelter
    ? animals.filter((a) => 'adoption_status' in a && a.adoption_status === 'available').length
    : animals.filter((a) => 'status' in a && ['intake', 'treatment', 'rehabilitation'].includes(a.status)).length

  const adoptedTotal = isShelter
    ? animals.filter((a) => 'adoption_status' in a && a.adoption_status === 'adopted').length
    : animals.filter((a) => 'status' in a && a.status === 'released').length

  // Tento měsíc
  const newThisMonth = animals.filter((a) =>
    new Date(a.intake_date ?? a.created_at) >= new Date(thisMonthStart)
  ).length

  const adoptedThisMonth = isShelter
    ? applications.filter((a) => a.status === 'adopted' && new Date(a.created_at) >= new Date(thisMonthStart)).length
    : animals.filter((a) => 'status' in a && a.status === 'released' && new Date(a.created_at) >= new Date(thisMonthStart)).length

  // Minulý měsíc (pro trend)
  const newLastMonth = animals.filter((a) => {
    const d = new Date(a.intake_date ?? a.created_at)
    return d >= new Date(lastMonthStart) && d < new Date(thisMonthStart)
  }).length

  const trend = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : newThisMonth > 0 ? 100 : 0

  // Průměrná délka pobytu (adoptovaná zvířata)
  const avgStayDays = (() => {
    const withIntake = animals.filter((a): a is AnimalOrRescueRow & { intake_date: string } => a.intake_date !== null)
    if (!withIntake.length) return null
    const totalDays = withIntake.reduce((sum: number, a) => {
      const days = Math.floor((now.getTime() - new Date(a.intake_date).getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    return Math.round(totalDays / withIntake.length)
  })()

  const pendingApplications = applications.filter((a) => a.status === 'pending').length
  const activeVolunteers    = volunteers.filter((v) => v.status === 'active').length
  const pendingVolunteers   = volunteers.filter((v) => v.status === 'pending').length

  return (
    <div>
      {/* Hlavička */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">Dobrý den 👋</h1>
          <p className="text-gray mt-1 font-semibold text-sm">{institution.name}</p>
        </div>
        <Link href="/admin/animals/new">
          <Button variant={isShelter ? 'primary' : 'rescue'} size="sm">
            + {isShelter ? 'Přidat zvíře' : 'Nový pacient'}
          </Button>
        </Link>
      </div>

      {/* ── Stat karty ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
        <StatCard
          icon={isShelter ? '🐾' : '🦉'}
          value={availableAnimals}
          label={isShelter ? 'K adopci' : 'V léčbě'}
          sub={`celkem ${animals.length}`}
          colorVal={isShelter ? 'text-coral' : 'text-rescue'}
          colorBg={isShelter ? 'bg-coral-light' : 'bg-rescue-bg'}
          href="/admin/animals"
        />
        <StatCard
          icon={isShelter ? '🏠' : '🌿'}
          value={adoptedTotal}
          label={isShelter ? 'Adoptováno' : 'Propuštěno'}
          sub={adoptedThisMonth > 0 ? `${adoptedThisMonth} tento měsíc` : 'celkem'}
          colorVal="text-success"
          colorBg="bg-success-bg"
          href="/admin/animals"
        />
        {isShelter ? (
          <StatCard
            icon="📋"
            value={pendingApplications}
            label="Nové žádosti"
            sub={`celkem ${applications.length}`}
            colorVal="text-warning"
            colorBg="bg-amber-light"
            href="/admin/applications"
          />
        ) : (
          <StatCard
            icon="💛"
            value={fundraisers.length}
            label="Aktivní sbírky"
            sub="právě probíhají"
            colorVal="text-warning"
            colorBg="bg-amber-light"
            href="/admin/fundraisers"
          />
        )}
        <StatCard
          icon="🙋"
          value={activeVolunteers}
          label="Dobrovolníci"
          sub={pendingVolunteers > 0 ? `${pendingVolunteers} čeká` : 'aktivní'}
          colorVal="text-espresso"
          colorBg="bg-sand"
          href="/admin/volunteers"
        />
      </div>

      {/* ── Trendy tento měsíc ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 md:p-5 border border-gray-pale shadow-sm">
          <div className="text-xs font-bold text-gray uppercase tracking-wider mb-1">Nových {isShelter ? 'příjmů' : 'případů'} tento měsíc</div>
          <div className="flex items-end gap-2">
            <span className="font-display font-extrabold text-3xl text-espresso">{newThisMonth}</span>
            {trend !== 0 && (
              <span className={`text-sm font-bold mb-0.5 ${trend > 0 ? 'text-coral' : 'text-success'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} %
              </span>
            )}
          </div>
          <div className="text-xs text-gray mt-0.5">vs. {newLastMonth} minulý měsíc</div>
        </div>

        <div className="bg-white rounded-lg p-4 md:p-5 border border-gray-pale shadow-sm">
          <div className="text-xs font-bold text-gray uppercase tracking-wider mb-1">
            {isShelter ? 'Adopcí' : 'Propuštění'} tento měsíc
          </div>
          <div className="font-display font-extrabold text-3xl text-espresso">{adoptedThisMonth}</div>
          <div className="text-xs text-gray mt-0.5">celkem {adoptedTotal} od začátku</div>
        </div>

        <div className="bg-white rounded-lg p-4 md:p-5 border border-gray-pale shadow-sm">
          <div className="text-xs font-bold text-gray uppercase tracking-wider mb-1">Průměrná délka pobytu</div>
          <div className="font-display font-extrabold text-3xl text-espresso">
            {avgStayDays !== null ? `${avgStayDays} dní` : '—'}
          </div>
          <div className="text-xs text-gray mt-0.5">u aktuálních zvířat</div>
        </div>
      </div>

      {/* ── Dlouhodobě ubytovaná zvířata ── */}
      {longStay.length > 0 && (
        <div className="bg-amber-light/60 rounded-lg border border-amber/30 p-4 md:p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-extrabold text-lg text-espresso">
                ⏰ Dlouhodobý pobyt (90+ dní)
              </h2>
              <p className="text-xs text-brown-mid mt-0.5">
                Tato zvířata čekají déle než 3 měsíce — zvažte urgentní adopci nebo mediální pozornost.
              </p>
            </div>
            <Link href="/admin/animals?status=available">
              <Button variant="amber" size="sm">Zobrazit vše</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {longStay.map((a) => {
              const days = Math.floor((now.getTime() - new Date(a.intake_date!).getTime()) / (1000 * 60 * 60 * 24))
              return (
                <Link key={a.id} href={`/admin/animals/${a.id}`} className="no-underline">
                  <div className="flex items-center justify-between bg-white rounded-md px-4 py-2.5 hover:shadow-sm transition-all">
                    <span className="font-display font-bold text-sm text-espresso">
                      {a.name ?? ('case_number' in a ? a.case_number : null)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray">
                        od {new Date(a.intake_date!).toLocaleDateString('cs-CZ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold
                        ${days > 180 ? 'bg-coral text-white' : 'bg-amber text-espresso'}`}>
                        {days} dní
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Aktivní sbírky ── */}
      {fundraisers.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-extrabold text-xl text-espresso">💛 Aktivní sbírky</h2>
            <Link href="/admin/fundraisers">
              <Button variant="sand" size="sm">Spravovat</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fundraisers.map((f) => {
              const percent   = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
              const barColor  = isShelter ? 'bg-coral' : 'bg-rescue'
              return (
                <div key={f.title} className="bg-white rounded-lg p-4 md:p-5 shadow-sm border border-gray-pale">
                  <div className="font-display font-bold text-sm md:text-base text-espresso mb-3 leading-tight">{f.title}</div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-espresso">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                    <span className="text-gray text-xs">z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-pale rounded-pill overflow-hidden">
                    <div className={`h-full ${barColor} rounded-pill`} style={{ width: `${percent}%` }} />
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isShelter ? 'text-coral' : 'text-rescue'}`}>
                    {percent}% vybráno
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Rychlé akce ── */}
      <section>
        <h2 className="font-display font-extrabold text-xl text-espresso mb-3">Rychlé akce</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/admin/animals/new"    icon={isShelter ? '🐾' : '🦉'} label={isShelter ? 'Přidat zvíře' : 'Nový pacient'} color="coral" />
          {isShelter && <QuickAction href="/admin/applications" icon="📋" label={pendingApplications > 0 ? `Žádosti (${pendingApplications})` : 'Žádosti'} color="amber" />}
          <QuickAction href="/admin/fundraisers/new" icon="💛" label="Nová sbírka"    color="amber" />
          <QuickAction href="/admin/volunteers"      icon="🙋" label={pendingVolunteers > 0 ? `Dobrovolníci (${pendingVolunteers})` : 'Dobrovolníci'} color="default" />
          <QuickAction href="/admin/articles/new"    icon="📝" label="Nový článek"    color="default" />
          <QuickAction href="/admin/settings"        icon="⚙️" label="Nastavení"      color="default" />
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, value, label, sub, colorVal, colorBg, href }: {
  icon: string; value: number; label: string; sub: string
  colorVal: string; colorBg: string; href: string
}) {
  return (
    <Link href={href} className="no-underline">
      <div className={`${colorBg} rounded-lg p-4 md:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all`}>
        <div className="text-2xl md:text-3xl mb-2 md:mb-3">{icon}</div>
        <div className={`font-display font-extrabold text-2xl md:text-3xl mb-0.5 ${colorVal}`}>{value}</div>
        <div className="font-body font-bold text-xs md:text-sm text-espresso">{label}</div>
        <div className="font-body text-xs text-gray mt-0.5 hidden md:block">{sub}</div>
      </div>
    </Link>
  )
}

function QuickAction({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    coral:   'border-coral hover:bg-coral-light',
    rescue:  'border-rescue hover:bg-rescue-bg',
    amber:   'border-amber hover:bg-amber-light',
    default: 'border-gray-pale hover:bg-gray-pale',
  }
  return (
    <Link href={href} className="no-underline">
      <div className={`bg-white rounded-lg p-3 md:p-4 border-2 ${colorMap[color] ?? colorMap.default} transition-all flex items-center gap-2 md:gap-3 hover:-translate-y-0.5`}>
        <span className="text-xl md:text-2xl">{icon}</span>
        <span className="font-display font-bold text-xs md:text-sm text-espresso leading-tight">{label}</span>
      </div>
    </Link>
  )
}
