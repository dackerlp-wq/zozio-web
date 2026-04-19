import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Proč být na Zozio? | Platforma pro útulky',
  description: 'Zozio řeší reálné problémy útulků — od papírování a adopcí přes sbírky až po dobrovolníky. Přečtěte si, jak konkrétně pomůžeme vašemu útulku.',
}

// ─── Data ────────────────────────────────────────────────────────────────────

const problems = [
  {
    icon: '📋',
    problem: 'Žádosti o adopci v e-mailech a papírech',
    solution: 'Všechny žádosti online na jednom místě. Schvalujete z telefonu jedním kliknutím.',
  },
  {
    icon: '📢',
    problem: 'Zvířata jsou vidět jen na Facebooku',
    solution: 'Každé zvíře má vlastní profil indexovaný Googlem. Zájemci vás najdou sami.',
  },
  {
    icon: '📊',
    problem: 'Neví se, kolik zvířat tu prošlo a s jakým výsledkem',
    solution: 'Dashboard se statistikami v reálném čase — adopce, příjmy, doba pobytu.',
  },
  {
    icon: '🙋',
    problem: 'Dobrovolníci píší přes Messenger a zprávy se ztrácejí',
    solution: 'Dobrovolníci se registrují sami, vy schválíte a koordinujete — bez chaosu.',
  },
  {
    icon: '💛',
    problem: 'Sbírky na léčbu psaní ručně, bez přehledu kdo přispěl',
    solution: 'Cílená sbírka pro konkrétní zvíře za 2 minuty. Progress bar, sdílení, přehled dárců.',
  },
  {
    icon: '📱',
    problem: 'Admin systém nefunguje na mobilu',
    solution: 'Zozio je plně mobilní. Přidáváte zvíře přímo z příjmu.',
  },
]

