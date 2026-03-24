import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

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

  const [animalsData, applicationsData, fundraisersData, volunteersData] = await Promise.all([
    isShelter
      ? service.from('animals').select('adoption_status').eq('institution_id', institution.id)
      : service.from('rescue_cases').select('status').eq('institution_id', institution.id),
    isShelter
      ? service.from('adoption_applications').select('status').eq('institution_id', institution.id)
      : Promise.resolve({ data: [] }),
    service.from('fundraisers').select('title, goal_amount, current_amount').eq('institution_id', institution.id).eq('active', true),
    service.from('volunteers').select('status').eq('institution_id', institution.id),
  ])

  const animals     = (animalsData.data ?? []) as any[]
  const applications = ((applicationsData as any).data ?? []) as any[]
  const fundraisers  = (fundraisersData.data ?? []) as any[]
  const volunteers   = (volunteersData.data ?? []) as any[]

  const availableAnimals = isShelter
    ? animals.filter((a: any) => a.adoption_status === 'available').length
    : animals.filter((a: any) => ['intake', 'treatment', 'rehabilitation'].includes(a.status)).length

  const adoptedAnimals = isShelter
    ? animals.filter((a: any) => a.adoption_status === 'adopted').length
    : animals.filter((a: any) => a.status === 'released').length

  const pendingApplications = applications.filter((a: any) => a.status === 'pending').length
  const activeVolunteers    = volunteers.filter((v: any) => v.status === 'active').length
  const pendingVolunteers   = volunteers.filter((v: any) => v.status === 'pending').length

  return (
    <div>
      {/* Hlavička */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">
            Dobrý den 👋
          </h1>
          <p className="text-gray mt-1 font-semibold text-sm">{institution.name}</p>
        </div>
        <Link href="/admin/animals/new">
          <Button variant={isShelter ? 'primary' : 'rescue'} size="sm">
            + {isShelter ? 'Přidat zvíře' : 'Nový pacient'}
          </Button>
        </Link>
      </div>

      {/* Stat karty — 2 na mobilu, 4 na desktopu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8 md:mb-10">
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
          icon={isShelter ? '✓' : '🌿'}
          value={adoptedAnimals}
          label={isShelter ? 'Adoptováno' : 'Propuštěno'}
          sub="celkem"
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

      {/* Aktivní sbírky */}
      {fundraisers.length > 0 && (
        <section className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-xl md:text-2xl text-espresso">💛 Aktivní sbírky</h2>
            <Link href="/admin/fundraisers">
              <Button variant="sand" size="sm">Spravovat</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fundraisers.map((f: any) => {
              const percent = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
              const barColor = isShelter ? 'bg-coral' : 'bg-rescue'
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
                  <div className={`text-xs font-bold mt-1 ${isShelter ? 'text-coral' : 'text-rescue'}`}>{percent}% vybráno</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Rychlé akce */}
      <section>
        <h2 className="font-display font-extrabold text-xl md:text-2xl text-espresso mb-4">Rychlé akce</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <QuickAction href="/admin/animals/new" icon={isShelter ? '🐾' : '🦉'} label={isShelter ? 'Přidat zvíře' : 'Nový pacient'} color="coral" />
          {isShelter && (
            <QuickAction href="/admin/applications" icon="📋" label={pendingApplications > 0 ? `Žádosti (${pendingApplications})` : 'Žádosti'} color="amber" />
          )}
          <QuickAction href="/admin/fundraisers/new" icon="💛" label="Nová sbírka" color="amber" />
          <QuickAction href="/admin/volunteers" icon="🙋" label={pendingVolunteers > 0 ? `Dobrovolníci (${pendingVolunteers})` : 'Dobrovolníci'} color="default" />
          <QuickAction href="/admin/settings" icon="⚙️" label="Nastavení" color="default" />
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
