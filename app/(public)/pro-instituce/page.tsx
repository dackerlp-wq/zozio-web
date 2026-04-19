import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Pro útulky | Zozio',
  description: 'Zozio je platforma pro správu útulků. Adopce, sbírky a dobrovolníci na jednom místě.',
}

const shelterFeatures = [
  { icon: '🐾', title: 'Adopční katalog', desc: 'Veřejné profily každého zvířete s fotkami, zdravotním stavem a povahou. Filtrovatelný katalog pro návštěvníky.' },
  { icon: '📋', title: 'Online žádosti', desc: 'Zájemci vyplní žádost přímo z webu. Vy ji schválíte nebo zamítnete z telefonu. Automatické e-maily.' },
  { icon: '💛', title: 'Sbírky', desc: 'Cílené sbírky pro konkrétní zvíře nebo projekt. Progress bar, sdílení na sítě, přehled dárců.' },
  { icon: '🙋', title: 'Dobrovolníci', desc: 'Registrace dobrovolníků s výběrem aktivit. Koordinace venčení a akcí přehledně na jednom místě.' },
]

const sharedFeatures = [
  { icon: '📊', title: 'Admin dashboard', desc: 'Mobilně responzivní přehled statistik a aktivit — funguje z telefonu kdekoli.' },
  { icon: '📍', title: 'Veřejný profil', desc: 'SEO-optimalizovaná stránka vaší instituce. Lidé vás najdou na Googlu.' },
  { icon: '✉️', title: 'E-mail notifikace', desc: 'Automatické e-maily při nové žádosti, změně stavu nebo registraci dobrovolníka.' },
  { icon: '📤', title: 'Export dat', desc: 'Exportujte zvířata, žádosti a dobrovolníky do CSV pro vlastní potřebu.' },
]

const plans = [
  {
    tier: 'Free', price: '0 Kč', period: 'navždy zdarma', hot: false,
    features: [
      'Do 20 zvířat / případů',
      'Veřejný profil instituce',
      'Adopční žádosti online',
      'Základní statistiky',
    ],
    missing: ['E-mail notifikace', 'Sbírky', 'Správa dobrovolníků', 'Export dat (CSV)', 'Newsletter'],
    cta: 'Začít zdarma', href: '/auth/register',
  },
  {
    tier: 'Standard', price: '490 Kč', period: 'měsíčně', hot: true,
    features: [
      'Neomezená zvířata / případy',
      'E-mail notifikace',
      'Neomezené sbírky',
      'Správa dobrovolníků',
      'Newsletter pro příznivce',
      'Export dat (CSV)',
      'Pokročilé statistiky',
      'Widget pro váš web',
    ],
    missing: ['Pobočky (více lokací)', 'Prioritní podpora'],
    cta: '14 dní zdarma →', href: '/auth/register',
  },
  {
    tier: 'Pro', price: '990 Kč', period: 'měsíčně', hot: false,
    features: [
      'Vše ze Standard',
      'Pobočky (více lokací)',
      'Prioritní zobrazení v katalogu',
      'Pokročilé reporty a export',
      'Onboarding asistence',
      'Prioritní podpora (SLA)',
    ],
    missing: [],
    cta: 'Kontaktovat nás', href: 'mailto:team@zozio.cz',
  },
]