const features = [
  {
    tag: 'SPRÁVA ZVÍŘAT',
    color: 'coral',
    icon: '🐾',
    title: 'Kompletní evidence každého zvířete',
    desc: 'Každé zvíře má vlastní digitální kartu — fotky, zdravotní stav, povahu, historii péče. Nic se neztrácí v tabulkách ani e-mailech.',
    bullets: [
      'Fotogalerie přímo z telefonu',
      'Zdravotní stav, veterinář, záznamy',
      'Stavový workflow: Příjem → Léčba → K adopci → Adoptováno',
      'QR kód na každé zvíře — záchranáři ho načtou v terénu',
      'PDF karta zvířete pro adoptivní rodiny',
    ],
    mockup: [
      { label: 'Jméno', value: 'Bella' },
      { label: 'Druh', value: '🐕 Pes — Labrador' },
      { label: 'Stav', value: '✅ K adopci', highlight: true },
      { label: 'V útulku', value: '47 dní' },
      { label: 'Vakcinace', value: '✓ Hotovo' },
    ],
  },
  {
    tag: 'ADOPCE',
    color: 'amber',
    icon: '📋',
    title: 'Online adopční proces bez papírování',
    desc: 'Zájemci vyplní žádost přímo z profilu zvířete. Vy ji přijmete, zamítnete nebo naplánujete schůzku — vše z telefonu. Automatické e-maily informují zájemce na každém kroku.',
    bullets: [
      'Online formulář pro zájemce (24/7)',
      'Stavy žádosti: Nová → Prochází → Schůzka → Adoptováno',
      'Automatické e-maily zájemcům při každé změně',
      'Historie všech žádostí u každého zvířete',
      'Export žádostí do CSV',
    ],
    mockup: [
      { label: 'Žadatel', value: 'Jana Nováková' },
      { label: 'O zvíře', value: 'Bella (Labrador)' },
      { label: 'Stav', value: '📅 Schůzka 12.4.', highlight: true },
      { label: 'Odesláno', value: 'před 2 dny' },
      { label: 'E-mail', value: '✉️ Automaticky odesláno' },
    ],
  },
  {
    tag: 'SBÍRKY',
    color: 'coral',
    icon: '💛',
    title: 'Sbírky pro konkrétní zvíře nebo projekt',
    desc: 'Cílená sbírka na veterinární péči, operaci nebo vybavení. Sdílejte příběh a zapojte veřejnost. Přehled kdo přispěl, kolik chybí do cíle.',
    bullets: [
      'Sbírka propojená se zvířetem nebo projektem',
      'Progress bar s aktuálním stavem',
      'Sdílení na sociální sítě jedním kliknutím',
      'Přehled dárců a částek',
      'Automatické upozornění při dosažení cíle',
    ],
    mockup: [
      { label: 'Název', value: 'Operace pro Malinku' },
      { label: 'Cíl', value: '15 000 Kč' },
      { label: 'Vybráno', value: '11 240 Kč (75 %)', highlight: true },
      { label: 'Dárci', value: '34 lidí' },
      { label: 'Zbývá', value: '3 760 Kč' },
    ],
  },
  {
    tag: 'DOBROVOLNÍCI',
    color: 'shelter',
    icon: '🙋',
    title: 'Koordinace dobrovolníků bez chaosu',
    desc: 'Dobrovolníci se registrují přes web, vy žádost schválíte nebo zamítnete. Přehled kdo je aktivní, na co se hlásil a kdy naposledy přišel.',
    bullets: [
      'Online registrační formulář pro dobrovolníky',
      'Aktivity: Venčení, Transport, Pěstounská péče, Akce',
      'Schválení nebo zamítnutí e-mailem',
      'Přehled aktivních dobrovolníků',
      'Kontaktní seznam pro koordinaci',
    ],
    mockup: [
      { label: 'Jméno', value: 'Tomáš Dvořák' },
      { label: 'Aktivity', value: '🦮 Venčení, 🚗 Transport' },
      { label: 'Stav', value: '✅ Aktivní', highlight: true },
      { label: 'Od', value: 'ledna 2025' },
      { label: 'Akce', value: '12 odpracováno' },
    ],
  },
  {
    tag: 'VEŘEJNÝ PROFIL',
    color: 'coral',
    icon: '📍',
    title: 'SEO profil, který vás najdou na Googlu',
    desc: 'Vaše instituce dostane vlastní veřejnou stránku s informacemi, zvířaty k adopci a možností přispět. Optimalizovaná pro vyhledávače — lidé vás najdou sami.',
    bullets: [
      'Vlastní URL (zozio.cz/utulky/vas-utulek)',
      'Zobrazení na mapě útulků v ČR a SR',
      'Všechna zvířata k adopci na jedné stránce',
      'Tlačítko pro přímou adopci nebo kontakt',
      'Sdílení na sociálních sítích',
    ],
    mockup: [
      { label: 'URL', value: '/utulky/utulek-brno' },
      { label: 'Zvířat', value: '23 k adopci' },
      { label: 'Zobrazení', value: '1 240 /měsíc', highlight: true },
      { label: 'Na mapě', value: '✓ Ano' },
      { label: 'Google', value: '✓ Indexováno' },
    ],
  },
  {
    tag: 'STATISTIKY',
    color: 'amber',
    icon: '📊',
    title: 'Dashboard s přehledem toho, co funguje',
    desc: 'Víte, kolik zvířat přijde a odejde každý měsíc? Která rasa čeká nejdéle? Kolik žádostí se schválí? Dashboard vám to ukáže bez tabulek.',
    bullets: [
      'Adopce a příjmy v reálném čase',
      'Průměrná doba pobytu v útulku',
      'Zvířata čekající 90+ dní (upozornění)',
      'Aktivní sbírky a stav vybraných peněz',
      'Dobrovolníci a jejich aktivity',
    ],
    mockup: [
      { label: 'K adopci', value: '23 zvířat' },
      { label: 'Adopce tento měsíc', value: '7', highlight: true },
      { label: 'Průměrná doba', value: '38 dní' },
      { label: 'Čeká 90+ dní', value: '⚠️ 2 zvířata' },
      { label: 'Aktivní sbírky', value: '3 (47 230 Kč)' },
    ],
  },
  {
    tag: 'WIDGET',
    color: 'coral',
    icon: '🔌',
    title: 'Widget pro váš web — zvířata k adopci automaticky',
    desc: 'Jeden řádek kódu na váš stávající web a všechna zvířata k adopci se zobrazí automaticky — vždy aktuální, bez ruční aktualizace. Plní zákonnou povinnost provozu webu se seznamem zvířat (§ 25 odst. 4 zák. č. 246/1992 Sb.).',
    bullets: [
      'Jeden řádek kódu, funguje na jakémkoli webu',
      'Automaticky zobrazuje aktuální zvířata z Zozio',
      'Přizpůsobitelný design — barvy, počet zvířat, druh',
      'Kliknutí vede přímo na adopční profil zvířete',
      'Plní zákonnou povinnost § 25 odst. 4 bez vlastního webu',
    ],
    mockup: [
      { label: 'Instalace', value: '1 řádek kódu' },
      { label: 'Aktualizace', value: '🔄 Automaticky', highlight: true },
      { label: 'Zobrazuje', value: 'Vždy aktuální zvířata' },
      { label: 'Téma', value: 'Přizpůsobitelné' },
      { label: 'Zákon § 25/4', value: '✓ Splněno' },
    ],
  },
  {
    tag: 'NEWSLETTER',
    color: 'amber',
    icon: '✉️',
    title: 'Automatický newsletter pro příznivce útulku',
    desc: 'Příznivci a dárci se přihlásí k odběru a automaticky dostávají novinky z vašeho útulku — nová zvířata, výzvy k adopci, úspěšné příběhy a sbírky. Bez ruční práce.',
    bullets: [
      'Přihlašovací formulář na profilu útulku na Zozio',
      'Automatické e-maily při přidání nového zvířete',
      'Novinky o sbírkách a jejich plnění',
      'Sdílení příběhů adoptovaných zvířat',
      'Přehled odběratelů a statistiky otevírání',
    ],
    mockup: [
      { label: 'Odběratelé', value: '247 lidí' },
      { label: 'Otevřenost', value: '61 %', highlight: true },
      { label: 'Poslední e-mail', value: 'Bella našla domov 🎉' },
      { label: 'Nová zvířata', value: '↑ Automaticky' },
      { label: 'Odesláno', value: 'Bez ruční práce' },
    ],
  },
]

