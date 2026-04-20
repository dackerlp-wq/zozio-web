import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SendDigestButton } from './SendDigestButton'
import { UpgradePrompt } from '@/components/admin/UpgradePrompt'
import { hasFeature } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

export default async function AdminNewsletterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/admin/dashboard')

  // ── Plan gate ──
  const { data: instPlan } = await service
    .from('institutions')
    .select('plan, plan_expires_at')
    .eq('id', membership.institution_id)
    .single()

  if (!hasFeature(
    (instPlan as any)?.plan as SubscriptionPlan ?? 'free',
    (instPlan as any)?.plan_expires_at ?? null,
    'newsletter'
  )) {
    return <UpgradePrompt feature="newsletter" />
  }

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, newsletter_week_sent_at, newsletter_month_sent_at')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  // Odběratelé
  const { data: subscribers } = await service
    .from('newsletter_subscribers')
    .select('id, email, name, subscribed_at')
    .eq('institution_id', institution.id)
    .order('subscribed_at', { ascending: false })

  const list = subscribers ?? []

  // Preview dat za týden
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoIso = weekAgo.toISOString()

  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)
  const monthAgoIso = monthAgo.toISOString()

  const [weekAnimals, monthAnimals] = await Promise.all([
    service.from('animals').select('id', { count: 'exact', head: true }).eq('institution_id', institution.id).gte('created_at', weekAgoIso),
    service.from('animals').select('id', { count: 'exact', head: true }).eq('institution_id', institution.id).gte('created_at', monthAgoIso),
  ])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/dashboard" className="text-sm text-gray hover:text-coral transition-colors font-semibold">← Zpět</a>
      </div>

      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-2">Newsletter</h1>
      <p className="text-gray font-semibold mb-8">{list.length} odběratelů novinek {institution.name}</p>

      {/* Odeslat digest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <div className="bg-white rounded-xl border-2 border-gray-pale p-6 hover:border-coral transition-colors">
          <div className="text-3xl mb-3">📅</div>
          <h2 className="font-display font-bold text-lg text-espresso mb-1">Novinky za týden</h2>
          <p className="text-sm text-gray mb-4">
            {weekAnimals.count ?? 0} nových zvířat · odešle se {list.length} lidem
          </p>
          <SendDigestButton
            institutionId={institution.id}
            period="week"
            subscriberCount={list.length}
            label="Odeslat za poslední týden"
            lastSentAt={(institution as any).newsletter_week_sent_at ?? null}
          />
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-pale p-6 hover:border-coral transition-colors">
          <div className="text-3xl mb-3">🗓️</div>
          <h2 className="font-display font-bold text-lg text-espresso mb-1">Novinky za měsíc</h2>
          <p className="text-sm text-gray mb-4">
            {monthAnimals.count ?? 0} nových zvířat · odešle se {list.length} lidem
          </p>
          <SendDigestButton
            institutionId={institution.id}
            period="month"
            subscriberCount={list.length}
            label="Odeslat za poslední měsíc"
            lastSentAt={(institution as any).newsletter_month_sent_at ?? null}
          />
        </div>
      </div>

      {/* Tabulka odběratelů */}
      <h2 className="font-display font-bold text-xl text-espresso mb-4">Odběratelé</h2>
      <div className="bg-white rounded-xl border border-gray-pale shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-pale">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">#</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">E-mail</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">Jméno</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">Přihlášen</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray text-sm">
                  Zatím žádní odběratelé.<br />
                  <span className="text-xs">Sdílej odkaz na svůj profil — na stránce Kontakt mohou návštěvníci odebírat novinky.</span>
                </td>
              </tr>
            ) : (
              list.map((sub, i) => (
                <tr key={sub.id} className="border-b border-gray-pale last:border-b-0 hover:bg-gray-pale/30 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-gray font-semibold">{i + 1}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-espresso">{sub.email}</td>
                  <td className="px-5 py-3.5 text-sm text-gray">{sub.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray">
                    {new Date(sub.subscribed_at).toLocaleDateString('cs-CZ')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