export default function ProInstitucePage() {
  return (
    <main className="overflow-x-hidden">

      {/* Hero */}
      <section className="bg-espresso pt-24 md:pt-32 pb-16 md:pb-20 px-4 md:px-12 relative overflow-hidden">
        <div className="absolute top-1/2 right-[-60px] -translate-y-1/2 font-display font-extrabold text-[300px] text-white/[0.03] pointer-events-none leading-none">ZOZ</div>
        <div className="max-w-[900px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-coral/20 text-coral font-body text-xs font-bold px-4 py-2 rounded-pill mb-6">
            🏢 Pro útulky
          </div>
          <h1 className="font-display font-extrabold text-[clamp(32px,5vw,60px)] text-white leading-tight mb-5">
            Moderní správa útulku
          </h1>
          <p className="text-lg text-gray-light max-w-[600px] mx-auto leading-relaxed mb-8">
            Zozio dává útulkům nástroje pro správu adopcí, sbírek a dobrovolníků. Vše na jednom místě, bez papírování.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register">
              <Button variant="primary" size="lg" className="justify-center w-full sm:w-auto">Registrovat instituci zdarma</Button>
            </Link>
            <Link href="#cenik">
              <Button variant="sand" size="lg" className="justify-center w-full sm:w-auto">Zobrazit ceník</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Funkce pro útulky */}
      <section className="py-14 md:py-20 px-4 md:px-12 bg-warm">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">Funkce pro útulky</h2>
            <p className="text-base text-brown-mid mt-3 max-w-[500px] mx-auto">Vše co potřebujete pro správu útulku a adopce zvířat.</p>
          </div>

          <div className="bg-shelter-bg rounded-lg p-6 md:p-8 max-w-[700px] mx-auto">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="font-display font-extrabold text-2xl text-shelter-dark mb-2">Útulky</h3>
            <p className="font-display font-bold text-coral mb-3 text-sm">Zachraňme opuštěná zvířata</p>
            <p className="text-sm text-brown-mid leading-relaxed mb-6">
              Pro obecní i soukromé útulky pečující o psy, kočky, králíky a další domácí zvířata. Hlavní cíl: najít každému zvířeti nový domov.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {shelterFeatures.map(f => (
                <div key={f.title} className="bg-white rounded-md p-3">
                  <div className="text-xl mb-1">{f.icon}</div>
                  <div className="font-display font-bold text-sm text-espresso mb-0.5">{f.title}</div>
                  <div className="text-xs text-gray leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/auth/register">
              <Button variant="primary" className="w-full justify-center">Registrovat útulek</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sdílené funkce */}
      <section className="py-14 md:py-20 px-4 md:px-12 bg-cream">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">Vše na jednom místě</h2>
            <p className="text-base text-brown-mid mt-3 max-w-[500px] mx-auto">Silný základ pro každý útulek.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {sharedFeatures.map(f => (
              <div key={f.title} className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <div className="font-display font-extrabold text-base text-espresso mb-1.5">{f.title}</div>
                <div className="text-xs text-gray leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ceník */}
      <section id="cenik" className="py-14 md:py-20 px-4 md:px-12 bg-espresso relative overflow-hidden">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white">Transparentní ceník</h2>
            <p className="text-base text-gray-light mt-3 max-w-[480px] mx-auto">Začni zdarma. Plať jen když rosteš. Bez závazků, bez skrytých poplatků.</p>
            <Link href="/proc-byt-na-zozio" className="inline-block mt-4 text-sm text-coral hover:text-coral-light font-semibold">
              Podrobný přehled funkcí →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {plans.map(plan => (
              <div key={plan.tier} className={`relative rounded-lg p-6 border-2 transition-all
                ${plan.hot ? 'bg-coral border-coral sm:scale-[1.03] shadow-lg' : 'bg-white/5 border-white/10'}`}>
                {plan.hot && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber text-espresso font-display font-extrabold text-[11px] px-4 py-1 rounded-pill whitespace-nowrap">
                    ⭐ NEJOBLÍBENĚJŠÍ
                  </div>
                )}
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.hot ? 'text-white/75' : 'text-gray-light'}`}>{plan.tier}</div>
                <div className="font-display font-extrabold text-4xl text-white leading-none mb-1">{plan.price}</div>
                <div className={`text-xs mb-5 ${plan.hot ? 'text-white/70' : 'text-gray-light'}`}>{plan.period}</div>
                <div className={`h-px mb-4 ${plan.hot ? 'bg-white/30' : 'bg-white/10'}`} />
                <ul className="list-none space-y-2 mb-2">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.hot ? 'text-white/88' : 'text-gray-light'}`}>
                      <span className="text-amber">✓</span>{f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.hot ? 'text-white/40' : 'text-white/20'}`}>
                      <span>✗</span>{f}
                    </li>
                  ))}
                </ul>
                <div className={`h-px my-4 ${plan.hot ? 'bg-white/30' : 'bg-white/10'}`} />
                <Link href={plan.href}>
                  <button className={`w-full py-3 rounded-pill font-display font-extrabold text-sm cursor-pointer border-none transition-all
                    ${plan.hot ? 'bg-white text-coral-dark hover:bg-cream' : 'bg-white/10 text-white hover:bg-white/16'}`}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray">
            🏛️ Neziskové organizace a obecní útulky: <strong className="text-gray-light">30% sleva</strong> po ověření ·{' '}
            <a href="mailto:team@zozio.cz" className="text-coral hover:text-coral-light">team@zozio.cz</a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-20 px-4 md:px-12 bg-warm">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso text-center mb-10">Časté otázky</h2>
          <div className="space-y-4">
            {[
              { q: 'Jak dlouho trvá registrace?', a: 'Vyplnění registračního formuláře trvá 5 minut. Po odeslání tým Zozio instituci zkontroluje a schválí do 24 hodin.' },
              { q: 'Musím platit hned?', a: 'Ne. Free plán je zdarma navždy bez kreditní karty. Standard plán nabízíme 30 dní zdarma — platba začne až po uplynutí zkušební doby.' },
              { q: 'Mohu migrovat data ze starého systému?', a: 'Ano, pomůžeme vám s importem dat z Excelu nebo jiných systémů. Kontaktujte nás na team@zozio.cz.' },
              { q: 'Funguje Zozio na telefonu?', a: 'Ano, admin panel je plně mobilně responzivní. Schvalovat žádosti, přidávat zvířata nebo spravovat dobrovolníky lze přímo z telefonu.' },
              { q: 'Co když jsem nezisková organizace?', a: 'Neziskové organizace a obecní útulky získávají 30% slevu na Standard a Pro plán. Stačí po registraci doložit potvrzení o neziskové činnosti.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-lg p-5 border border-gray-pale">
                <div className="font-display font-bold text-base text-espresso mb-2">{q}</div>
                <div className="text-sm text-brown-mid leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 px-4 md:px-12 bg-coral text-center relative overflow-hidden">
        <div className="hidden md:block absolute top-1/2 left-[-50px] -translate-y-1/2 font-display font-extrabold text-[240px] text-white/[0.07] pointer-events-none leading-none">SOS</div>
        <div className="hidden md:block absolute top-1/2 right-[-40px] -translate-y-1/2 font-display font-extrabold text-[240px] text-white/[0.07] pointer-events-none leading-none">ZOZ</div>
        <div className="relative z-10 max-w-[600px] mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-4">Připraveni začít?</h2>
          <p className="text-base text-white/82 mb-8">Registrace je zdarma a trvá 5 minut. Bez kreditní karty.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register">
              <Button variant="dark" size="lg" className="justify-center w-full sm:w-auto">Registrovat instituci zdarma</Button>
            </Link>
            <a href="mailto:team@zozio.cz">
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-[17px] rounded-pill font-display font-bold text-base text-white border-2 border-white/40 bg-white/20 hover:bg-white/30 transition-all cursor-pointer">
                Napsat nám
              </button>
            </a>
          </div>
        </div>
      </section>

    </main>
  )
}
