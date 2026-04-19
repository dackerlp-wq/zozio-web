import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { SubscriptionPlan } from '@/types/database'
import {
  PLAN_NAMES, PLAN_PRICES, PLAN_EMOJI,
  effectivePlan, isPlanActive,
} from '@/lib/plans'

export const metadata = { title: 'Předplatné — Zozio Admin' }

// Kompletní seznam funkcí pro srovnávací tabulku
const ALL_ROWS: { label: string; free: string | boolean; standard: string | boolean; pro: string | boolean }[] = [
  { label: 'Zvířata v databázi',         free: 'Do 20',          standard: 'Neomezeno',      pro: 'Neomezeno' },
  { label: 'Veřejný profil útulku',      free: true,             standard: true,             pro: true },
  { label: 'Adopční žádosti',            free: true,             standard: true,             pro: true },
  { label: 'Základní statistiky',        free: true,             standard: true,             pro: true },
  { label: 'E-mail notifikace',          free: false,            standard: true,             pro: true },
  { label: 'Sbírky (Darujme.cz)',        free: false,            standard: 'Neomezené',      pro: 'Neomezené' },
  { label: 'Správa dobrovolníků',        free: false,            standard: true,             pro: true },
  { label: 'Newsletter pro odběratele',  free: false,            standard: true,             pro: true },
  { label: 'Export CSV',                 free: false,            standard: true,             pro: true },
  { label: 'Pokročilé statistiky',       free: false,            standard: true,             pro: true },
  { label: 'Embed widget pro web',       free: false,            standard: true,             pro: true },
  { label: 'Správa poboček',             free: false,            standard: false,            pro: true },
  { label: 'Prioritní zobrazení',        free: false,            standard: false,            pro: true },
  { label: 'Pokročilé reporty',          free: false,            standard: false,            pro: true },
  { label: 'Onboarding asistence',       free: false,            standard: false,            pro: true },
  { label: 'Prioritní podpora (SLA)',    free: false,            standard: false,            pro: true },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <span className="text-[#2E9E8F] font-bold text-base">✓</span>
  if (value === false) return <span className="text-[#C9B8AD]">—</span>
  return <span className="text-sm font-semibold text-espresso">{value}</span>
}

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
    .select('id, name, plan, plan_expires_at')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const rawPlan     = (institution as any).plan as SubscriptionPlan ?? 'free'
  const expiresAt   = (institution as any).plan_expires_at as string | null
  const activePlan  = effectivePlan(rawPlan, expiresAt)
  const active      = isPlanActive(rawPlan, expiresAt)

  const expDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const plans: SubscriptionPlan[] = ['free', 'standard', 'pro']

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-2">Předplatné</h1>
      <p className="text-sm text-[#8B6550] mb-8">Spravujte plán instituce a přístup k funkcím.</p>

      {/* ── Aktuální plán ── */}
      <div
        className="bg-white rounded-2xl p-5 md:p-6 border-2 mb-8 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ borderColor: '#E8634A' }}
      >
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: '#FAECE7' }}>
          {PLAN_EMOJI[activePlan]}
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-0.5">Aktuální plán</div>
          <div className="font-display font-extrabold text-2xl text-espresso">{PLAN_NAMES[activePlan]}</div>
          {activePlan !== 'free' && expDate && (
            <div className={`text-xs mt-1 font-semibold ${active ? 'text-[#2E9E8F]' : 'text-coral'}`}>
              {active ? `Platné do ${expDate}` : `Vypršelo ${expDate} — degradováno na Free`}
            </div>
          )}
          {activePlan === 'free' && (
            <div className="text-xs mt-1 text-[#8B6550]">Zdarma navždy · do 20 zvířat</div>
          )}
        </div>
        {activePlan !== 'pro' && (
          <a
            href="mailto:team@zozio.cz?subject=Zájem o upgrade plánu"
            className="inline-flex items-center px-5 py-2.5 rounded-full font-bold text-sm text-white no-underline transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: '#E8634A' }}
          >
            Upgradovat
          </a>
        )}
      </div>

      {/* ── Srovnání plánů — karty ── */}
      <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Dostupné plány</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {plans.map(p => {
          const isCurrent = p === activePlan
          return (
            <div
              key={p}
              className="bg-white rounded-2xl p-5 border-2 flex flex-col"
              style={{ borderColor: isCurrent ? '#E8634A' : '#F0EDE8' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{PLAN_EMOJI[p]}</span>
                <div>
                  {isCurrent && (
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: '#E8634A' }}>Váš plán</div>
                  )}
                  <div className="font-display font-extrabold text-xl text-espresso leading-none">{PLAN_NAMES[p]}</div>
                </div>
              </div>
              <div className="font-bold text-sm text-[#8B6550] mb-4">{PLAN_PRICES[p]}</div>
              {!isCurrent && p !== 'free' && (
                <a
                  href={`mailto:team@zozio.cz?subject=Zájem o plán ${PLAN_NAMES[p]}`}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full font-bold text-sm no-underline border mt-auto transition-colors hover:bg-[#FAECE7]"
                  style={{ color: '#E8634A', borderColor: '#E8634A' }}
                >
                  Vybrat {PLAN_NAMES[p]}
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Srovnávací tabulka ── */}
      <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Srovnání plánů</h2>
      <div className="bg-white rounded-2xl border overflow-hidden mb-10" style={{ borderColor: '#F0EDE8' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F0EDE8' }}>
                <th className="text-left px-4 py-3 text-xs font-bold text-[#8B6550] uppercase tracking-wider w-1/2">Funkce</th>
                {plans.map(p => (
                  <th key={p} className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider"
                    style={{ color: p === activePlan ? '#E8634A' : '#8B6550' }}>
                    {PLAN_NAMES[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  style={{
                    background: i % 2 === 0 ? '#FFFFFF' : '#FFFCF8',
                    borderBottom: '1px solid #F0EDE8',
                  }}
                >
                  <td className="px-4 py-3 text-espresso font-medium">{row.label}</td>
                  <td className="px-4 py-3 text-center"><Cell value={row.free} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={row.standard} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CTA ── */}
      <div
        className="rounded-2xl p-6 md:p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #2C1810 0%, #4A2E20 100%)' }}
      >
        <div className="text-3xl mb-3">💌</div>
        <h3 className="font-display font-extrabold text-xl text-white mb-2">Chcete upgradovat nebo se zeptat?</h3>
        <p className="text-sm text-[#C9B8AD] mb-5 max-w-[400px] mx-auto">
          Napište nám a my vám pomůžeme vybrat plán na míru vaší instituci.
        </p>
        <a
          href="mailto:team@zozio.cz?subject=Zájem o upgrade plánu"
          className="inline-flex items-center px-6 py-3 rounded-full font-bold text-sm no-underline transition-opacity hover:opacity-90"
          style={{ background: '#E8634A', color: '#fff' }}
        >
          Napsat na team@zozio.cz
        </a>
      </div>
    </div>
  )
}
