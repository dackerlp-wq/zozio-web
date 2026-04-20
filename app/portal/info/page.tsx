import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Jak funguje inzerce | Zozio portál',
}

const SLOTS = [
  {
    icon: '🔳',
    name: 'Inline grid',
    where: 'Katalog zvířat (/adopt)',
    desc: 'Karta se zobrazí přímo v gridu zvířat k adopci — tam, kde lidé aktivně hledají mazlíčka. Ideální pro produkty a služby spojené s péčí o zvířata.',
    price: '1 490 Kč / měs.',
    reach: 'Vysoký — hlavní stránka adopcí',
  },
  {
    icon: '📌',
    name: 'Sidebar',
    where: 'Profil útulku, detail zvířete, články',
    desc: 'Postranní panel viditelný při čtení obsahu. Zobrazí se uživatelům, kteří se hlouběji zajímají o konkrétní útulek nebo zvíře.',
    price: '1 990 Kč / měs.',
    reach: 'Cílený — uživatelé s vysokým záměrem',
  },
  {
    icon: '🎯',
    name: 'Banner adopce',
    where: 'Stránka katalogu (/adopt)',
    desc: 'Široký horizontální banner umístěný na stránce s výpisem všech zvířat k adopci. Vysoká viditelnost pro návštěvníky procházející nabídku.',
    price: '2 990 Kč / měs.',
    reach: 'Velmi vysoký — vstup do katalogu',
  },
  {
    icon: '🏠',
    name: 'Banner homepage',
    where: 'Domovská stránka (/',
    desc: 'Prémiová pozice na titulní stránce Zozio. Ideální pro budování povědomí o značce u celé komunity milovníků zvířat.',
    price: '3 490 Kč / měs.',
    reach: 'Maximální — veškerá návštěvnost',
  },
  {
    icon: '🐾',
    name: 'Banner zvíře',
    where: 'Detail každého zvířete (/animals/[id])',
    desc: 'Banner přímo na stránce profilu zvířete — uživatel právě zvažuje adopci. Perfektní pro doplňkové produkty, pojištění nebo poradenství.',
    price: '1 990 Kč / měs.',
    reach: 'Cílený — uživatelé v procesu rozhodování',
  },
  {
    icon: '📬',
    name: 'Newsletter',
    where: 'E-mailový bulletin odběratelům',
    desc: 'Vaše reklama přímo v e-mailu, který chodí odběratelům Zozio. Osobní doručení do schránky loajálního publika.',
    price: '1 490 Kč / vydání',
    reach: 'Přímý — ověření odběratelé',
  },
]

const TARGETING = [
  {
    icon: '🗺️',
    title: 'Lokalita (kraje)',
    desc: 'Zvolte jeden nebo více krajů ČR. Reklama se bude zobrazovat přednostně návštěvníkům z vybraných oblastí. Výhoda: regionální cílení přináší slevu na cenu kampaně.',
  },
  {
    icon: '🏠',
    title: 'Konkrétní útulky a stanice',
    desc: 'Vyberte instituce, u jejichž obsahu chcete mít vyšší prioritu. Například: pokud vyberete útulek v Praze, vaše reklama se zobrazí s větší pravděpodobností na jejich profilu, u jejich zvířat a u jejich článků.',
  },
  {
    icon: '📖',
    title: 'Kategorie článků',
    desc: 'Cílte na čtenáře konkrétního obsahu — příběhy adopce, záchranné příběhy, tipy a rady nebo novinky. Reklama se zobrazí s vyšší prioritou v sidebaru u článků dané kategorie.',
  },
]

const PROCESS = [
  { step: '1', title: 'Vytvořte reklamu', desc: 'Nastavte kreativu, zvolte plochy a dobu trvání kampaně.' },
  { step: '2', title: 'Odešlete ke schválení', desc: 'Tým Zozio reklamu zkontroluje do 1–2 pracovních dnů.' },
  { step: '3', title: 'Potvrdíme a vystavíme fakturu', desc: 'Po schválení dostanete fakturu a reklama se spustí v dohodnutém termínu.' },
  { step: '4', title: 'Sledujte výsledky', desc: 'V portálu vidíte počet zobrazení, kliků a CTR v reálném čase.' },
]