// ─── Legal obligations ───────────────────────────────────────────────────────

const legalShelter = [
  {
    icon: '📋',
    obligation: 'Evidence každého přijatého zvířete',
    law: '§ 25 odst. 3 zák. č. 246/1992 Sb.',
    detail: 'Provozovatel útulku musí vést seznam přijatých zvířat — druh, číslo čipu, hmotnost, datum a místo nálezu, informace o původním chovateli.',
    howZozio: 'Každé zvíře v Zozio má automaticky evidované všechny zákonné údaje. Export na vyžádání orgánu ochrany zvířat.',
  },
  {
    icon: '🌐',
    obligation: 'Provoz webu se seznamem zvířat a fotkami',
    law: '§ 25 odst. 4 zák. č. 246/1992 Sb. (od 1. 2. 2021)',
    detail: 'Útulek je povinen provozovat webové stránky s aktuálním přehledem všech zvířat včetně fotografií a údajů o původu.',
    howZozio: 'Zozio splňuje tuto povinnost dvěma způsoby: (1) Veřejný profil útulku na zozio.cz se aktualizuje automaticky. (2) Widget — jeden řádek kódu vloží seznam zvířat přímo na váš stávající web a udržuje ho vždy aktuální.',
  },
  {
    icon: '🔖',
    obligation: 'Evidence vydaných zvířat a nových chovatelů',
    law: '§ 25 odst. 3 zák. č. 246/1992 Sb.',
    detail: 'Útulek musí evidovat seznam vydaných zvířat s datem předání a adresou nového chovatele.',
    howZozio: 'Při schválení adopce Zozio zaznamená datum, adoptivní rodinu a stav automaticky. Vše dohledatelné v historii zvířete.',
  },
  {
    icon: '💉',
    obligation: 'Evidence čipování — mikročip do 30 dnů',
    law: 'Zákon č. 166/1999 Sb. (veterinární zákon)',
    detail: 'Každý pes musí být označen mikročipem. Pokud ho nemá, útulek ho musí nechat čipovat do 30 dnů. Číslo čipu se zapisuje do evidence.',
    howZozio: 'Pole pro číslo čipu, datum čipování a veterináře je součástí karty každého zvířete. Upozornění při chybějícím čipu.',
  },
  {
    icon: '🏥',
    obligation: 'Karanténní záznamy a veterinární péče',
    law: '§ 42 zák. č. 166/1999 Sb.; vyhl. č. 176/2023 Sb.',
    detail: 'Nově přijatá zvířata musí projít karanténou. Veterinární záznamy (diagnózy, očkování, léčba) musí být vedeny a dostupné pro kontrolu.',
    howZozio: 'Záložka Zdraví v kartě zvířete eviduje karanténu, veterináře, záznamy o očkování, nemocech a léčbě.',
  },
  {
    icon: '🛡️',
    obligation: 'GDPR — ochrana osobních údajů zájemců o adopci',
    law: 'Nař. EU 2016/679 (GDPR); zákon č. 110/2019 Sb.',
    detail: 'Útulek jako správce osobních údajů musí dodržovat GDPR při zpracování žádostí o adopci — informační povinnost, zabezpečení, lhůty uchování.',
    howZozio: 'Adopční žádosti jsou uloženy na zabezpečeném serveru, přístupné jen oprávněným pracovníkům. Data zájemců nejsou sdílena třetím stranám.',
  },
]

