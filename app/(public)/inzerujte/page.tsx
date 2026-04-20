import type { Metadata } from 'next'
import Link from 'next/link'
import { SLOT_PRICES, SLOT_LABELS, DURATION_DISCOUNTS, REGION_DISCOUNTS, MAX_COMBINED_DISCOUNT_PCT, VAT_RATE } from '@/lib/ad-pricing'

export const metadata: Metadata = {
  title: 'Inzerujte na Zozio — oslovte milovníky zvířat',
  description: 'Reklamní plochy na platformě Zozio pro útulky a záchranné stanice. Cílená inzerce pro lidi hledající mazlíčka — krmivo, pojištění, veterinární péče.',
  openGraph: {
    title: 'Inzerujte na Zozio — oslovte milovníky zvířat',
    description: 'Zozio je platforma pro adopce zvířat z útulků. 15 000+ unikátních návštěvníků měsíčně, 78 % ženy 25–44 let.',
  },
}

const SLOTS = [
  {
    id:      'inline_grid',
    icon:    '🔳',
    label:   SLOT_LABELS.inline_grid,
    price:   SLOT_PRICES.inline_grid,
    where:   '/adopt — karta v gridu zvířat',
    desc:    'Reklama vypadá přirozeně jako karta zvířete přímo v katalogu adopcí. Zobrazuje se každých 8 karet — uživatelé ji vidí při aktivním procházení nabídky.',
    reach:   'Velmi vysoký',
    reachColor: '#3B6D11',
    reachBg:    '#EAF3DE',
    format:  'Logo · headline (60 zn.) · popis (120 zn.) · CTA tlačítko · URL',
    mockup: (
      <div className="rounded-lg overflow-hidden border text-left" style={{ borderColor: '#F0EDE8', background: 'white', fontSize: '11px' }}>
        <div className="h-20 flex items-center justify-center font-bold" style={{ background: 'linear-gradient(135deg,#FAECE7,#FEF9E7)', color: '#E8634A' }}>
          🔳 Váš obrázek / logo
        </div>
        <div className="p-2.5">
          <div className="text-[10px] font-bold mb-0.5" style={{ color: '#8B6550' }}>Sponzorováno</div>
          <div className="font-bold mb-1" style={{ color: '#1A0F0A' }}>Váš headline</div>
          <div className="text-[10px] mb-2" style={{ color: '#6B4030' }}>Krátký popis vaší nabídky...</div>
          <div className="text-[10px] text-white font-bold px-2 py-1 rounded-full inline-block" style={{ background: '#E8634A' }}>
            Zjistit více →
          </div>
        </div>
      </div>
    ),
  },
  {
    id:      'sidebar',
    icon:    '📌',
    label:   SLOT_LABELS.sidebar,
    price:   SLOT_PRICES.sidebar,
    where:   'Profil zvířete, útulku, články — pravý sloupec',
    desc:    'Postranní panel viditelný při čtení obsahu. Zobrazí se uživatelům, kteří se hlouběji zajímají o konkrétní zvíře nebo útulek — tedy lidem s vysokým záměrem.',
    reach:   'Cílený',
    reachColor: '#185FA5',
    reachBg:    '#E6F1FB',
    format:  'Logo · headline (60 zn.) · popis (120 zn.) · CTA · URL · volitelný obrázek',
    mockup: (
      <div className="rounded-lg border p-3 text-left" style={{ borderColor: '#F0EDE8', background: 'white', fontSize: '11px' }}>
        <div className="text-[10px] mb-1.5 font-bold" style={{ color: '#8B6550' }}>Sponzorováno</div>
        <div className="h-12 rounded mb-2 flex items-center justify-center font-bold" style={{ background: '#FAECE7', color: '#E8634A' }}>
          Logo / obrázek
        </div>
        <div className="font-bold mb-1" style={{ color: '#1A0F0A' }}>Váš headline</div>
        <div className="text-[10px] mb-2" style={{ color: '#6B4030' }}>Popis vaší nabídky nebo produktu...</div>
        <div className="text-[10px] font-bold" style={{ color: '#E8634A' }}>Zjistit více →</div>
      </div>
    ),
  },
  {
    id:      'banner_adopt',
    icon:    '🎯',
    label:   SLOT_LABELS.banner_adopt,
    price:   SLOT_PRICES.banner_adopt,
    where:   '/adopt — horizontální pruh pod nadpisem stránky',
    desc:    'Prominentní horizontální banner, který vidí každý návštěvník katalogu adopcí. Maximální viditelnost na nejnavštěvovanější stránce platformy.',
    reach:   'Maximální',
    reachColor: '#E8634A',
    reachBg:    '#FAECE7',
    format:  'Logo · headline (80 zn.) · popis (150 zn.) · CTA · URL',
    mockup: (
      <div className="rounded-lg border p-3 flex items-center gap-3 text-left" style={{ borderColor: '#F0EDE8', background: '#FFFCF8', fontSize: '11px' }}>
        <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-bold" style={{ background: '#FAECE7', color: '#E8634A' }}>
          Logo
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] mb-0.5" style={{ color: '#8B6550' }}>Sponzorováno</div>
          <div className="font-bold truncate" style={{ color: '#1A0F0A' }}>Váš headline</div>
          <div className="text-[10px] truncate" style={{ color: '#6B4030' }}>Krátký popis...</div>
        </div>
        <div className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 text-white" style={{ background: '#E8634A' }}>
          CTA →
        </div>
      </div>
    ),
  },
  {
    id:      'banner_home',
    icon:    '🏠',
    label:   SLOT_LABELS.banner_home,
    price:   SLOT_PRICES.banner_home,
    where:   'Domovská stránka zozio.cz — mezi sekcemi',
    desc:    'Prémiová pozice na titulní stránce. Vaše značka se zobrazí každému, kdo Zozio navštíví poprvé — buduje povědomí u celé komunity milovníků zvířat.',
    reach:   'Maximální',
    reachColor: '#E8634A',
    reachBg:    '#FAECE7',
    format:  'Logo · headline (80 zn.) · popis (150 zn.) · CTA · URL',
    mockup: (
      <div className="rounded-lg border p-3 flex items-center gap-3 text-left" style={{ borderColor: '#F0EDE8', background: '#FEF9E7', fontSize: '11px' }}>
        <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-bold" style={{ background: '#FEF3C7', color: '#F0A500' }}>
          Logo
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] mb-0.5" style={{ color: '#8B6550' }}>Sponzorováno · Homepage</div>
          <div className="font-bold truncate" style={{ color: '#1A0F0A' }}>Váš headline</div>
          <div className="text-[10px] truncate" style={{ color: '#6B4030' }}>Popis vaší nabídky...</div>
        </div>
        <div className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 text-white" style={{ background: '#F0A500' }}>
          CTA →
        </div>
      </div>
    ),
  },
  {
    id:      'banner_animal',
    icon:    '🐾',
    label:   SLOT_LABELS.banner_animal,
    price:   SLOT_PRICES.banner_animal,
    where:   'Detail každého zvířete (/animals/[id]) — pod formulářem',
    desc:    'Uživatel právě zvažuje adopci. Ideální pro veterináře, pojišťovny, krmivo nebo doplňky. Cílitelný dle konkrétního útulku nebo druhu zvířete.',
    reach:   'Cílený',
    reachColor: '#185FA5',
    reachBg:    '#E6F1FB',
    format:  'Logo · headline (80 zn.) · popis (150 zn.) · CTA · URL',
    mockup: (
      <div className="rounded-lg border p-3 flex items-center gap-3 text-left" style={{ borderColor: '#F0EDE8', background: '#F0F7FF', fontSize: '11px' }}>
        <div className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center font-bold text-[10px]" style={{ background: '#DBEAFE', color: '#185FA5' }}>
          Logo
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] mb-0.5" style={{ color: '#8B6550' }}>Sponzorováno · Profil zvířete</div>
          <div className="font-bold truncate" style={{ color: '#1A0F0A' }}>Váš headline</div>
        </div>
        <div className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 text-white" style={{ background: '#185FA5' }}>
          CTA →
        </div>
      </div>
    ),
  },
  {
    id:      'newsletter',
    icon:    '📬',
    label:   SLOT_LABELS.newsletter,
    price:   SLOT_PRICES.newsletter,
    where:   'E-mailový newsletter — v sekci sponzorů',
    desc:    'Vaše reklama přímo v e-mailu odběratelům. Osobní doručení do schránky loajálního, angažovaného publika. Cena je za jedno vydání.',
    reach:   'Přímý',
    reachColor: '#6B4030',
    reachBg:    '#F0EDE8',
    format:  'Logo · headline (60 zn.) · popis (120 zn.) · URL',
    priceNote: 'za vydání',
    mockup: (
      <div className="rounded-lg border p-3 text-left" style={{ borderColor: '#E0DDD8', background: '#FAFAF8', fontSize: '11px' }}>
        <div className="text-[10px] mb-1.5 text-center font-bold" style={{ color: '#8B6550' }}>📬 Newsletter Zozio</div>
        <div className="border-t pt-2" style={{ borderColor: '#F0EDE8' }}>
          <div className="text-[10px] mb-1" style={{ color: '#A89080' }}>Sponzorováno</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center" style={{ background: '#FAECE7' }}>
              <span style={{ fontSize: '14px' }}>🏷️</span>
            </div>
            <div>
              <div className="font-bold" style={{ color: '#1A0F0A' }}>Vaše značka</div>
              <div className="text-[10px]" style={{ color: '#6B4030' }}>Krátký popis nabídky</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

const TARGETING = [
  {
    icon:  '🗺️',
    title: 'Regiony (kraje ČR)',
    desc:  'Vyberte 1–13 krajů ČR. Reklama se zobrazuje přednostně uživatelům z vybraných oblastí. Přináší slevu na cenu kampaně.',
    badge: `Sleva ${REGION_DISCOUNTS[0].pct} % (≤ 5 krajů) nebo ${REGION_DISCOUNTS[1].pct} % (6–13 krajů)`,
    color: '#185FA5',
    bg:    '#E6F1FB',
  },
  {
    icon:  '🏠',
    title: 'Konkrétní útulky nebo stanice',
    desc:  'Zvolte instituce, u jejichž obsahu chcete vyšší prioritu. Vaše reklama se zobrazí přednostně na profilech, zvířatech a článcích vybraných útulků.',
    badge: 'Boost priorita',
    color: '#3B6D11',
    bg:    '#EAF3DE',
  },
  {
    icon:  '📖',
    title: 'Kategorie článků',
    desc:  'Cílujte čtenáře příběhů adopce, záchranných případů, tipů a rad nebo novinek. Vaše reklama se zobrazí s vyšší prioritou v sidebaru u příslušných článků.',
    badge: 'Boost priorita',
    color: '#6B4030',
    bg:    '#F0EDE8',
  },
]

const PROCESS = [
  { step: '1', icon: '📝', title: 'Registrace', desc: 'Vytvořte si účet jako inzerent. Trvá 2 minuty, e-mail postačí.' },
  { step: '2', icon: '🎨', title: 'Vytvořte reklamu', desc: 'Zvolte reklamní plochu, nahrajte logo, napište headline a zadejte URL. Uvidíte živý náhled.' },
  { step: '3', icon: '📅', title: 'Nastavte termín a cílení', desc: 'Vyberte datum spuštění, délku kampaně a volitelné cílení (region, útulek, kategorie). Cena se přepočítá automaticky.' },
  { step: '4', icon: '✅', title: 'Schválení do 48 h', desc: 'Tým Zozio reklamu zkontroluje. Po schválení obdržíte fakturu a reklama se spustí v dohodnutém termínu.' },
  { step: '5', icon: '📊', title: 'Sledujte výsledky', desc: 'V portálu vidíte počet zobrazení, kliků a CTR v reálném čase. Denní statistiky přístupné kdykoli.' },
]

const FAQS = [
  {
    q: 'Jak se počítají zobrazení a kliky?',
    a: 'Zobrazení (impression) je zaznamenáno, když je reklama viditelná alespoň z 50 % po dobu nejméně 1 sekundy. Klik je každé kliknutí přímo na reklamní prvek vedoucí na váš web.',
  },
  {
    q: 'Kdy reklama začne běžet?',
    a: 'Po schválení týmem Zozio (do 48 pracovních hodin) a přijetí platby. Datum spuštění si nastavíte sami — kampaň se nespustí dřív, než zvolíte.',
  },
  {
    q: 'Jaký formát podkladů potřebuji?',
    a: 'Logo ve formátu PNG nebo SVG s průhledným pozadím, volitelný obrázek 1200×400 px pro banner. Texty (headline, popis) zadáváte přímo v portálu.',
  },
  {
    q: 'Mohu reklamu pozastavit nebo upravit?',
    a: 'Úpravy textů a obrázků jsou možné i v průběhu kampaně přes portál. Změna reklamní plochy nebo termínu podléhá přeschválení.',
  },
  {
    q: 'Jak fungují slevy a lze je kombinovat?',
    a: `Sleva za délku kampaně (${DURATION_DISCOUNTS[1].pct} % při ${DURATION_DISCOUNTS[1].minDays}+ dnech, ${DURATION_DISCOUNTS[0].pct} % při ${DURATION_DISCOUNTS[0].minDays}+ dnech) a sleva za regionální cílení se sčítají, maximální kombinovaná sleva je ${MAX_COMBINED_DISCOUNT_PCT} %. Všechny ceny jsou bez DPH (${Math.round(VAT_RATE * 100)} %).`,
  },
  {
    q: 'Jaký obsah reklamy je přípustný?',
    a: 'Reklamy musí tematicky souviset se zvířaty, péčí o ně, veterinárními službami nebo ochranou přírody. Tým Zozio si vyhrazuje právo odmítnout obsah nevhodný pro rodinou platformu.',
  },
  {
    q: 'Mohu inzerovat i bez portálu — přímo dohodou?',
    a: 'Ano. Pro větší kampaně nebo individuální podmínky nás kontaktujte na team@zozio.cz. Rádi sestavíme nabídku na míru.',
  },
]

export default function InzerujteePage() {
  const maxDurationDiscount = DURATION_DISCOUNTS[0].pct
  const maxRegionDiscount   = REGION_DISCOUNTS[0].pct
  const vatPct              = Math.round(VAT_RATE * 100)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>

      {/* ── Hero ── */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: '#2C1810' }}>
        {/* Dekorativní kruhy */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: '#E8634A' }} />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-10" style={{ background: '#F0A500' }} />

        <div className="max-w-[960px] mx-auto px-5 md:px-10 relative">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-6"
            style={{ background: 'rgba(232,99,74,0.2)', color: '#E8634A' }}>
            📣 Pro firmy a značky
          </div>
          <h1 className="font-display font-extrabold text-white mb-5 max-w-[700px]"
            style={{ fontSize: 'clamp(28px, 4.5vw, 54px)', lineHeight: 1.1 }}>
            Oslovte lidi,<br />
            kteří milují zvířata<br />
            <span style={{ color: '#E8634A' }}>a aktivně hledají mazlíčka</span>
          </h1>
          <p className="text-lg font-medium mb-10 max-w-[560px]" style={{ color: '#C4A882' }}>
            Zozio je česká platforma pro adopce zvířat z útulků a záchranných stanic.
            Propojte svou značku s angažovanou komunitou milovníků zvířat.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white no-underline transition-all hover:opacity-90"
              style={{ background: '#E8634A', fontSize: '0.95rem' }}>
              Začít inzerovat →
            </Link>
            <a href="mailto:team@zozio.cz?subject=Zájem o inzerci na Zozio"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold no-underline transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem' }}>
              ✉️ Napsat dotaz
            </a>
          </div>
        </div>
      </section>

      {/* ── Statistiky publika ── */}
      <section className="py-14 border-b" style={{ background: 'white', borderColor: '#F0EDE8' }}>
        <div className="max-w-[960px] mx-auto px-5 md:px-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-8 text-center" style={{ color: '#8B6550' }}>
            Proč inzerovat na Zozio?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8">
            {[
              { value: '15 000+', label: 'unikátních návštěvníků / měsíc' },
              { value: '60 000+', label: 'zobrazení stránek / měsíc'      },
              { value: '78 %',    label: 'ženy 25–44 let'                  },
              { value: '4,5 min', label: 'průměrná délka návštěvy'         },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-display font-extrabold text-3xl md:text-4xl mb-1" style={{ color: '#E8634A' }}>
                  {stat.value}
                </div>
                <div className="text-xs font-semibold" style={{ color: '#8B6550' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-5 border" style={{ borderColor: '#F0EDE8', background: '#FFFCF8' }}>
            <p className="text-sm font-medium text-center" style={{ color: '#6B4030' }}>
              Naši návštěvníci aktivně hledají produkty pro svá zvířata —{' '}
              <strong>krmivo, veterinární péči, pojištění, doplňky i výcvik</strong>.
              Jde o cílenou, angažovanou auditorii s nadprůměrnou kupní silou a silnou vazbou ke svým mazlíčkům.
            </p>
          </div>
        </div>
      </section>

      {/* ── Reklamní plochy ── */}
      <section className="py-16" style={{ background: '#FFFCF8' }}>
        <div className="max-w-[960px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-2" style={{ color: '#2C1810' }}>
            Kde se reklamy zobrazují?
          </h2>
          <p className="text-sm font-medium mb-10" style={{ color: '#8B6550' }}>
            Každá plocha má jiné umístění, dosah a cenu. Lze kombinovat více ploch v jedné kampani.
          </p>

          <div className="space-y-6">
            {SLOTS.map(slot => (
              <div key={slot.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#F0EDE8' }}>
                <div className="flex flex-col md:flex-row">
                  {/* Mockup */}
                  <div className="md:w-56 p-5 flex-shrink-0 flex items-center justify-center" style={{ background: '#FAFAF8' }}>
                    <div className="w-full max-w-[180px]">
                      {slot.mockup}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{slot.icon}</span>
                          <h3 className="font-display font-extrabold text-lg" style={{ color: '#1A0F0A' }}>
                            {slot.label}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: slot.reachBg, color: slot.reachColor }}>
                            {slot.reach}
                          </span>
                          <span className="font-display font-extrabold text-xl" style={{ color: '#E8634A' }}>
                            {slot.price.toLocaleString('cs')} Kč
                            <span className="text-xs font-semibold ml-1" style={{ color: '#8B6550' }}>
                              /{slot.priceNote ?? 'měs.'} bez DPH
                            </span>
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#8B6550' }}>
                        📍 {slot.where}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: '#6B4030' }}>
                        {slot.desc}
                      </p>
                    </div>
                    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#FAFAF8', color: '#8B6550' }}>
                      <span className="font-bold">Formát: </span>{slot.format}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Slevy ── */}
      <section className="py-16 border-y" style={{ background: 'white', borderColor: '#F0EDE8' }}>
        <div className="max-w-[960px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-2" style={{ color: '#2C1810' }}>
            Systém slev
          </h2>
          <p className="text-sm font-medium mb-8" style={{ color: '#8B6550' }}>
            Slevy se sčítají, maximální kombinovaná sleva je {MAX_COMBINED_DISCOUNT_PCT} %. Všechny ceny jsou bez DPH ({vatPct} %).
          </p>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Délka */}
            <div className="rounded-2xl border p-6" style={{ borderColor: '#F0EDE8', background: '#FFFCF8' }}>
              <div className="text-2xl mb-3">📅</div>
              <h3 className="font-display font-bold text-base mb-3" style={{ color: '#1A0F0A' }}>
                Délka kampaně
              </h3>
              <div className="space-y-2">
                {DURATION_DISCOUNTS.map(d => (
                  <div key={d.minDays} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: '#F0EDE8' }}>
                    <span className="text-sm" style={{ color: '#6B4030' }}>{d.minDays}+ dní</span>
                    <span className="font-display font-bold text-sm px-2 py-0.5 rounded-full" style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                      −{d.pct} %
                    </span>
                  </div>
                ))}
                <p className="text-xs pt-1" style={{ color: '#A89080' }}>Platí pro všechny plochy kromě newsletteru.</p>
              </div>
            </div>

            {/* Region */}
            <div className="rounded-2xl border p-6" style={{ borderColor: '#F0EDE8', background: '#FFFCF8' }}>
              <div className="text-2xl mb-3">🗺️</div>
              <h3 className="font-display font-bold text-base mb-3" style={{ color: '#1A0F0A' }}>
                Regionální cílení
              </h3>
              <div className="space-y-2">
                {REGION_DISCOUNTS.map(r => (
                  <div key={r.maxRegions} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: '#F0EDE8' }}>
                    <span className="text-sm" style={{ color: '#6B4030' }}>1–{r.maxRegions} krajů</span>
                    <span className="font-display font-bold text-sm px-2 py-0.5 rounded-full" style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                      −{r.pct} %
                    </span>
                  </div>
                ))}
                <p className="text-xs pt-1" style={{ color: '#A89080' }}>0 krajů = celá ČR = bez slevy.</p>
              </div>
            </div>

            {/* Max */}
            <div className="rounded-2xl border p-6" style={{ borderColor: '#FECACA', background: '#FAECE7' }}>
              <div className="text-2xl mb-3">🎉</div>
              <h3 className="font-display font-bold text-base mb-3" style={{ color: '#1A0F0A' }}>
                Maximální sleva
              </h3>
              <div className="text-center py-4">
                <div className="font-display font-extrabold" style={{ fontSize: '3rem', color: '#E8634A', lineHeight: 1 }}>
                  {MAX_COMBINED_DISCOUNT_PCT} %
                </div>
                <p className="text-xs mt-2" style={{ color: '#8B6550' }}>
                  Kombinace délky ({maxDurationDiscount} %) + regionu ({maxRegionDiscount} %)
                </p>
              </div>
              <p className="text-xs" style={{ color: '#A89080' }}>
                Příklad: 90denní kampaň cílená na 3 kraje = {DURATION_DISCOUNTS[0].pct + REGION_DISCOUNTS[0].pct} % sleva, zaokrouhleno na {MAX_COMBINED_DISCOUNT_PCT} %.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cílení ── */}
      <section className="py-16" style={{ background: '#FFFCF8' }}>
        <div className="max-w-[960px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-2" style={{ color: '#2C1810' }}>
            Možnosti cílení
          </h2>
          <p className="text-sm font-medium mb-8" style={{ color: '#8B6550' }}>
            Cílení funguje jako <strong>boost</strong> — reklama se zobrazuje všem, ale u vybraných skupin má vyšší prioritu.
            Žádné cílení neomezuje dosah, pouze ho zostřuje.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {TARGETING.map(t => (
              <div key={t.title} className="bg-white rounded-2xl border p-6" style={{ borderColor: '#F0EDE8' }}>
                <div className="text-3xl mb-4">{t.icon}</div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>{t.title}</h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B4030' }}>{t.desc}</p>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: t.bg, color: t.color }}>
                  {t.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jak to funguje ── */}
      <section className="py-16 border-y" style={{ background: 'white', borderColor: '#F0EDE8' }}>
        <div className="max-w-[800px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-10 text-center" style={{ color: '#2C1810' }}>
            Jak spustit kampaň?
          </h2>
          <div className="space-y-4">
            {PROCESS.map((p, i) => (
              <div key={p.step} className="flex gap-5 items-start">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-extrabold text-sm text-white"
                    style={{ background: '#E8634A' }}>
                    {p.step}
                  </div>
                  {i < PROCESS.length - 1 && (
                    <div className="w-px flex-1 mt-2 min-h-[24px]" style={{ background: '#F0EDE8' }} />
                  )}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{p.icon}</span>
                    <span className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>{p.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B4030' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16" style={{ background: '#FFFCF8' }}>
        <div className="max-w-[800px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-8" style={{ color: '#2C1810' }}>
            Časté dotazy
          </h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="bg-white rounded-xl border p-5" style={{ borderColor: '#F0EDE8' }}>
                <h3 className="font-bold text-sm mb-2" style={{ color: '#1A0F0A' }}>{faq.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B4030' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20" style={{ background: '#2C1810' }}>
        <div className="max-w-[700px] mx-auto px-5 md:px-10 text-center">
          <h2 className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
            Připraveni oslovit milovníky zvířat?
          </h2>
          <p className="text-base font-medium mb-10" style={{ color: '#C4A882' }}>
            Registrace trvá 2 minuty. Reklama bude živě do 48 hodin.
            Nebo nám napište — rádi sestavíme nabídku na míru.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white no-underline transition-all hover:opacity-90"
              style={{ background: '#E8634A', fontSize: '0.95rem' }}>
              📣 Začít inzerovat →
            </Link>
            <a href="mailto:team@zozio.cz?subject=Zájem o inzerci na Zozio"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold no-underline transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem' }}>
              ✉️ team@zozio.cz
            </a>
          </div>
          <p className="text-sm" style={{ color: '#8B6550' }}>
            Již máte účet?{' '}
            <Link href="/auth/login?next=/portal" className="font-semibold no-underline" style={{ color: '#E8634A' }}>
              Přihlaste se do portálu →
            </Link>
          </p>
        </div>
      </section>

    </main>
  )
}
