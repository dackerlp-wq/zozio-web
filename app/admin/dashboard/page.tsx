import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Načti instituci
  const { data: membership } = await supabase
    .from('institution_members')
    .select('role, institution:institutions(id, name, type)')
    .eq('user_id', user.id)
    .single()

  const institution = (membership?.institution as unknown) as { id: string; name: string; type: string } | null
  if (!institution) redirect('/auth/register')

  const isShelter = institution.type === 'shelter'

  // Statistiky
  const [animalsData, applicationsData, fundraisersData, volunteersData] = await Promise.all([
    isShelter
      ? supabase.from('animals').select('adoption_status').eq('institution_id', institution.id)
      : supabase.from('rescue_cases').select('status').eq('institution_id', institution.id),
    isShelter
      ? supabase.from('adoption_applications').select('status').eq('institution_id', institution.id)
      : Promise.resolve({ data: [] }),
    supabase.from('fundraisers').select('title, goal_amount, current_amount, active').eq('institution_id', institution.id).eq('active', true),
    supabase.from('volunteers').select('status').eq('institution_id', institution.id),
  ])

  const animals = animalsData.data ?? []
  const applications = (applicationsData as { data: { status: string }[] | null }).data ?? []
  const fundraisers = fundraisersData.data ?? []
  const volunteers = volunteersData.data ?? []

  // Počty
  const availableAnimals = isShelter
    ? animals.filter((a: { adoption_status: string }) => a.adoption_status === 'available').length
    : animals.filter((a: { status: string }) => ['intake', 'treatment', 'rehabilitation'].includes(a.status)).length

  const adoptedAnimals = isShelter
    ? animals.filter((a: { adoption_status: string }) => a.adoption_status === 'adopted').length
    : animals.filter((a: { status: string }) => a.status === 'released').length

  const pendingApplications = applications.filter(a => a.status === 'pending').length
  const activeVolunteers = volunteers.filter(v => v.status === 'active').length
  const pendingVolunteers = volunteers.filter(v => v.status === 'pending').length

  return (
    <div>
      {/* Hlavička */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl text-espresso">
            Dobrý den 👋
          </h1>
          <p className="text-gray mt-1 font-semibold">{institution.name}</p>
        </div>
        <Link href={isShelter ? '/admin/animals/new' : '/admin/animals/new'}>
          <Button variant={isShelter ? 'primary' : 'rescue'}>
            {isShelter ? '+ Přidat zvíře' : '+ Nový pacient'}
          </Button>
        </Link>
      </div>

      {/* Stat karty */}
      <div className="grid grid-cols-4 gap-5 mb-10">
        <StatCard
          icon={isShelter ? '🐾' : '🦉'}
          value={availableAnimals}
          label={isShelter ? 'K adopci' : 'V léčbě'}
          sub={`celkem ${animals.length}`}
          color={isShelter ? 'shelter' : 'rescue'}
          href="/admin/animals"
        />
        <StatCard
          icon={isShelter ? '✓' : '🌿'}
          value={adoptedAnimals}
          label={isShelter ? 'Adoptováno' : 'Propuštěno'}
          sub="celkem od začátku"
          color="success"
          href="/admin/animals"
        />
        {isShelter && (
          <StatCard
            icon="📋"
            value={pendingApplications}
            label="Nové žádosti"
            sub={`celkem ${applications.length}`}
            color="amber"
            href="/admin/applications"
          />
        )}
        <StatCard
          icon="🙋"
          value={activeVolunteers}
          label="Aktivní dobrovolníci"
          sub={pendingVolunteers > 0 ? `${pendingVolunteers} čeká na schválení` : 'žádní čekající'}
          color="default"
          href="/admin/volunteers"
        />
      </div>

      {/* Aktivní sbírky */}
      {fundraisers.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-2xl text-espresso">
              💛 Aktivní sbírky
            </h2>
            <Link href="/admin/fundraisers">
              <Button variant="sand" size="sm">Spravovat sbírky</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {fundraisers.map((f: { title: string; current_amount: number; goal_amount: number }) => {
              const percent = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
              const barColor = isShelter ? 'bg-coral' : 'bg-rescue'
              return (
                <div key={f.title} className="bg-white rounded-lg p-5 shadow-sm border border-gray-pale">
                  <div className="font-display font-bold text-base text-espresso mb-3">{f.title}</div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-espresso">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                    <span className="text-gray">z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
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

      {/* Rychlé akce */}
      <section>
        <h2 className="font-display font-extrabold text-2xl text-espresso mb-4">
          Rychlé akce
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <QuickAction
            href="/admin/animals/new"
            icon={isShelter ? '🐾' : '🦉'}
            label={isShelter ? 'Přidat zvíře' : 'Přidat pacienta'}
            color={isShelter ? 'coral' : 'rescue'}
          />
          {isShelter && (
            <QuickAction
              href="/admin/applications"
              icon="📋"
              label={`Žádosti (${pendingApplications} nových)`}
              color="amber"
            />
          )}
          <QuickAction
            href="/admin/fundraisers/new"
            icon="💛"
            label="Nová sbírka"
            color="amber"
          />
          <QuickAction
            href="/admin/volunteers"
            icon="🙋"
            label={pendingVolunteers > 0 ? `Dobrovolníci (${pendingVolunteers} čeká)` : 'Dobrovolníci'}
            color="default"
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon, value, label, sub, color, href
}: {
  icon: string
  value: number
  label: string
  sub: string
  color: string
  href: string
}) {
  const bgMap: Record<string, string> = {
    shelter: 'bg-coral-light',
    rescue:  'bg-rescue-bg',
    success: 'bg-success-bg',
    amber:   'bg-amber-light',
    default: 'bg-sand',
  }
  const valMap: Record<string, string> = {
    shelter: 'text-coral',
    rescue:  'text-rescue',
    success: 'text-success',
    amber:   'text-warning',
    default: 'text-espresso',
  }

  return (
    <Link href={href} className="no-underline">
      <div className={`${bgMap[color] ?? 'bg-sand'} rounded-lg p-5 hover:-translate-y-0.5 hover:shadow-md transition-all`}>
        <div className="text-3xl mb-3">{icon}</div>
        <div className={`font-display font-extrabold text-3xl mb-0.5 ${valMap[color] ?? 'text-espresso'}`}>
          {value}
        </div>
        <div className="font-body font-bold text-sm text-espresso">{label}</div>
        <div className="font-body text-xs text-gray mt-0.5">{sub}</div>
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
      <div className={`bg-white rounded-lg p-4 border-2 ${colorMap[color] ?? colorMap.default} transition-all flex items-center gap-3 hover:-translate-y-0.5`}>
        <span className="text-2xl">{icon}</span>
        <span className="font-display font-bold text-sm text-espresso">{label}</span>
      </div>
    </Link>
  )
}
