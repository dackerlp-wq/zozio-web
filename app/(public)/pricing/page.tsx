import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Ceník | Zozio',
  description: 'Transparentní ceník pro útulky a záchranné stanice.',
}

const plans = [
  {
    tier: 'Free',
    price: '0 Kč',
    period: 'navždy zdarma',
    hot: false,
    features: [
      { ok: true,  text: 'Do 15 zvířat / pacientů' },
      { ok: true,  text: 'Veřejný profil instituce' },
      { ok: true,  text: 'Adopční / příjmový formulář' },
      { ok: false, text: 'E-mail notifikace' },
      { ok: false, text: 'Sbírky' },
      { ok: false, text: 'Dobrovolníci' },
    ],
    cta: 'Začít zdarma',
    href: '/auth/register',
  },
  {
    tier: 'Standard',
    price: '490 Kč',
    period: 'měsíčně · bez závazků',
    hot: true,
    features: [
      { ok: true,  text: 'Neomezená zvířata' },
      { ok: true,  text: 'E-mail notifikace' },
      { ok: true,  text: '1 aktivní sbírka' },
      { ok: true,  text: 'Správa dobrovolníků' },
      { ok: true,  text: 'Export dat (CSV)' },
      { ok: false, text: 'Více poboček' },
    ],
    cta: '30 dní zdarma',
    href: '/auth/register',
  },
  {
    tier: 'Pro',
    price: '990 Kč',
    period: 'měsíčně · bez závazků',
    hot: false,
    features: [
      { ok: true, text: 'Vše ze Standard' },
      { ok: true, text: 'Neomezené sbírky' },
      { ok: true, text: 'Až 5 poboček' },
      { ok: true, text: 'Statistiky & analytika' },
      { ok: true, text: 'Prioritní podpora' },
      { ok: true, text: 'Prioritní zobrazení' },
    ],
    cta: 'Kontaktovat nás',
    href: 'mailto:info@zozio.cz',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-warm pt-24 pb-20">
      <div className="max-w-250 mx-auto px-6">

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
            💰 Ceník
          </span>
          <h1 className="font-display font-extrabold text-5xl text-espresso mb-3">
            Féroví pro útulky<br />i záchranné stanice
          </h1>
          <p className="text-lg text-brown-mid max-w-120 mx-auto leading-relaxed">
            Začni zdarma. Plať jen když rosteš. Bez závazků, bez skrytých poplatků.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-10">
          {plans.map(plan => (
            <div key={plan.tier} className={`rounded-lg p-7 border-2 transition-all relative
              ${plan.hot
                ? 'bg-coral border-coral text-white shadow-lg scale-[1.03]'
                : 'bg-white border-gray-pale'
              }`}>
              {plan.hot && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber text-espresso font-display font-extrabold text-[11px] px-4 py-1 rounded-pill whitespace-nowrap">
                  ⭐ NEJOBLÍBENĚJŠÍ
                </div>
              )}
              <div className={`text-xs font-bold uppercase tracking-widest mb-2.5 ${plan.hot ? 'text-white/75' : 'text-gray'}`}>
                {plan.tier}
              </div>
              <div className={`font-display font-extrabold text-4xl mb-1 ${plan.hot ? 'text-white' : 'text-espresso'}`}>
                {plan.price}
              </div>
              <div className={`text-xs mb-5 ${plan.hot ? 'text-white/70' : 'text-gray'}`}>{plan.period}</div>
              <div className={`h-px mb-4 ${plan.hot ? 'bg-white/30' : 'bg-gray-pale'}`} />
              <ul className="list-none space-y-2.5 mb-6">
                {plan.features.map(({ ok, text }) => (
                  <li key={text} className={`flex items-center gap-2.5 text-sm ${plan.hot ? 'text-white/88' : 'text-brown-mid'}`}>
                    <span className={ok ? 'text-amber font-bold' : plan.hot ? 'text-white/25' : 'text-gray-light'}>
                      {ok ? '✓' : '✗'}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <button className={`w-full py-3 rounded-pill font-display font-extrabold text-sm transition-all cursor-pointer
                  ${plan.hot
                    ? 'bg-white text-coral-dark hover:bg-cream'
                    : 'bg-espresso text-white hover:bg-brown'
                  }`}>
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray">
            🏛️ Neziskové organizace a obecní útulky: <strong>30% sleva</strong> po ověření.
            Napiš nám na{' '}
            <a href="mailto:info@zozio.cz" className="text-coral hover:text-coral-dark transition-colors font-semibold">
              info@zozio.cz
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
