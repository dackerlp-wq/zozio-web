import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Inzerujte na Zozio — oslovte milovníky zvířat',
  description: 'Reklamní příležitosti na platformě Zozio pro útulky. 15 000 unikátních návštěvníků měsíčně, 78 % ženy 25–44 let.',
}

const PACKAGES = [
  {
    tier:  'Friend',
    color: '#6B4030',
    bg:    '#F0EDE8',
    price: 'od 1 500 Kč/měsíc',
    slots: ['Newsletter'],
    features: [
      'Logo v newsletter',
      'Odkaz na web',
      'Měsíční report',
    ],
  },
  {
    tier:  'Supporter',
    color: '#3B6D11',
    bg:    '#EAF3DE',
    price: 'od 3 500 Kč/měsíc',
    slots: ['Inline grid', 'Sidebar'],
    popular: true,
    features: [
      'Karta v gridu zvířat',
      'Sidebar reklama',
      'Cílení dle druhu zvířete',
      'Měsíční statistiky',
    ],
  },
  {
    tier:  'Partner',
    color: '#E8634A',
    bg:    '#FAECE7',
    price: 'od 7 000 Kč/měsíc',
    slots: ['Banner adopce', 'Banner zvíře', 'Sidebar', 'Newsletter'],
    features: [
      'Banner na stránce adopce',
      'Banner na detailu zvířete',
      'Sidebar + newsletter',
      'Týdenní statistiky',
      'Prioritní podpora',
    ],
  },
  {
    tier:  'Hlavní partner',
    color: '#F0A500',
    bg:    '#FEF9E7',
    price: 'od 15 000 Kč/měsíc',
    slots: ['Všechny sloty'],
    features: [
      'Přítomnost ve všech slotech',
      'Banner na homepage',
      'Exkluzivní pozice',
      'Co-branding možnosti',
      'Denní statistiky',
      'Dedikovaný account manager',
    ],
  },
]

const FAQS = [
  {
    q: 'Jak dlouho trvá spuštění kampaně?',
    a: 'Po dohodě a zaslání podkladů dokážeme kampaň spustit do 2 pracovních dnů.',
  },
  {
    q: 'Mohu cílit reklamu jen na milovníky psů nebo koček?',
    a: 'Ano — nabízíme cílení dle druhu zvířete. Vaše reklama se zobrazí jen návštěvníkům, kteří prohlížejí psy, kočky nebo jiná zvířata.',
  },
  {
    q: 'Jak funguje platba?',
    a: 'Fakturujeme měsíčně na základě smlouvy. Přijímáme bankovní převod i kartu.',
  },
  {
    q: 'Jsou k dispozici statistiky?',
    a: 'Ano, každý partner dostane přístup k reportu s počtem zobrazení, kliků a CTR. Vyšší balíčky mají real-time dashboard.',
  },
  {
    q: 'Jaký formát podkladů potřebujete?',
    a: 'Logo ve formátu PNG/SVG (průhledné pozadí), obrázek 1200×400 px pro banner, text headlinu (max 60 znaků) a URL cíle.',
  },
]

