import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/admin/StatCard'

const statusLabel: Record<string, string> = {
  available: 'K adopci', reserved: 'Rezervováno', adopted: 'Adoptováno',
  foster: 'Pěstounská', intake: 'Příjem', treatment: 'Léčba',
  rehabilitation: 'Rehabilitace', released: 'Propuštěno', deceased: 'Uhynulo',
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `před ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `před ${hours} h`
  return `před ${Math.floor(hours / 24)} dny`
}

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

  const animals      = (animalsData.data    ?? []) as any[]
  const applications = ((applicationsData as any).data ?? []) as any[]
  const fundraisers  = (fundraisersData.data ?? []) as any[]
  const volunteers   = (volunteersData.data  ?? []) as any[]
  const longStay     = (longStayData.data    ?? []) as any[]

  // Aktuální statistiky
  const availableAnimals = isShelter
    ? animals.filter((a: any) => a.adoption_status === 'available').length
    : animals.filter((a: any) => ['intake', 'treatment', 'rehabilitation'].includes(a.status)).length

  const adoptedTotal = isShelter
    ? animals.filter((a: any) => a.adoption_status === 'adopted').length
    : animals.filter((a: any) => a.status === 'released').length

  // Tento měsíc
  const newThisMonth = animals.filter((a: any) =>
    new Date(a.intake_date ?? a.created_at) >= new Date(thisMonthStart)
  ).length

  const adoptedThisMonth = isShelter
    ? applications.filter((a: any) => a.status === 'adopted' && new Date(a.created_at) >= new Date(thisMonthStart)).length
    : animals.filter((a: any) => a.status === 'released' && new Date(a.created_at) >= new Date(thisMonthStart)).length

  // Minulý měsíc (pro trend)
  const newLastMonth = animals.filter((a: any) => {
    const d = new Date(a.intake_date ?? a.created_at)
    return d >= new Date(lastMonthStart) && d < new Date(thisMonthStart)
  }).length

  const trend = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : newThisMonth > 0 ? 100 : 0

  // Průměrná délka pobytu (adoptovaná zvířata)
  const avgStayDays = (() => {
    const withIntake = animals.filter((a: any) => a.intake_date)
    if (!withIntake.length) return null
    const totalDays = withIntake.reduce((sum: number, a: any) => {
      const days = Math.floor((now.getTime() - new Date(a.intake_date).getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    return Math.round(totalDays / withIntake.length)
  })()

  const pendingApplications = applications.filter((a: any) => a.status === 'pending').length
  const activeVolunteers    = volunteers.filter((v: any) => v.status === 'active').length
  const pendingVolunteers   = volunteers.filter((v: any) => v.status === 'pending').length

  // Activity feed
  let activity: any[] = []
  try {
    const { data: activityRaw } = await service
      .from('animal_status_history')
      .select(`
        id, changed_at, new_status,
        animal:animals!animal_status_history_animal_id_fkey(id, name, institution_id)
      `)
      .order('changed_at', { ascending: false })
      .limit(20)
    activity = (activityRaw ?? []).filter((h: any) => h.animal?.institution_id === institution.id).slice(0, 8)
  } catch {
    activity = []
  }

  return (
    <div>
      {/* Hlavička */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">Dobrý den 👋</h1>
          <p className="text-gray mt-1 font-semibold text-sm">{institution.name}</p>
        </div>
        <Link href="/admin/animals/new" className="hidden md:block">
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
          color={isShelter ? '#E8634A' : '#2E9E8F'}
          href="/admin/animals"
        />
        <StatCard
          icon={isShelter ? '🏠' : '🌿'}
          value={adoptedTotal}
          label={isShelter ? 'Adoptováno' : 'Propuštěno'}
          sub={adoptedThisMonth > 0 ? `${adoptedThisMonth} tento měsíc` : 'celkem'}
          color="#2A7D4F"
          href="/admin/animals"
        />
        {isShelter ? (
          <StatCard
            icon="📋"
            value={pendingApplications}
            label="Nové žádosti"
            sub={`celkem ${applications.length}`}
            color="#F0A500"
            href="/admin/applications"
          />
        ) : (
          <StatCard
            icon="💛"
            value={fundraisers.length}
            label="Aktivní sbírky"
            sub="právě probíhají"
            color="#F0A500"
            href="/admin/fundraisers"
          />
        )}
        <StatCard
          icon="🙋"
          value={activeVolunteers}
          label="Dobrovolníci"
          sub={pendingVolunteers > 0 ? `${pendingVolunteers} čeká` : 'aktivní'}
          color="#2C1810"
          href="/admin/volunteers"
        />
      </div>

      {/* ── 2-column layout: main content + activity feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="min-w-0">
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
                {longStay.map((a: any) => {
                  const days = Math.floor((now.getTime() - new Date(a.intake_date).getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <Link key={a.id} href={`/admin/animals/${a.id}`} className="no-underline">
                      <div className="flex items-center justify-between bg-white rounded-md px-4 py-2.5 hover:shadow-sm transition-all">
                        <span className="font-display font-bold text-sm text-espresso">
                          {a.name ?? a.case_number}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray">
                            od {new Date(a.intake_date).toLocaleDateString('cs-CZ')}
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
                {fundraisers.map((f: any) => {
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

        {/* Right column: Activity feed */}
        <div>
          <div className="bg-white rounded-2xl border border-[#F0EDE8] p-5">
            <h2 className="font-display font-extrabold text-base text-espresso mb-1">Poslední aktivita</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-[#8B6550] mt-3">Zatím žádná aktivita</p>
            ) : (
              <div>
                {activity.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 py-3 border-b border-[#F0EDE8] last:border-0">
                    <span className="text-sm mt-0.5">🐾</span>
                    <div className="min-w-0">
                      <div className="text-xs text-[#8B6550]">{relativeTime(h.changed_at)}</div>
                      <div className="text-sm font-bold text-espresso truncate">{h.animal?.name ?? '—'}</div>
                      <div className="text-sm text-[#8B6550]">→ {statusLabel[h.new_status] ?? h.new_status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