const stats = [
  { number: '3× více', label: 'adopcí oproti útulkům bez online profilu' },
  { number: '5 min', label: 'průměrná doba přidání nového zvířete' },
  { number: '0 Kč', label: 'počáteční náklady pro Free plán' },
  { number: '24 hod', label: 'schválení nové instituce po registraci' },
]

const plans = [
  {
    tier: 'Free',
    price: '0 Kč',
    period: 'navždy zdarma',
    hot: false,
    features: ['Do 15 zvířat', 'Veřejný profil instituce', 'Adopční formulář', 'Základní statistiky'],
    missing: ['E-mail notifikace', 'Sbírky', 'Dobrovolníci', 'Export dat'],
    cta: 'Začít zdarma',
    href: '/auth/register',
  },
  {
    tier: 'Standard',
    price: '490 Kč',
    period: 'měsíčně',
    hot: true,
    features: ['Neomezená zvířata', 'E-mail notifikace', '1 aktivní sbírka', 'Správa dobrovolníků', 'Export dat (CSV)', 'Pokročilé statistiky'],
    missing: ['Více poboček'],
    cta: '30 dní zdarma →',
    href: '/auth/register',
  },
  {
    tier: 'Pro',
    price: '990 Kč',
    period: 'měsíčně',
    hot: false,
    features: ['Vše ze Standard', 'Neomezené sbírky', 'Až 5 poboček', 'Analytika a reporty', 'Prioritní podpora', 'Onboarding pomoc'],
    missing: [],
    cta: 'Kontaktovat nás',
    href: 'mailto:info@zozio.cz',
  },
]

