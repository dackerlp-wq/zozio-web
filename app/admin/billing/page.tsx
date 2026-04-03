import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const plans = [
  {
    key: 'free',
    name: 'Free',
    price: 'Zdarma',
    features: ['10 zvířat', 'Základní profil', 'Adopční žádosti'],
  },
  {
    key: 'basic',
    name: 'Basic',
    price: '990 Kč/měs',
    features: ['100 zvířat', 'Sbírky', 'Statistiky', 'E-mail podpora'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '1990 Kč/měs',
    features: ['Neomezeno zvířat', 'Analytiky', 'Vlastní doména', 'Prioritní podpora'],
  },
]

export default async function BillingPage() {
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

  if (!institution) redirect('/admin/dashboard')

  const { data: inst } = await service
    .from('institutions')
    .select('plan, approval_status')
    .eq('id', institution.id)
    .single()

  const plan = (inst as any)?.plan ?? 'free'
  const currentPlan = plans.find(p => p.key === plan) ?? plans[0]

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-6">Předplatné</h1>

      {/* Current plan card */}
      <div
        className="bg-white rounded-2xl p-5 md:p-6 border-2 mb-8"
        style={{ borderColor: '#E8634A' }}
      >
        <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1">Aktuální plán</div>
        <div className="font-display font-extrabold text-2xl text-espresso mb-1">{currentPlan.name}</div>
        <div className="text-[#8B6550] font-semibold text-sm mb-3">{currentPlan.price}</div>
        <ul className="space-y-1.5">
          {currentPlan.features.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-[#2C1810]">
              <span className="text-[#2E9E8F]">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Plan comparison */}
      <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Dostupné plány</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map(p => {
          const isCurrent = p.key === plan
          return (
            <div
              key={p.key}
              className="bg-white rounded-2xl p-5 border-2 transition-all"
              style={{ borderColor: isCurrent ? '#E8634A' : '#F0EDE8' }}
            >
              {isCurrent && (
                <div
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold mb-3"
                  style={{ backgroundColor: '#FDEAE6', color: '#993C1D' }}
                >
                  Váš plán
                </div>
              )}
              <div className="font-display font-extrabold text-xl text-espresso mb-0.5">{p.name}</div>
              <div className="text-[#8B6550] font-semibold text-sm mb-4">{p.price}</div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#2C1810]">
                    <span className="text-[#2E9E8F]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Upgrade CTA */}
      <div className="bg-[#F5F0EC] rounded-2xl p-5 md:p-6 text-center">
        <div className="text-2xl mb-2">💌</div>
        <h3 className="font-display font-extrabold text-lg text-espresso mb-1">Chcete upgradovat?</h3>
        <p className="text-sm text-[#8B6550] mb-3">
          Kontaktujte nás a my vám pomůžeme vybrat ten správný plán.
        </p>
        <a
          href="mailto:info@zozio.cz"
          className="inline-flex items-center px-5 py-2.5 rounded-full font-bold text-sm text-white no-underline"
          style={{ backgroundColor: '#E8634A' }}
        >
          Napsat na info@zozio.cz
        </a>
      </div>
    </div>
  )
}