export default function InzerujteePage() {
  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>

      {/* Hero */}
      <section className="py-16 md:py-20" style={{ background: '#2C1810' }}>
        <div className="max-w-[900px] mx-auto px-5 md:px-10 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-6"
            style={{ background: 'rgba(232,99,74,0.2)', color: '#E8634A' }}>
            Pro firmy a značky
          </div>
          <h1 className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.1 }}>
            Oslovte milovníky zvířat<br />
            <span style={{ color: '#E8634A' }}>na Zozio</span>
          </h1>
          <p className="text-lg font-medium mb-8 max-w-[580px] mx-auto" style={{ color: '#C4A882' }}>
            Zozio je největší česká platforma pro adopce zvířat z útulků.
            Propojte svou značku s lidmi, kteří mají srdce pro zvířata.
          </p>
          <a href="mailto:info@zozio.cz?subject=Zájem o inzerci na Zozio"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white no-underline transition-all hover:opacity-90"
            style={{ background: '#E8634A', fontSize: '1rem' }}>
            Nezávazně se zeptat →
          </a>
        </div>
      </section>

      {/* Statistiky */}
      <section className="py-14" style={{ background: 'white' }}>
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-center mb-10" style={{ color: '#2C1810' }}>
            Proč inzerovat na Zozio?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '15 000+', label: 'unikátních návštěvníků / měsíc' },
              { value: '60 000+', label: 'zobrazení stránek / měsíc' },
              { value: '78 %',    label: 'ženy 25–44 let' },
              { value: '4,5 min', label: 'průměrná doba na webu' },
            ].map(stat => (
              <div key={stat.label} className="p-5 rounded-xl" style={{ background: '#FFFCF8' }}>
                <div className="font-display font-extrabold text-3xl mb-1" style={{ color: '#E8634A' }}>
                  {stat.value}
                </div>
                <div className="text-xs font-semibold" style={{ color: '#8B6550' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 rounded-xl border" style={{ borderColor: '#F0EDE8', background: '#FFFCF8' }}>
            <p className="text-sm font-medium text-center" style={{ color: '#6B4030' }}>
              Naši návštěvníci aktivně hledají produkty pro svá zvířata — krmivo, pojištění, veterinární péči a doplňky.
              Jde o <strong>cílenou, angažovanou auditorii</strong> s nadprůměrnou kupní silou.
            </p>
          </div>
        </div>
      </section>

      {/* Reklamní plochy */}
      <section className="py-14" style={{ background: '#FFFCF8' }}>
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-2" style={{ color: '#2C1810' }}>
            Reklamní plochy
          </h2>
          <p className="text-sm font-medium mb-8" style={{ color: '#8B6550' }}>
            Reklamy se zobrazují v různých částech platformy dle zvoleného balíčku.
          </p>
          <div className="space-y-4">
            {[
              {
                slot:  'Inline grid',
                where: 'Stránka /adopt — karta v gridu zvířat',
                desc:  'Reklama vypadá jako karta zvířete, přirozeně zapadá do obsahu. Zobrazuje se každých 8 karet.',
                size:  'Logo + headline + popis + CTA tlačítko',
              },
              {
                slot:  'Banner adopce',
                where: 'Stránka /adopt — horizontální pruh pod nadpisem',
                desc:  'Prominentní banner, který vidí každý návštěvník stránky adopcí.',
                size:  'Logo + headline + CTA, šířka 100 %',
              },
              {
                slot:  'Banner homepage',
                where: 'Hlavní stránka zozio.cz — mezi sekcemi',
                desc:  'Nejvyšší dosah — zobrazuje se na úvodní stránce mezi sekcí zvířat a sbírek.',
                size:  'Logo + headline + CTA, šířka 100 %',
              },
              {
                slot:  'Banner detail zvířete',
                where: 'Pod adopčním formulářem na detailu každého zvířete',
                desc:  'Cílitelný dle druhu zvířete — zobrazí se jen na stránkách psů, koček apod.',
                size:  'Logo + headline + CTA',
              },
              {
                slot:  'Newsletter',
                where: 'Měsíční newsletter odběratelům',
                desc:  'Logo a text v newsletteru zasílaném aktivním odběratelům.',
                size:  'Logo + headline + odkaz',
              },
            ].map(s => (
              <div key={s.slot} className="flex gap-4 p-5 rounded-xl border"
                style={{ borderColor: '#F0EDE8', background: 'white' }}>
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="inline-flex px-2 py-1 rounded text-xs font-bold"
                    style={{ background: '#FAECE7', color: '#E8634A' }}>
                    {s.slot}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold mb-1" style={{ color: '#8B6550' }}>{s.where}</div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#2C1810' }}>{s.desc}</p>
                  <p className="text-xs" style={{ color: '#A89080' }}>{s.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cenové balíčky */}
      <section className="py-14" style={{ background: 'white' }}>
        <div className="max-w-[960px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-2 text-center" style={{ color: '#2C1810' }}>
            Cenové balíčky
          </h2>
          <p className="text-sm font-medium mb-10 text-center" style={{ color: '#8B6550' }}>
            Všechny ceny jsou bez DPH. Roční platba = 2 měsíce zdarma.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PACKAGES.map(pkg => (
              <div key={pkg.tier}
                className="flex flex-col rounded-xl border-2 p-5 relative"
                style={{
                  borderColor: pkg.popular ? pkg.color : '#F0EDE8',
                  background:  pkg.popular ? pkg.bg : 'white',
                }}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: pkg.color }}>
                      Nejoblíbenější
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold mb-2"
                    style={{ color: pkg.color, background: pkg.bg }}>
                    {pkg.tier}
                  </span>
                  <div className="font-display font-extrabold text-xl" style={{ color: '#2C1810' }}>
                    {pkg.price}
                  </div>
                  <div className="text-xs font-medium mt-1" style={{ color: '#8B6550' }}>
                    {pkg.slots.join(', ')}
                  </div>
                </div>
                <ul className="flex-1 space-y-2 mb-5">
                  {pkg.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#6B4030' }}>
                      <span style={{ color: pkg.color }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="mailto:info@zozio.cz?subject=Zájem o inzerci — {pkg.tier}"
                  className="text-center py-2 rounded-lg text-sm font-bold no-underline transition-all hover:opacity-90"
                  style={{ background: pkg.color, color: 'white' }}>
                  Mám zájem
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-6" style={{ color: '#A89080' }}>
            Hledáte individuální řešení? Napište nám na{' '}
            <a href="mailto:info@zozio.cz" className="font-semibold" style={{ color: '#E8634A' }}>
              info@zozio.cz
            </a>
          </p>
        </div>
      </section>

      {/* Cílení */}
      <section className="py-14" style={{ background: '#FFFCF8' }}>
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-6" style={{ color: '#2C1810' }}>
            Cílení reklamy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl border" style={{ borderColor: '#F0EDE8', background: 'white' }}>
              <div className="text-2xl mb-3">🌍</div>
              <h3 className="font-bold text-base mb-2" style={{ color: '#2C1810' }}>Geografické cílení</h3>
              <p className="text-sm" style={{ color: '#8B6550' }}>
                Platforma slouží útulkům v České republice a Slovensku.
                Naši návštěvníci jsou primárně z ČR (85 %) a SR (15 %).
              </p>
            </div>
            <div className="p-5 rounded-xl border" style={{ borderColor: '#F0EDE8', background: 'white' }}>
              <div className="text-2xl mb-3">🐾</div>
              <h3 className="font-bold text-base mb-2" style={{ color: '#2C1810' }}>Druhové cílení</h3>
              <p className="text-sm" style={{ color: '#8B6550' }}>
                Zobrazujte reklamy jen milovníkům psů, koček nebo jiných zvířat.
                Ideální pro specializované produkty a služby.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jak začít */}
      <section className="py-14" style={{ background: 'white' }}>
        <div className="max-w-[700px] mx-auto px-5 md:px-10 text-center">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-4" style={{ color: '#2C1810' }}>
            Jak začít?
          </h2>
          <p className="text-base font-medium mb-8" style={{ color: '#8B6550' }}>
            Stačí nám napsat — do 24 hodin se vám ozveme s nabídkou šitou na míru.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="mailto:info@zozio.cz?subject=Zájem o inzerci na Zozio"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white no-underline transition-all hover:opacity-90"
              style={{ background: '#E8634A' }}>
              ✉️ Napsat email
            </a>
            <a href="tel:+420123456789"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold no-underline border-2 transition-all hover:opacity-80"
              style={{ borderColor: '#E8634A', color: '#E8634A', background: 'white' }}>
              📞 Zavolat
            </a>
          </div>
          <p className="text-sm" style={{ color: '#A89080' }}>
            Nebo nás kontaktujte na{' '}
            <a href="mailto:info@zozio.cz" style={{ color: '#E8634A' }} className="font-semibold">
              info@zozio.cz
            </a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14" style={{ background: '#FFFCF8' }}>
        <div className="max-w-[700px] mx-auto px-5 md:px-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-8" style={{ color: '#2C1810' }}>
            Časté otázky
          </h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="p-5 rounded-xl border" style={{ borderColor: '#F0EDE8', background: 'white' }}>
                <h3 className="font-bold text-sm mb-2" style={{ color: '#2C1810' }}>{faq.q}</h3>
                <p className="text-sm" style={{ color: '#8B6550' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zpět na web */}
      <div className="py-8 text-center">
        <Link href="/" className="text-sm font-semibold no-underline" style={{ color: '#8B6550' }}>
          ← Zpět na Zozio
        </Link>
      </div>
    </main>
  )
}
