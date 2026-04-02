import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ZozLogo } from '@/components/ui/ZozLogo'

export default async function SuperadminPage() {
  const service = createServiceClient()

  const [institutionsData, usersData, animalsData, applicationsData] = await Promise.all([
    service.from('institutions').select('approval_status, type, plan'),
    service.from('profiles').select('role', { count: 'exact' }),
    service.from('animals').select('id', { count: 'exact' }),
    service.from('adoption_applications').select('status', { count: 'exact' }),
  ])

  const institutions  = institutionsData.data  ?? []
  const totalUsers    = usersData.count         ?? 0
  const totalAnimals  = animalsData.count        ?? 0
  const totalApps     = applicationsData.count   ?? 0

  const pending  = institutions.filter(i => i.approval_status === 'pending').length
  const approved = institutions.filter(i => i.approval_status === 'approved').length
  const shelters = institutions.filter(i => i.type === 'shelter').length
  const rescues  = institutions.filter(i => i.type === 'rescue_station').length
  const paying   = institutions.filter(i => i.plan !== 'free').length

  return (
    <div className="min-h-screen bg-gray-pale/30">
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ZozLogo size="sm" variant="inverted" />
          <span className="font-display font-bold text-sm text-amber">⚡ Superadmin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-xs text-gray-light hover:text-white transition-colors font-semibold">
            Admin panel →
          </Link>
          <Link href="/" className="text-xs text-gray-light hover:text-white transition-colors font-semibold">
            Web →
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-8 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-extrabold text-4xl text-espresso">
              Superadmin
            </h1>
            <p className="text-gray mt-1 font-semibold">Správa celé platformy Zozio</p>
          </div>
          {pending > 0 && (
            <Link href="/superadmin/institutions?filter=pending">
              <Button variant="amber">
                🔔 {pending} institucí čeká na schválení
              </Button>
            </Link>
          )}
        </div>

        {/* Stat karty */}
        <div className="grid grid-cols-4 gap-5 mb-10">
          <SuperStat icon="🏢" value={approved} label="Schválených institucí" sub={`${pending} čeká`} color="bg-success-bg text-success" href="/superadmin/institutions" />
          <SuperStat icon="👥" value={totalUsers} label="Uživatelů" sub="celkem registrovaných" color="bg-rescue-bg text-rescue-dark" href="/superadmin/users" />
          <SuperStat icon="🐾" value={totalAnimals} label="Zvířat v systému" sub={`${shelters} útulků · ${rescues} stanic`} color="bg-coral-light text-coral-dark" href="/superadmin/institutions" />
          <SuperStat icon="💰" value={paying} label="Platících institucí" sub={`z ${institutions.length} celkem`} color="bg-amber-light text-warning" href="/superadmin/institutions" />
        </div>

        {/* Rychlé akce */}
        <div className="grid grid-cols-4 gap-5">
          <SuperAction
            href="/superadmin/institutions?filter=pending"
            icon="🔍"
            title="Ke schválení"
            desc={pending > 0 ? `${pending} institucí čeká na kontrolu` : 'Žádné čekající instituce'}
            urgent={pending > 0}
          />
          <SuperAction
            href="/superadmin/institutions"
            icon="🏢"
            title="Všechny instituce"
            desc={`${institutions.length} registrovaných institucí`}
          />
          <SuperAction
            href="/superadmin/users"
            icon="👥"
            title="Uživatelé"
            desc={`${totalUsers} registrovaných uživatelů`}
          />
          <SuperAction
            href="/superadmin/newsletter"
            icon="📬"
            title="Newsletter"
            desc="Globální odběratelé a odesílání"
          />
        </div>
      </div>
    </div>
  )
}

function SuperStat({ icon, value, label, sub, color, href }: {
  icon: string; value: number; label: string; sub: string; color: string; href: string
}) {
  return (
    <Link href={href} className="no-underline">
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-pale hover:-translate-y-0.5 hover:shadow-md transition-all">
        <div className="text-3xl mb-3">{icon}</div>
        <div className={`font-display font-extrabold text-3xl mb-0.5 ${color.split(' ')[1]}`}>{value}</div>
        <div className="font-body font-bold text-sm text-espresso">{label}</div>
        <div className="font-body text-xs text-gray mt-0.5">{sub}</div>
      </div>
    </Link>
  )
}

function SuperAction({ href, icon, title, desc, urgent }: {
  href: string; icon: string; title: string; desc: string; urgent?: boolean
}) {
  return (
    <Link href={href} className="no-underline">
      <div className={`bg-white rounded-lg p-6 border-2 hover:-translate-y-0.5 hover:shadow-md transition-all
        ${urgent ? 'border-amber' : 'border-gray-pale hover:border-gray-light'}`}>
        <div className="text-3xl mb-3">{icon}</div>
        <div className="font-display font-extrabold text-lg text-espresso mb-1">{title}</div>
        <div className="text-sm text-gray">{desc}</div>
        {urgent && (
          <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold bg-amber-light text-warning">
            Vyžaduje pozornost
          </div>
        )}
      </div>
    </Link>
  )
}
