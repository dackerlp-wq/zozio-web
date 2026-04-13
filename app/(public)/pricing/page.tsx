import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ceník | Zozio',
  description: 'Transparentní ceník pro útulky a záchranné stanice. Základní plán zdarma.',
}

const PLANS = [
  {
    id: 'free',
    name: 'Zdarma',
    price: 0,
    desc: 'Pro malé útulky a stanice začínající na Zozio.',
    color: 'var(--border)',
    textColor: 'var(--text-neutral)',
    btnStyle: { background: 'white', color: 'var(--text-primary)', border: '1px solid #E0DDD8' },
    features: [
      'Až 20 zvířat / případů',
      'Veřejný profil instituce',
      'Adopční žádosti',
      'Základní statistiky',
      '1 aktivní sbírka',
    ],
    missing: ['Neomezená zvířata', 'Prioritní zobrazení', 'Export dat', 'API přístup'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 790,
    desc: 'Pro aktivní útulky s pravidelným provozem.',
    color: 'var(--coral)',
    textColor: '#fff',
    featured: true,
    btnStyle: { background: 'var(--coral)', color: 'white' },
    features: [
      'Neomezená zvířata / případy',
      'Prioritní zobrazení v katalogu',
      'Neomezené sbírky',
      'Neomezení dobrovolníci',
      'Export dat (CSV)',
      'Pokročilé statistiky',
      'E-mailové notifikace',
    ],
    missing: ['API přístup', 'Vlastní doména'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1990,
    desc: 'Pro velké instituce s vysokým provozem.',
    color: 'var(--text-primary)',
    textColor: '#fff',
    btnStyle: { background: 'var(--text-primary)', color: 'white' },
    features: [
      'Vše ze Standard',
      'API přístup',
      'Vlastní doména',
      'Dedikovaná podpora',
      'SLA 99.9%',
      'Prioritní onboarding',
    ],
    missing: [],
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-20 bg-warm">

      {/* Header */}
      <section className="py-16 md:py-20 px-5 md:px-10 text-center">
        <div className="max-w-[700px] mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-coral">Ceník</p>
          <h1 className="font-display font-extrabold text-text-primary mb-4"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}>
            Transparentní ceny<br />bez překvapení
          </h1>
          <p className="text-lg text-text-muted">
            Začněte zdarma. Upgradujte až budete potřebovat víc.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-5 md:px-10">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <div key={plan.id} className={`rounded-2xl overflow-hidden border ${plan.featured ? 'border-coral' : 'border-border'}`}
              style={{ boxShadow: plan.featured ? '0 8px 32px rgba(232,99,74,0.15)' : undefined }}>

              {plan.featured && (
                <div className="text-center py-2 text-xs font-bold text-white bg-coral">
                  Nejoblíbenější
                </div>
              )}

              <div className="p-6 bg-white">
                <div className="mb-5">
                  <div className="font-display font-extrabold text-xl text-text-primary mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display font-extrabold text-4xl text-text-primary">
                      {plan.price === 0 ? 'Zdarma' : plan.price.toLocaleString('cs-CZ')}
                    </span>
                    {plan.price > 0 && <span className="text-sm font-medium text-text-muted">Kč / měs.</span>}
                  </div>
                  <p className="text-sm text-text-muted">{plan.desc}</p>
                </div>

                <Link href={`/auth/register?plan=${plan.id}`}>
                  <button className="w-full py-3 rounded-lg font-bold text-sm cursor-pointer border-none hover:opacity-90 transition-all mb-5"
                    style={plan.btnStyle as any}>
                    {plan.price === 0 ? 'Začít zdarma' : `Vybrat ${plan.name}`}
                  </button>
                </Link>

                <div className="space-y-2">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-base font-bold text-success-tag-text">✓</span>
                      <span className="text-text-primary">{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm opacity-35">
                      <span className="text-base">—</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-[700px] mx-auto mt-16">
          <h2 className="font-display font-extrabold text-2xl text-text-primary mb-8 text-center">Časté dotazy</h2>
          <div className="space-y-4">
            {[
              { q: 'Musím zadat kreditní kartu?', a: 'Ne. Základní plán je zcela zdarma bez kreditní karty.' },
              { q: 'Mohu kdykoli přejít na vyšší plán?', a: 'Ano, upgrade proběhne okamžitě. Platíte jen rozdíl za zbývající dny měsíce.' },
              { q: 'Jsou neziskové organizace zvýhodněny?', a: 'Ano. Registrované neziskové organizace a spolky dostanou 30% slevu. Napište nám.' },
              { q: 'Co se stane s daty pokud odejdu?', a: 'Vaše data vám patří. Export je možný kdykoli. Po ukončení je uchováváme 90 dní.' },
            ].map(({ q, a }) => (
              <div key={q} className="p-5 bg-white rounded-2xl border border-border">
                <div className="font-bold text-text-primary mb-1">{q}</div>
                <p className="text-sm text-text-muted">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