const faq = [
  {
    q: 'Jak dlouho trvá registrace?',
    a: 'Vyplnění formuláře trvá 5 minut. Tým Zozio instituci zkontroluje a schválí do 24 hodin pracovního dne. Pak okamžitě přidáváte zvířata.',
  },
  {
    q: 'Musím platit hned?',
    a: 'Ne. Free plán je zdarma navždy bez kreditní karty. Standard plán nabízíme 30 dní zdarma — platba začne až po uplynutí zkušební doby, pokud se rozhodnete pokračovat.',
  },
  {
    q: 'Funguje Zozio na telefonu?',
    a: 'Ano, celý admin panel je plně mobilně responzivní. Přidávat zvířata, schvalovat žádosti nebo spravovat sbírky jde přímo z telefonu.',
  },
  {
    q: 'Mohu migrovat data ze starého systému?',
    a: 'Pomůžeme vám s importem dat z Excelu nebo jiných systémů. Na placeném plánu nabízíme asistenci při onboardingu. Kontaktujte nás na info@zozio.cz.',
  },
  {
    q: 'Co když jsem nezisková organizace nebo obecní útulok?',
    a: 'Neziskové organizace a obecní útulky získávají 30% slevu na Standard a Pro plán. Stačí po registraci doložit potvrzení o neziskové činnosti — zbytek zařídíme za vás.',
  },
  {
    q: 'Je Zozio jen pro ČR, nebo i pro SR?',
    a: 'Zozio funguje v celé ČR a SR. Platforma je plně v češtině, slovenština v administraci připravována. Útulky ze Slovenska jsou vítány.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACCENT: Record<string, string> = {
  coral:   '#E8634A',
  amber:   '#F0A500',
  shelter: '#E8634A',
}
const ACCENT_BG: Record<string, string> = {
  coral:   '#FDEAE6',
  amber:   '#FEF3D6',
  shelter: '#FDEAE6',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProcBytNaZozioPage() {
  return (
    <main className="overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="bg-espresso pt-24 md:pt-32 pb-20 px-4 md:px-12 relative overflow-hidden">
        <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-end pr-8 opacity-[0.04]">
          <span className="font-display font-extrabold text-[clamp(160px,22vw,320px)] text-white leading-none">ZOZ</span>
        </div>
        <div className="max-w-[860px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-coral/20 text-coral font-body text-xs font-bold px-4 py-2 rounded-pill mb-6">
            🏠 Pro útulky v ČR a SR
          </div>
          <h1 className="font-display font-extrabold text-white leading-tight mb-6" style={{ fontSize: 'clamp(34px, 5.5vw, 64px)' }}>
            Proč být<br />na Zozio?
          </h1>
          <p className="text-lg text-gray-light max-w-[620px] mx-auto leading-relaxed mb-10">
            Útulky stráví hodiny administrativou místo péčí o zvířata.
            Zozio to obrátí — digitální správa adopcí, sbírek a dobrovolníků za méně času.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/auth/register">
              <Button variant="primary" size="lg" className="justify-center w-full sm:w-auto">
                Registrovat instituci zdarma
              </Button>
            </Link>
            <Link href="#funkce">
              <Button variant="sand" size="lg" className="justify-center w-full sm:w-auto">
                Zobrazit funkce ↓
              </Button>
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-lg overflow-hidden">
            {stats.map(s => (
              <div key={s.label} className="bg-espresso/90 px-4 py-5 text-center">
                <div className="font-display font-extrabold text-2xl md:text-3xl text-coral mb-1">{s.number}</div>
                <div className="text-xs text-gray-light leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLÉMY → ŘEŠENÍ ── */}
      <section className="py-16 md:py-24 px-4 md:px-12 bg-warm">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-coral/10 text-coral-dark font-body text-xs font-bold px-4 py-2 rounded-pill mb-4">
              REÁLNÉ PROBLÉMY ÚTULKŮ
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-4">
              Znáte to?
            </h2>
            <p className="text-base text-brown-mid max-w-[500px] mx-auto">
              Každý z těchto problémů řeší Zozio konkrétní funkcí — bez papírů, tabulek nebo chaosu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.map(p => (
              <div key={p.problem} className="bg-white rounded-lg border border-gray-pale p-5 shadow-sm">
                <div className="text-2xl mb-3">{p.icon}</div>
                <div className="flex items-start gap-2 mb-3">
                  <span className="flex-shrink-0 mt-0.5 text-xs font-bold text-gray line-through leading-relaxed">{p.problem}</span>
                </div>
                <div className="h-px bg-gray-pale mb-3" />
                <p className="text-sm text-espresso font-semibold leading-relaxed">{p.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNKCE DETAIL ── */}
      <section id="funkce" className="py-16 md:py-24 px-4 md:px-12 bg-cream">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber/20 text-amber font-body text-xs font-bold px-4 py-2 rounded-pill mb-4" style={{ color: '#8B6000' }}>
              CO ZOZIO UMÍ
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-4">
              Funkce, které skutečně pomáhají
            </h2>
            <p className="text-base text-brown-mid max-w-[480px] mx-auto">
              Žádné funkce pro funkce. Každá věc tu je proto, aby váš útulok fungoval lépe.
            </p>
          </div>

          <div className="space-y-8">
            {features.map((f, i) => {
              const isEven = i % 2 === 0
              const accent = ACCENT[f.color]
              const accentBg = ACCENT_BG[f.color]
              return (
                <div key={f.tag} className="bg-white rounded-lg border border-gray-pale shadow-sm overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-5">
                    {/* Content side */}
                    <div className={`lg:col-span-3 p-6 md:p-8 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold tracking-widest px-3 py-1 rounded-pill"
                          style={{ background: accentBg, color: accent }}>
                          {f.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{f.icon}</span>
                        <h3 className="font-display font-extrabold text-xl md:text-2xl text-espresso">{f.title}</h3>
                      </div>
                      <p className="text-sm text-brown-mid leading-relaxed mb-5">{f.desc}</p>
                      <ul className="space-y-2">
                        {f.bullets.map(b => (
                          <li key={b} className="flex items-start gap-2.5 text-sm text-espresso">
                            <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: accent }}>✓</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Mockup side */}
                    <div className={`lg:col-span-2 p-6 md:p-8 flex items-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}
                      style={{ background: accentBg }}>
                      <div className="w-full">
                        <div className="rounded-lg bg-white shadow-md overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-pale flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-coral opacity-60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber opacity-60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-pale" />
                            <span className="ml-2 text-[10px] text-gray font-semibold">Zozio Admin</span>
                          </div>
                          <div className="divide-y divide-gray-pale">
                            {f.mockup.map(row => (
                              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                                <span className="text-xs text-gray font-medium">{row.label}</span>
                                <span className={`text-xs font-semibold ${row.highlight ? '' : 'text-espresso'}`}
                                  style={row.highlight ? { color: accent } : {}}>
                                  {row.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── ZÁKONNÉ POVINNOSTI ── */}
      <section className="py-16 md:py-24 px-4 md:px-12" style={{ background: '#1A0F0A' }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 font-body text-xs font-bold px-4 py-2 rounded-pill mb-4"
              style={{ background: 'rgba(240,165,0,0.15)', color: '#F0A500' }}>
              ⚖️ ZÁKONNÉ POVINNOSTI
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-4">
              Zozio vám pomáhá plnit zákon
            </h2>
            <p className="text-base max-w-[600px] mx-auto leading-relaxed" style={{ color: '#9B8070' }}>
              Útulky mají přesně definované zákonné povinnosti — od evidence zvířat přes GDPR až po reporty pro státní správu.
              Nesplnění hrozí pokutami až <strong className="text-white">100 000 Kč</strong> pro fyzické
              a až <strong className="text-white">3 000 000 Kč</strong> pro právnické osoby.
              Zozio tyto povinnosti řeší automaticky.
            </p>
          </div>

          {/* Útulky */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🏠</span>
              <h3 className="font-display font-extrabold text-xl text-white">Útulky pro psy a kočky</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-pill" style={{ background: 'rgba(232,99,74,0.2)', color: '#E8634A' }}>
                Zákon č. 246/1992 Sb. + veterinární zákon
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {legalShelter.map(item => (
                <div key={item.obligation} className="rounded-lg p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <div className="font-display font-bold text-white text-sm mb-0.5">{item.obligation}</div>
                      <div className="text-[10px] font-bold font-mono" style={{ color: '#F0A500' }}>{item.law}</div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: '#7A6A5A' }}>{item.detail}</p>
                  <div className="flex items-start gap-2 rounded-md p-2.5" style={{ background: 'rgba(232,99,74,0.08)', borderLeft: '3px solid #E8634A' }}>
                    <span className="flex-shrink-0 text-xs font-bold mt-0.5" style={{ color: '#E8634A' }}>✓</span>
                    <p className="text-xs font-semibold leading-relaxed" style={{ color: '#C8A898' }}>{item.howZozio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-10 rounded-lg p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#5A4A3A' }}>
              Informace jsou informativní a nezahrnují veškeré právní předpisy. Doporučujeme konzultovat konkrétní povinnosti s právníkem nebo příslušným orgánem státní správy (SVS, MŽP, ČIŽP).
              Zozio neposkytuje právní poradenství.
            </p>
          </div>
        </div>
      </section>

      {/* ── DEN S ZOZIO ── */}
      <section className="py-16 md:py-24 px-4 md:px-12 bg-warm">
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-coral/10 text-coral-dark font-body text-xs font-bold px-4 py-2 rounded-pill mb-4">
              JAK TO VYPADÁ V PRAXI
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-4">
              Den v útulku se Zozio
            </h2>
            <p className="text-base text-brown-mid">
              Ráno přijde nové štěně. Do večera je viditelné na internetu a první žádost přichází sama.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-[27px] top-8 bottom-8 w-0.5 bg-gray-pale" />

            <div className="space-y-4">
              {[
                { time: '08:15', icon: '🐶', title: 'Příjem nového psa', desc: 'Přijíždí nové zvíře. Pověřený pracovník ho zaregistruje v Zozio přímo z telefonu — jméno, druh, přibližný věk, fotky při příjmu. Celé to trvá 5 minut.' },
                { time: '08:30', icon: '📸', title: 'Profil okamžitě viditelný online', desc: 'Jakmile ho uložíte, pes má vlastní profil na zozio.cz — s fotkami, charakteristikou a tlačítkem "Mám zájem". Google ho začne indexovat do 48 hodin.' },
                { time: '10:00', icon: '📋', title: 'První žádost o adopci', desc: 'Jana z Brna narazila na profil psa na Googlu. Vyplnila adopční žádost online. Vy dostanete e-mail — žádost vidíte v přehledu admin panelu.' },
                { time: '14:30', icon: '📅', title: 'Naplánovaná schůzka jedním klikem', desc: 'Žádost vypadá dobře. Kliknutím změníte stav na "Schůzka naplánována" — Jana automaticky dostane e-mail s potvrzením a instrukcemi.' },
                { time: '17:00', icon: '💛', title: 'Sbírka na veterinární péči', desc: 'Druhý pes potřebuje operaci. Za 2 minuty vytvoříte sbírku — cíl 8 000 Kč, foto psa, příběh. Sdílíte na Facebook. Do večera přijde první příspěvek.' },
                { time: '18:00', icon: '📊', title: 'Konec dne: přehled v dashboardu', desc: 'Otevřete dashboard z mobilu cestou domů. Vidíte: 3 nové žádosti, sbírka vybrala 1 200 Kč, 2 dobrovolníci čekají na schválení. Vše na jedné obrazovce.' },
              ].map((step, i) => (
                <div key={step.time} className="flex gap-4 md:gap-6 items-start">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border-2 border-gray-pale flex flex-col items-center justify-center shadow-sm z-10">
                    <span className="text-xl leading-none">{step.icon}</span>
                    <span className="text-[9px] font-bold text-gray mt-0.5">{step.time}</span>
                  </div>
                  <div className="flex-1 bg-white rounded-lg border border-gray-pale p-4 md:p-5 shadow-sm">
                    <div className="font-display font-bold text-base text-espresso mb-1.5">{step.title}</div>
                    <div className="text-sm text-brown-mid leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CENÍK ── */}
      <section id="cenik" className="py-16 md:py-24 px-4 md:px-12 bg-espresso relative overflow-hidden">
        <div className="pointer-events-none select-none absolute bottom-0 right-0 opacity-[0.04]">
          <span className="font-display font-extrabold text-[clamp(120px,18vw,260px)] text-white leading-none">FREE</span>
        </div>
        <div className="max-w-[960px] mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-3">Transparentní ceník</h2>
            <p className="text-base text-gray-light max-w-[480px] mx-auto">
              Začněte zdarma. Plaťte jen když roste vaše instituce. Bez závazků.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {plans.map(plan => (
              <div key={plan.tier}
                className={`relative rounded-lg p-6 border-2 ${plan.hot ? 'bg-coral border-coral sm:scale-[1.04] shadow-xl' : 'bg-white/5 border-white/10'}`}>
                {plan.hot && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber text-espresso font-display font-extrabold text-[11px] px-4 py-1 rounded-pill whitespace-nowrap">
                    ⭐ NEJOBLÍBENĚJŠÍ
                  </div>
                )}
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${plan.hot ? 'text-white/70' : 'text-gray-light'}`}>{plan.tier}</div>
                <div className="font-display font-extrabold text-4xl text-white leading-none mb-1">{plan.price}</div>
                <div className={`text-xs mb-5 ${plan.hot ? 'text-white/60' : 'text-gray-light'}`}>{plan.period}</div>
                <div className={`h-px mb-4 ${plan.hot ? 'bg-white/25' : 'bg-white/10'}`} />
                <ul className="space-y-2.5 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.hot ? 'text-white/90' : 'text-gray-light'}`}>
                      <span className="flex-shrink-0 font-bold mt-0.5" style={{ color: '#F0A500' }}>✓</span>{f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.hot ? 'text-white/35' : 'text-white/20'}`}>
                      <span className="flex-shrink-0 mt-0.5">✗</span>{f}
                    </li>
                  ))}
                </ul>
                <div className={`h-px mb-5 ${plan.hot ? 'bg-white/25' : 'bg-white/10'}`} />
                <Link href={plan.href}>
                  <button
                    className={`w-full py-3 rounded-pill font-display font-extrabold text-sm cursor-pointer border-none transition-all
                      ${plan.hot ? 'bg-white text-coral-dark hover:bg-cream' : 'bg-white/10 text-white hover:bg-white/18'}`}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray">
            🏛️ Neziskové organizace a obecní útulky:{' '}
            <strong className="text-gray-light">30% sleva</strong> po ověření ·{' '}
            <a href="mailto:info@zozio.cz" className="text-coral hover:underline">info@zozio.cz</a>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-20 px-4 md:px-12 bg-warm">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso text-center mb-10">
            Časté otázky
          </h2>
          <div className="space-y-3">
            {faq.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-lg border border-gray-pale p-5">
                <div className="font-display font-bold text-base text-espresso mb-2">{q}</div>
                <div className="text-sm text-brown-mid leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 md:py-20 px-4 md:px-12 bg-coral text-center relative overflow-hidden">
        <div className="pointer-events-none select-none hidden md:block absolute top-1/2 left-[-40px] -translate-y-1/2 font-display font-extrabold text-[220px] text-white/[0.07] leading-none">🐾</div>
        <div className="relative z-10 max-w-[600px] mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-4">
            Vaše zvířata si zaslouží lepší šanci
          </h2>
          <p className="text-base text-white/82 mb-8 leading-relaxed">
            Registrace je zdarma, trvá 5 minut a žádnou kreditní kartu nepotřebujete.
            Do 24 hodin vás schválíme a můžete přidávat zvířata.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register">
              <Button variant="dark" size="lg" className="justify-center w-full sm:w-auto">
                Registrovat instituci zdarma
              </Button>
            </Link>
            <a href="mailto:info@zozio.cz">
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-[17px] rounded-pill font-display font-bold text-base text-white border-2 border-white/40 bg-white/15 hover:bg-white/25 transition-all cursor-pointer">
                Napsat nám
              </button>
            </a>
          </div>
          <p className="text-xs text-white/50 mt-6">
            Zozio je platforma pro útulky v ČR a SR
          </p>
        </div>
      </section>

    </main>
  )
}
