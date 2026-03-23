import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'

export const metadata: Metadata = {
  title: 'Zozio — Zachraňme zvířata',
  description: 'Platforma pro útulky a záchranné stanice v ČR a SR. Lidé volají SOS — zvířata volají ZOZ.',
}

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <MissionStrip />
      <SegmentSplit />
      <FeaturesSection />
      <AdoptSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  )
}

/* ── HERO ── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-[110px] pb-20 px-12 bg-warm overflow-hidden">

      {/* Blob animace */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[580px] h-[580px] rounded-full bg-coral opacity-30 -top-36 -right-20 blur-[80px]"
          style={{ animation: 'blobFloat 8s ease-in-out infinite' }} />
        <div className="absolute w-[380px] h-[380px] rounded-full bg-amber opacity-25 -bottom-24 right-44 blur-[80px]"
          style={{ animation: 'blobFloat 10s ease-in-out infinite reverse' }} />
        <div className="absolute w-[280px] h-[280px] rounded-full opacity-20 blur-[80px]"
          style={{ background: 'var(--terra-light)', top: '45%', left: '32%', animation: 'blobFloat 12s ease-in-out infinite 2s' }} />
      </div>

      {/* Tlapkový vzor */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236B3F1F'%3E%3Cellipse cx='20' cy='15' rx='5' ry='6'/%3E%3Cellipse cx='35' cy='12' rx='4' ry='5'/%3E%3Cellipse cx='10' cy='25' rx='4' ry='5'/%3E%3Cellipse cx='45' cy='22' rx='4' ry='5'/%3E%3Cellipse cx='28' cy='35' rx='12' ry='10'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }} />

      <div className="relative z-10 max-w-[1200px] mx-auto w-full grid grid-cols-2 gap-20 items-center">

        {/* Levá strana — text */}
        <div>
          {/* SOS → ZOZ signal */}
          <div className="inline-flex items-center gap-2.5 mb-7"
            style={{ animation: 'fadeUp .5s ease both' }}>
            <span className="font-display font-extrabold text-xs tracking-[.14em] px-3.5 py-1.5 rounded-lg bg-gray-pale text-gray">SOS</span>
            <span className="text-gray text-base">→</span>
            <span className="font-display font-extrabold text-xs tracking-[.14em] px-3.5 py-1.5 rounded-lg bg-coral text-white">ZOZ</span>
            <span className="text-sm font-semibold text-gray">Lidé volají SOS — zvířata volají ZOZ</span>
          </div>

          <h1 className="font-display font-extrabold text-[clamp(44px,5vw,66px)] leading-[1.05] text-espresso mb-5"
            style={{ animation: 'fadeUp .5s ease .1s both' }}>
            Každé zvíře<br />
            volá o{' '}
            <span className="text-coral relative inline-block">
              pomoc
              <span className="absolute bottom-1 left-0 right-0 h-1.5 bg-amber opacity-50 rounded-full -z-10" />
            </span>
            .<br />
            Ty ji můžeš dát.
          </h1>

          <p className="text-lg leading-relaxed text-brown-mid mb-10 max-w-[480px]"
            style={{ animation: 'fadeUp .5s ease .2s both' }}>
            Zozio propojuje útulky, záchranné stanice a lidi, kteří chtějí pomoci.
            Adopce, léčba, sbírky, dobrovolníci — vše na jednom místě.
          </p>

          <div className="flex gap-3.5 flex-wrap" style={{ animation: 'fadeUp .5s ease .3s both' }}>
            <Button variant="primary" size="lg">
              <Link href="/adopt" className="no-underline text-inherit">🏠 Opuštěná zvířata</Link>
            </Button>
            <Button variant="rescue" size="lg">
              <Link href="/rescue" className="no-underline text-inherit">🚑 Ohrožená zvířata</Link>
            </Button>
          </div>

          {/* Proof čísla */}
          <div className="flex gap-9 mt-12" style={{ animation: 'fadeUp .5s ease .4s both' }}>
            {[
              { num: '700+',   label: 'Institucí v CZ/SK' },
              { num: '12 400', label: 'Zvířat ročně' },
              { num: 'Zdarma', label: 'Základní plán' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="font-display font-extrabold text-[26px] text-espresso">{num}</div>
                <div className="text-xs font-semibold text-gray">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pravá strana — mock UI */}
        <div className="relative" style={{ animation: 'fadeUp .5s ease .15s both' }}>

          {/* Floating chips */}
          <div className="absolute -top-5 -right-6 z-10 bg-white rounded-2xl px-4 py-2.5 shadow-md flex items-center gap-2 font-body text-sm font-bold text-espresso"
            style={{ animation: 'chipFloat 4s ease-in-out infinite' }}>
            <span className="text-success">✓</span> Max adoptován! 🎉
          </div>
          <div className="absolute z-10 bg-white rounded-2xl px-4 py-2.5 shadow-md flex items-center gap-2 font-body text-sm font-bold text-espresso"
            style={{ bottom: '82px', left: '-26px', animation: 'chipFloat 5s ease-in-out infinite 1.5s' }}>
            🔔 3 nové žádosti o adopci
          </div>
          <div className="absolute -bottom-5 right-11 z-10 bg-white rounded-2xl px-4 py-2.5 shadow-md flex items-center gap-2 font-body text-sm font-bold text-espresso"
            style={{ animation: 'chipFloat 3.5s ease-in-out infinite .8s' }}>
            🚑 Výr propuštěn do přírody
          </div>

          {/* Karta zvířete */}
          <div className="relative z-[2] bg-white rounded-lg p-6 shadow-lg">
            <div className="w-full h-[220px] rounded-md bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-[96px] mb-4 relative overflow-hidden">
              🐕
            </div>
            <div className="flex justify-between items-start mb-2.5">
              <div>
                <div className="font-display font-extrabold text-xl text-espresso">Buddy</div>
                <div className="text-xs text-gray">Pes · Kříženec · 2 roky · Praha</div>
              </div>
              <Badge variant="available" />
            </div>
            <div className="flex gap-1.5 flex-wrap mb-4">
              <Tag label="Kastrovaný" variant="green" />
              <Tag label="Miluje děti" variant="coral" />
              <Tag label="Hravý" variant="amber" />
            </div>
            <Button variant="primary" className="w-full justify-center">
              Adoptovat Buddyho
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── MISSION STRIP ── */
function MissionStrip() {
  const steps = [
    { icon: '🆘', text: 'Zvíře potřebuje pomoc' },
    { icon: '📋', text: 'Instituce ho zaeviduje' },
    { icon: '🔍', text: 'Ty ho najdeš nebo podpoříš' },
    { icon: '🏠', text: 'Zvíře najde domov nebo svobodu' },
    { icon: '❤️', text: 'ZOZ byl vyslyšen.' },
  ]

  return (
    <div className="relative bg-espresso px-12 py-11 flex items-center justify-center gap-0 flex-wrap overflow-hidden">
      <div className="absolute font-display font-extrabold text-[320px] text-white/[0.03] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none leading-none">
        ZOZ
      </div>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-2 text-center px-8">
            <span className="text-3xl">{step.icon}</span>
            <span className="font-display font-bold text-sm text-white max-w-[130px] leading-snug">{step.text}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-px h-14 bg-white/10" />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── SEGMENT SPLIT ── */
function SegmentSplit() {
  return (
    <div className="grid grid-cols-2">

      {/* Útulky */}
      <div className="bg-shelter-bg px-14 py-20">
        <div className="text-5xl mb-5">🏠</div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-shelter-bg text-shelter-dark font-body text-xs font-bold border border-shelter/30 mb-4">
          🏠 Útulky
        </span>
        <h2 className="font-display font-extrabold text-[34px] leading-tight text-shelter-dark mb-2">
          Zachraňme<br />opuštěná zvířata
        </h2>
        <p className="font-display font-bold text-base text-coral mb-3">
          Psi, kočky, králíci — čekají na domov
        </p>
        <p className="text-sm leading-relaxed text-brown-mid mb-6">
          Obecní i soukromé útulky pečující o nalezená a opuštěná zvířata.
          ZOZ jim dává nástroje, aby každé zvíře našlo milující rodinu.
        </p>
        <div className="bg-white rounded-md px-4 py-3.5 mb-6 border-l-4 border-coral">
          <p className="text-xs text-brown-mid leading-relaxed">
            <strong className="font-display">Typická zvířata:</strong> psi, kočky, králíci, hlodavci, ptáci<br />
            <strong className="font-display">Hlavní cíl:</strong> Adopce — najít zvířeti trvalý domov
          </p>
        </div>
        <ul className="list-none mb-7 space-y-2.5">
          {[
            ['🐾', 'Adopční katalog s filtry a veřejným profilem'],
            ['📋', 'Online žádosti o adopci + workflow schvalování'],
            ['💛', 'Sbírky na krmivo, veterináře a vybavení'],
            ['🙋', 'Koordinace dobrovolníků — venčení, socializace'],
            ['📅', 'Adopční dny a eventy'],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-start gap-2.5 text-sm font-semibold text-espresso">
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
        <Button variant="primary">
          <Link href="/auth/register?type=shelter" className="no-underline text-inherit">
            Registrovat útulok →
          </Link>
        </Button>
      </div>

      {/* Záchranné stanice */}
      <div className="bg-rescue-bg px-14 py-20">
        <div className="text-5xl mb-5">🚑</div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-rescue-bg text-rescue-dark font-body text-xs font-bold border border-rescue/30 mb-4">
          🚑 Záchranné stanice
        </span>
        <h2 className="font-display font-extrabold text-[34px] leading-tight text-rescue-dark mb-2">
          Zachraňme<br />ohrožená zvířata
        </h2>
        <p className="font-display font-bold text-base text-rescue mb-3">
          Sovy, lišky, vydry — potřebují léčbu
        </p>
        <p className="text-sm leading-relaxed text-brown-mid mb-6">
          Záchranné stanice léčí zraněná volně žijící zvířata.
          Cílem není adopce — ale uzdravení a návrat do přírody.
        </p>
        <div className="bg-white rounded-md px-4 py-3.5 mb-6 border-l-4 border-rescue">
          <p className="text-xs text-brown-mid leading-relaxed">
            <strong className="font-display">Typická zvířata:</strong> sovy, ježci, lišky, srny, vydry, netopýři<br />
            <strong className="font-display">Hlavní cíl:</strong> Rehabilitace a návrat do přírody
          </p>
        </div>
        <ul className="list-none mb-7 space-y-2.5">
          {[
            ['🦉', 'Evidence pacientů — příjem, léčba, propuštění'],
            ['🩺', 'Veterinární záznamy a průběh rehabilitace'],
            ['💛', 'Sbírky na léčbu konkrétních zvířat'],
            ['🙋', 'Dobrovolníci — transport, krmení, péče'],
            ['📊', 'Statistiky záchran a úspěšnosti léčby'],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-start gap-2.5 text-sm font-semibold text-espresso">
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
        <Button variant="rescue">
          <Link href="/auth/register?type=rescue_station" className="no-underline text-inherit">
            Registrovat záchrannou stanici →
          </Link>
        </Button>
      </div>
    </div>
  )
}

/* ── FEATURES ── */
function FeaturesSection() {
  const features = [
    { icon: '🐾', color: 'bg-coral-light', title: 'Profily zvířat', desc: 'Útulky mají adopční profily, záchranné stanice evidenci pacientů. Fotky, historie, zdravotní stav — vše přehledně.' },
    { icon: '📋', color: 'bg-amber-light', title: 'Správa žádostí', desc: 'Adopční žádosti pro útulky, příjem zvířete pro záchranné stanice. Workflow přizpůsobený každému typu.' },
    { icon: '💛', color: 'bg-rescue-bg',   title: 'Sbírky & dárci', desc: 'Cílené sbírky pro konkrétní zvíře nebo projekt. Progress bar, sdílení, přehled dárců v adminu.' },
    { icon: '🙋', color: 'bg-sand',        title: 'Dobrovolníci', desc: 'Registrace, správa dostupnosti a aktivit. Pro útulky venčení, pro záchranné stanice transport.' },
    { icon: '📊', color: 'bg-terra-light', title: 'Admin dashboard', desc: 'Přehledný panel přizpůsobený typu instituce. Mobilně responzivní — funguje z telefonu kdykoli.' },
    { icon: '📍', color: 'bg-amber-light', title: 'Veřejný adresář', desc: 'Mapa útulků a záchranných stanic. SEO stránky — lidé vás najdou na Googlu snadno a rychle.' },
  ]

  return (
    <section className="py-24 px-12 bg-cream">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
          ✨ Sdílené funkce
        </span>
        <h2 className="font-display font-extrabold text-[clamp(30px,4vw,46px)] text-espresso mb-3 leading-tight">
          Vše co útulky i záchranné<br />stanice skutečně potřebují
        </h2>
        <p className="text-base text-brown-mid max-w-[520px] mx-auto leading-relaxed">
          Obě instituce sdílejí silný základ — admin panel, sbírky, dobrovolníky a veřejný profil.
        </p>
      </div>

      <div className="max-w-[1100px] mx-auto grid grid-cols-3 gap-5">
        {features.map(({ icon, color, title, desc }) => (
          <div key={title}
            className="bg-white rounded-lg p-7 shadow-sm border-2 border-transparent hover:border-coral-light hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
            <div className={`w-14 h-14 ${color} rounded-[18px] flex items-center justify-center text-2xl mb-4`}>
              {icon}
            </div>
            <h3 className="font-display font-extrabold text-[19px] text-espresso mb-2">{title}</h3>
            <p className="text-sm text-gray leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── ADOPT SECTION ── */
function AdoptSection() {
  const animals = [
    {
      emoji: '🐕',
      bg: 'from-sand to-coral-light',
      urgent: true,
      type: 'shelter',
      name: 'Max',
      meta: 'Pes · 3 roky · Praha 6 · Opuštěný',
      tags: [{ label: 'Kastrovaný', variant: 'green' as const }, { label: 'Miluje děti', variant: 'coral' as const }],
      btn: 'primary' as const,
      btnLabel: 'Adoptovat Maxe',
    },
    {
      emoji: '🐱',
      bg: 'from-amber-light to-sand',
      urgent: false,
      type: 'shelter',
      name: 'Luna',
      meta: 'Kočka · 1 rok · Brno · Opuštěná',
      tags: [{ label: 'Sterilizovaná', variant: 'green' as const }, { label: 'Hravá', variant: 'amber' as const }],
      btn: 'primary' as const,
      btnLabel: 'Adoptovat Lunu',
    },
    {
      emoji: '🦉',
      bg: 'from-rescue-bg to-rescue-light/50',
      urgent: false,
      type: 'rescue',
      name: 'Výr č. 24',
      meta: 'Výr velký · 12. 3. · Jihočeský kraj',
      tags: [{ label: 'Zlomené křídlo', variant: 'rescue' as const }, { label: '6 týdnů', variant: 'amber' as const }],
      btn: 'rescue' as const,
      btnLabel: 'Podpořit léčbu',
    },
  ]

  return (
    <section className="py-24 px-12 bg-warm">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
          🐾 Právě čekají
        </span>
        <h2 className="font-display font-extrabold text-[clamp(30px,4vw,46px)] text-espresso mb-3 leading-tight">
          Jejich ZOZ čeká<br />na tvoji odpověď
        </h2>
        <p className="text-base text-brown-mid max-w-[520px] mx-auto leading-relaxed">
          Opuštěná i ohrožená zvířata z celé České republiky a Slovenska.
        </p>
      </div>

      <div className="max-w-[1100px] mx-auto grid grid-cols-3 gap-5">
        {animals.map((a) => (
          <div key={a.name}
            className={`bg-white rounded-lg overflow-hidden shadow-md hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 ${a.type === 'rescue' ? 'border-t-[3px] border-rescue' : ''}`}>
            <div className={`relative h-48 bg-gradient-to-br ${a.bg} flex items-center justify-center text-[80px]`}>
              {a.emoji}
              {a.urgent && <Badge variant="urgent" className="absolute top-3 left-3" />}
              {a.type === 'rescue'
                ? <Badge variant="rescue" className="absolute top-3 left-3" />
                : null
              }
              <span className={`absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[10px] font-bold
                ${a.type === 'shelter' ? 'bg-shelter-bg text-shelter-dark' : 'bg-rescue-bg text-rescue-dark'}`}>
                {a.type === 'shelter' ? '🏠 Útulok' : '🚑 Záchranná st.'}
              </span>
            </div>
            <div className="p-5">
              <div className="font-display font-extrabold text-xl text-espresso mb-0.5">{a.name}</div>
              <div className="text-xs text-gray mb-3">{a.meta}</div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {a.tags.map(t => <Tag key={t.label} label={t.label} variant={t.variant} />)}
              </div>
              <Button variant={a.btn} className="w-full justify-center">{a.btnLabel}</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3.5 justify-center mt-11 flex-wrap">
        <Button variant="ghost">
          <Link href="/adopt" className="no-underline text-inherit">🏠 Opuštěná zvířata →</Link>
        </Button>
        <Button variant="ghost-rescue">
          <Link href="/rescue" className="no-underline text-inherit">🚑 Záchranné stanice →</Link>
        </Button>
      </div>
    </section>
  )
}

/* ── PRICING ── */
function PricingSection() {
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
      btnLabel: 'Začít zdarma',
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
      btnLabel: '30 dní zdarma →',
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
      btnLabel: 'Kontaktovat nás',
    },
  ]

  return (
    <section className="relative py-24 px-12 bg-espresso overflow-hidden">
      <div className="absolute top-1/2 right-[-60px] -translate-y-1/2 font-display font-extrabold text-[300px] text-white/[0.03] pointer-events-none leading-none">
        ZOZ
      </div>

      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 bg-coral/20 text-coral font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
          💰 Ceník
        </span>
        <h2 className="font-display font-extrabold text-[clamp(30px,4vw,46px)] text-white mb-3 leading-tight">
          Féroví pro útulky<br />i záchranné stanice
        </h2>
        <p className="text-base text-gray-light max-w-[520px] mx-auto leading-relaxed">
          Začni zdarma. Plať jen když rosteš. Bez závazků, bez skrytých poplatků.
        </p>
      </div>

      <div className="max-w-[960px] mx-auto grid grid-cols-3 gap-4 items-start">
        {plans.map((plan) => (
          <div key={plan.tier}
            className={`relative rounded-lg p-7 transition-all duration-300
              ${plan.hot
                ? 'bg-coral border border-coral scale-[1.04] hover:scale-[1.04] hover:-translate-y-1'
                : 'bg-white/5 border border-white/10 hover:bg-white/8 hover:-translate-y-1'
              }`}>

            {plan.hot && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber text-espresso font-display font-extrabold text-[11px] px-4 py-1 rounded-pill whitespace-nowrap tracking-wider">
                ⭐ NEJOBLÍBENĚJŠÍ
              </div>
            )}

            <div className={`text-xs font-bold uppercase tracking-widest mb-2.5 ${plan.hot ? 'text-white/75' : 'text-gray-light'}`}>
              {plan.tier}
            </div>
            <div className="font-display font-extrabold text-[44px] text-white leading-none mb-1">
              {plan.price}
            </div>
            <div className={`text-xs mb-5 ${plan.hot ? 'text-white/70' : 'text-gray-light'}`}>
              {plan.period}
            </div>
            <div className={`h-px mb-4 ${plan.hot ? 'bg-white/30' : 'bg-white/10'}`} />

            <ul className="list-none space-y-2.5 mb-5">
              {plan.features.map(({ ok, text }) => (
                <li key={text} className={`flex items-center gap-2.5 text-sm ${plan.hot ? 'text-white/90' : 'text-gray-light'}`}>
                  <span className={ok ? 'text-amber text-sm' : 'text-white/20 text-sm'}>
                    {ok ? '✓' : '✗'}
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 rounded-pill font-display font-extrabold text-sm transition-all cursor-pointer
              ${plan.hot
                ? 'bg-white text-coral-dark hover:bg-cream'
                : 'bg-white/10 text-white hover:bg-white/16'
              }`}>
              {plan.btnLabel}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center mt-6 text-sm text-gray">
        🏛️ Neziskové organizace a obecní útulky: 30 % sleva po ověření.
      </p>
    </section>
  )
}

/* ── CTA ── */
function CtaSection() {
  return (
    <section className="relative py-24 px-12 text-center bg-coral overflow-hidden">
      <div className="absolute top-1/2 left-[-50px] -translate-y-1/2 font-display font-extrabold text-[240px] text-white/[0.07] pointer-events-none leading-none">SOS</div>
      <div className="absolute top-1/2 right-[-40px] -translate-y-1/2 font-display font-extrabold text-[240px] text-white/[0.07] pointer-events-none leading-none">ZOZ</div>

      <div className="relative z-10">
        <h2 className="font-display font-extrabold text-[clamp(34px,5vw,56px)] text-white leading-tight mb-4">
          Jejich ZOZ čeká<br />na tvoji odpověď.
        </h2>
        <p className="text-lg text-white/82 max-w-[500px] mx-auto leading-relaxed mb-10">
          Zaregistruj svůj útulok nebo záchrannou stanici ještě dnes.
          Prvních 30 dní Standard plán zdarma — bez kreditní karty.
        </p>
        <div className="flex gap-3.5 justify-center flex-wrap">
          <Button variant="dark" size="lg">
            <Link href="/auth/register?type=shelter" className="no-underline text-inherit">🏠 Registrovat útulok</Link>
          </Button>
          <button className="inline-flex items-center gap-2 px-10 py-[17px] rounded-pill font-display font-bold text-lg text-white border-2 border-white/40 bg-white/20 hover:bg-white/30 transition-all cursor-pointer">
            <Link href="/auth/register?type=rescue_station" className="no-underline text-inherit">🚑 Záchranná stanice</Link>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── FOOTER ── */
function Footer() {
  return (
    <footer className="bg-espresso px-12 pt-16 pb-8 text-gray">
      <div className="max-w-[1100px] mx-auto grid grid-cols-4 gap-12 mb-11">

        <div>
          <ZozLogo size="md" variant="inverted" />
          <p className="text-sm text-gray leading-relaxed mt-3 max-w-[260px]">
            Platforma pro útulky a záchranné stanice v ČR a SR.
            Zachraňme opuštěná i ohrožená zvířata.
          </p>
        </div>

        {[
          {
            title: 'Pro rodiny',
            links: ['Hledat psy', 'Hledat kočky', 'Záchranné stanice', 'Adresář institucí', 'Příběhy adopcí'],
          },
          {
            title: 'Pro instituce',
            links: ['Útulky', 'Záchranné stanice', 'Ceník', 'Dokumentace', 'Podpora'],
          },
          {
            title: 'Zozio',
            links: ['O nás', 'Blog', 'Kontakt', 'GDPR', 'Podmínky'],
          },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-widest mb-3.5">
              {title}
            </h4>
            <ul className="list-none space-y-2.5">
              {links.map(link => (
                <li key={link}>
                  <a href="#" className="text-sm text-gray hover:text-coral transition-colors no-underline">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-[1100px] mx-auto pt-6 border-t border-white/[0.07] flex justify-between items-center text-xs">
        <span>© 2026 Zozio s.r.o. · Vyrobeno s ❤️ v České republice</span>
        <ZozLogo size="sm" variant="inverted" />
      </div>
    </footer>
  )
}