export default function InfoPage() {
  return (
    <div className="space-y-10 max-w-[800px]">

      {/* Hero */}
      <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #E8634A 0%, #C94F38 100%)' }}>
        <h1 className="font-display font-extrabold text-2xl mb-2">Jak funguje inzerce na Zozio?</h1>
        <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Zozio je platforma pro útulky a záchranné stanice v ČR a SR. Vaše reklama se zobrazuje
          lidem, kteří aktivně hledají mazlíčka nebo se zajímají o dobré zacházení se zvířaty —
          jde o velmi cílené a angažované publikum.
        </p>
      </div>

      {/* Reklamní plochy */}
      <div>
        <h2 className="font-display font-bold text-xl mb-1" style={{ color: '#1A0F0A' }}>
          Kde se reklamy zobrazují?
        </h2>
        <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
          Každá plocha má jiné umístění a cenu. Lze kombinovat více ploch najednou.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SLOTS.map(slot => (
            <div key={slot.name} className="bg-white rounded-xl border p-5" style={{ borderColor: '#F0EDE8' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{slot.icon}</span>
                  <span className="font-display font-bold text-sm" style={{ color: '#1A0F0A' }}>{slot.name}</span>
                </div>
                <span className="text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: '#FAECE7', color: '#E8634A' }}>
                  {slot.price}
                </span>
              </div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#8B6550' }}>📍 {slot.where}</p>
              <p className="text-xs leading-relaxed mb-2" style={{ color: '#6B4030' }}>{slot.desc}</p>
              <p className="text-xs font-semibold" style={{ color: '#4CAF50' }}>📊 {slot.reach}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cílení */}
      <div>
        <h2 className="font-display font-bold text-xl mb-1" style={{ color: '#1A0F0A' }}>
          Možnosti cílení
        </h2>
        <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
          Cílení funguje jako <strong>boost</strong> — vaše reklama se zobrazuje všem, ale u cílených
          skupin má vyšší prioritu. Úzce cílené reklamy navíc mohou mít nižší cenu.
        </p>
        <div className="space-y-3">
          {TARGETING.map(t => (
            <div key={t.title} className="bg-white rounded-xl border p-5 flex gap-4" style={{ borderColor: '#F0EDE8' }}>
              <span className="text-2xl flex-shrink-0">{t.icon}</span>
              <div>
                <div className="font-display font-bold text-sm mb-1" style={{ color: '#1A0F0A' }}>{t.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: '#6B4030' }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Jak to funguje — proces */}
      <div>
        <h2 className="font-display font-bold text-xl mb-5" style={{ color: '#1A0F0A' }}>
          Jak probíhá spuštění kampaně?
        </h2>
        <div className="space-y-3">
          {PROCESS.map(p => (
            <div key={p.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-display font-bold text-sm text-white"
                style={{ background: '#E8634A' }}>
                {p.step}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="font-bold text-sm" style={{ color: '#1A0F0A' }}>{p.title}</div>
                <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slevy */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-4" style={{ color: '#1A0F0A' }}>Dostupné slevy</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-base flex-shrink-0">📅</span>
            <div>
              <div className="text-sm font-bold" style={{ color: '#2C1810' }}>Sleva za délku kampaně</div>
              <div className="text-xs" style={{ color: '#6B4030' }}>60+ dní → −10 % | 90+ dní → −20 %</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-base flex-shrink-0">🗺️</span>
            <div>
              <div className="text-sm font-bold" style={{ color: '#2C1810' }}>Sleva za regionální cílení</div>
              <div className="text-xs" style={{ color: '#6B4030' }}>1–5 krajů → −25 % | 6–13 krajů → −10 %</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-base flex-shrink-0">🎉</span>
            <div>
              <div className="text-sm font-bold" style={{ color: '#2C1810' }}>Maximální kombinovaná sleva</div>
              <div className="text-xs" style={{ color: '#6B4030' }}>Délka + lokalita dohromady max. 35 %</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="font-display font-bold text-xl mb-5" style={{ color: '#1A0F0A' }}>Časté dotazy</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Jak se počítají zobrazení?',
              a: 'Zobrazení (impression) je zaznamenáno, když je reklama viditelná alespoň 50 % plochy po dobu nejméně 1 sekundy. Klik je každé přímé kliknutí na reklamu.',
            },
            {
              q: 'Kde vidím výsledky kampaně?',
              a: 'V sekci "Moje reklamy" v portálu. Každá reklama má detailní přehled zobrazení, kliků a CTR — denní statistiky i srovnání se standardem odvětví.',
            },
            {
              q: 'Kdy reklama začne běžet?',
              a: 'Po schválení týmem Zozio (1–2 pracovní dny) a zaplacení faktury. Datum spuštění si nastavíte sami v poli "Aktivní od".',
            },
            {
              q: 'Mohu reklamu pozastavit nebo upravit?',
              a: 'Ano — kontaktujte nás na team@zozio.cz. Úpravy kreativy je možné provádět i v průběhu kampaně, změna slotů nebo doby trvání podléhá přeschválení.',
            },
            {
              q: 'Jaké jsou podmínky obsahu?',
              a: 'Reklamy musí souviset se zvířaty, péčí o ně nebo tématem ochrany přírody. Tým Zozio si vyhrazuje právo odmítnout nevhodný obsah.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-xl border p-5" style={{ borderColor: '#F0EDE8' }}>
              <p className="font-bold text-sm mb-1.5" style={{ color: '#1A0F0A' }}>{q}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#6B4030' }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl p-8 text-center border" style={{ background: '#FAECE7', borderColor: '#FECACA' }}>
        <h2 className="font-display font-bold text-xl mb-2" style={{ color: '#1A0F0A' }}>Připraveni spustit kampaň?</h2>
        <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
          Vytvořte první reklamu za 5 minut. Tým Zozio ji zkontroluje a spustí.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/portal/ads/new"
            className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold text-white no-underline transition-all hover:opacity-90"
            style={{ background: '#E8634A' }}>
            Vytvořit reklamu →
          </Link>
          <a href="mailto:team@zozio.cz"
            className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold no-underline transition-all hover:opacity-80"
            style={{ background: '#F0EDE8', color: '#6B4030' }}>
            Napsat týmu Zozio
          </a>
        </div>
      </div>

    </div>
  )
}
