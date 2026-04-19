import type { Metadata } from 'next'
import { LegalPage } from '@/components/public/LegalPage'

export const metadata: Metadata = {
  title: 'Podmínky použití | Zozio',
  description: 'Podmínky použití platformy Zozio — pravidla pro návštěvníky, útulky, záchranné stanice a inzerenty.',
  robots: { index: true, follow: true },
}

const UPDATED = '2026-04-19'

export default function PodminkyPage() {
  return (
    <LegalPage title="Podmínky použití" updated={UPDATED}>

      <div className="highlight">
        <p>
          Tyto podmínky upravují používání platformy Zozio provozované společností <strong>Zozio s.r.o.</strong>
          (dále jen „Zozio" nebo „my"). Používáním platformy souhlasíte s těmito podmínkami.
        </p>
      </div>

      <div>
        <h2>1. Základní pojmy</h2>
        <ul>
          <li><strong>Platforma</strong> — webová aplikace dostupná na zozio.cz a jejích subdoménách.</li>
          <li><strong>Návštěvník</strong> — nepřihlášený uživatel procházející platformu.</li>
          <li><strong>Registrovaný uživatel</strong> — fyzická osoba s vytvořeným účtem na platformě.</li>
          <li><strong>Instituce</strong> — registrovaný útulek nebo záchranná stanice spravující profil na platformě.</li>
          <li><strong>Inzerent</strong> — firma nebo fyzická osoba inzerující na platformě prostřednictvím reklamního portálu.</li>
          <li><strong>Obsah</strong> — veškerá data, texty, fotografie a jiné materiály vložené do platformy.</li>
        </ul>
      </div>

      <div>
        <h2>2. Provozovatel platformy</h2>
        <p>
          Platformu Zozio provozuje společnost <strong>Zozio s.r.o.</strong>, se sídlem v České republice.
          Kontakt: <a href="mailto:team@zozio.cz">team@zozio.cz</a>.
        </p>
      </div>

      <div>
        <h2>3. Registrace a uživatelský účet</h2>
        <h3>3.1 Podmínky registrace</h3>
        <p>
          Registrace je možná pro fyzické osoby starší 16 let. Při registraci uvádíte pravdivé a aktuální údaje.
          Jeden uživatel smí mít pouze jeden osobní účet.
        </p>
        <h3>3.2 Zabezpečení účtu</h3>
        <p>
          Jste zodpovědni za bezpečnost svého hesla a za veškerou aktivitu provedenou pod vaším účtem.
          Při podezření na neoprávněný přístup nás neprodleně kontaktujte na <a href="mailto:team@zozio.cz">team@zozio.cz</a>.
        </p>
        <h3>3.3 Typy účtů</h3>
        <ul>
          <li><strong>Návštěvník (visitor)</strong> — přihlášený uživatel bez vazby na instituci. Může ukládat oblíbená zvířata, sledovat sbírky a podávat žádosti o adopci.</li>
          <li><strong>Správce instituce (institution_admin)</strong> — spravuje profil útulku nebo záchranné stanice, zvířata, sbírky a žádosti o adopci.</li>
          <li><strong>Zaměstnanec instituce (staff)</strong> — omezený přístup ke správě instituce na základě pozvánky.</li>
          <li><strong>Superadmin</strong> — interní administrátor Zozio.</li>
        </ul>
      </div>

      <div>
        <h2>4. Pravidla pro instituce (útulky a záchranné stanice)</h2>
        <h3>4.1 Registrace instituce</h3>
        <p>
          Registrace instituce podléhá schválení týmem Zozio. Vyhrazujeme si právo odmítnout registraci
          bez uvedení důvodu nebo zrušit schválení, pokud instituce porušuje tyto podmínky.
        </p>
        <h3>4.2 Povinnosti instituce</h3>
        <ul>
          <li>Uvádět pravdivé a aktuální informace o zvířatech a jejich stavu.</li>
          <li>Aktualizovat stav zvířat při změně (adoptováno, uhynulo apod.) neprodleně.</li>
          <li>Nezveřejňovat zvířata, která nejsou v péči instituce.</li>
          <li>Nakládat s osobními údaji žadatelů o adopci v souladu s GDPR.</li>
          <li>Respektovat žadatele o adopci a komunikovat s nimi slušně a v přiměřené době.</li>
        </ul>
        <h3>4.3 Zakázaný obsah</h3>
        <p>Je zakázáno zveřejňovat:</p>
        <ul>
          <li>nepravdivé nebo zavádějící informace o zvířatech,</li>
          <li>fotografie, které nevykazují skutečný stav zvířete,</li>
          <li>obsah porušující práva třetích stran (autorská práva, ochranné známky apod.),</li>
          <li>jakýkoli obsah propagující týrání zvířat.</li>
        </ul>
        <h3>4.4 Ceník a předplatné</h3>
        <p>
          Platforma nabízí bezplatný i placený plán (viz <a href="/pricing">ceník</a>). Podmínky předplatného
          jsou součástí smlouvy uzavřené při výběru placeného plánu. Zozio si vyhrazuje právo upravit ceník
          s předstihem 30 dní.
        </p>
      </div>

      <div>
        <h2>5. Adopce zvířat</h2>
        <h3>5.1 Žádosti o adopci</h3>
        <p>
          Platforma Zozio je zprostředkovatelem kontaktu mezi zájemcem o adopci a institucí.
          <strong> Zozio není stranou adopční smlouvy</strong> a neodpovídá za průběh adopce, zdravotní stav
          zvířete ani za jednání instituce či zájemce.
        </p>
        <h3>5.2 Odpovědnost zájemce</h3>
        <p>
          Zájemce o adopci bere na vědomí, že:
        </p>
        <ul>
          <li>informace o zvířatech pochází od institucí a Zozio je neověřuje,</li>
          <li>instituci nelze právně zavázat k předání zvířete na základě žádosti přes platformu,</li>
          <li>adopční podmínky (poplatek, smlouva, podmínky předání) určuje výhradně instituce.</li>
        </ul>
      </div>

      <div>
        <h2>6. Dobrovolníci</h2>
        <p>
          Přihlášení k dobrovolnictví prostřednictvím platformy je nezávazný projev zájmu.
          Zozio nezprostředkovává pracovněprávní ani jiné závazné vztahy mezi dobrovolníky a institucemi.
          Veškerá ujednání probíhají přímo mezi dobrovolníkem a institucí.
        </p>
      </div>

      <div>
        <h2>7. Sbírky (fundraising)</h2>
        <p>
          Sbírky na platformě provozují výhradně registrované a schválené instituce prostřednictvím
          integrované služby <strong>Darujme.cz</strong>. Zozio finanční prostředky nevybírá, nezpracovává
          ani neskladuje. Za správnost informací o sbírce a nakládání s vybranými prostředky odpovídá
          výhradně instituce.
        </p>
      </div>

      <div>
        <h2>8. Inzerce</h2>
        <h3>8.1 Podmínky inzerce</h3>
        <p>
          Inzeráty musí tematicky souviset se zvířaty, péčí o ně, veterinárními službami nebo ochranou přírody.
          Zozio si vyhrazuje právo odmítnout nebo smazat jakýkoli inzerát bez uvedení důvodu.
        </p>
        <h3>8.2 Schvalovací proces</h3>
        <p>
          Každý inzerát prochází ručním schválením týmu Zozio (obvykle do 48 pracovních hodin).
          Reklama se nezobrazuje před schválením a uhrazením faktury.
        </p>
        <h3>8.3 Fakturace a platby</h3>
        <p>
          Ceny inzerce jsou uvedeny na stránce <a href="/inzerujte">/inzerujte</a> a v portálu inzerentů.
          Faktury jsou splatné do 14 dní. Neuhrazení faktury má za následek zastavení kampaně.
          Všechny ceny jsou bez DPH (21 %).
        </p>
        <h3>8.4 Odpovědnost inzerenta</h3>
        <p>
          Inzerent odpovídá za to, že obsah reklamy je pravdivý, neporušuje práva třetích stran
          a je v souladu s právními předpisy ČR (zejm. zákon č. 40/1995 Sb. o regulaci reklamy).
        </p>
      </div>

      <div>
        <h2>9. Duševní vlastnictví</h2>
        <h3>9.1 Obsah Zozio</h3>
        <p>
          Design platformy, loga, texty a jiné materiály vytvořené Zozio jsou chráněny autorským právem.
          Jejich použití bez písemného souhlasu je zakázáno.
        </p>
        <h3>9.2 Obsah uživatelů a institucí</h3>
        <p>
          Vložením obsahu (fotografie, texty) do platformy udělujete Zozio nevýhradní, bezúplatnou licenci
          k jeho zobrazování v rámci platformy a jejích propagačních materiálů. Tato licence zaniká
          odstraněním obsahu z platformy.
        </p>
        <p>
          Ručíte za to, že máte právo obsah vložit a že neporušuje práva třetích stran.
        </p>
      </div>

      <div>
        <h2>10. Omezení odpovědnosti</h2>
        <p>
          Platforma je poskytována „tak jak je" (<em>as-is</em>). Zozio neodpovídá za:
        </p>
        <ul>
          <li>škody vzniklé z použití nebo nemožnosti použití platformy,</li>
          <li>přesnost, úplnost nebo aktuálnost obsahu vloženého uživateli nebo institucemi,</li>
          <li>výpadky služby způsobené třetími stranami (Supabase, Vercel, Resend, Darujme.cz),</li>
          <li>jednání uživatelů, institucí nebo inzerentů mimo platformu.</li>
        </ul>
        <p>
          Maximální odpovědnost Zozio vůči inzerentovi je omezena na výši uhrazené fakturace
          za poslední 3 měsíce.
        </p>
      </div>

      <div>
        <h2>11. Zrušení účtu a smazání dat</h2>
        <p>
          Svůj účet můžete kdykoli zrušit v nastavení profilu nebo zasláním žádosti na <a href="mailto:team@zozio.cz">team@zozio.cz</a>.
          Po zrušení účtu jsou osobní údaje smazány do 30 dní, s výjimkou dat, která musíme uchovávat
          ze zákonných důvodů (zejm. fakturační záznamy — 10 let dle zákona o účetnictví).
        </p>
        <p>
          Instituce může požádat o odebrání z platformy stejným způsobem. Data zvířat (bez osobních údajů)
          mohou být zachována v anonymizované podobě pro statistické účely.
        </p>
      </div>

      <div>
        <h2>12. Změny podmínek</h2>
        <p>
          Zozio si vyhrazuje právo tyto podmínky kdykoli upravit. O podstatných změnách budete informováni
          e-mailem nebo upozorněním na platformě nejméně 14 dní předem. Pokračování v používání platformy
          po uvedené lhůtě znamená souhlas s novými podmínkami.
        </p>
      </div>

      <div>
        <h2>13. Rozhodné právo a řešení sporů</h2>
        <p>
          Tyto podmínky se řídí právem České republiky. Případné spory budou řešeny příslušným
          soudem v České republice. Spotřebitelé mají právo na mimosoudní řešení sporů prostřednictvím
          České obchodní inspekce (<a href="https://www.coi.cz" target="_blank" rel="noreferrer">coi.cz</a>)
          nebo evropské platformy ODR (<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">ec.europa.eu/consumers/odr</a>).
        </p>
      </div>

      <div>
        <h2>14. Kontakt</h2>
        <p>
          Dotazy k těmto podmínkám zasílejte na <a href="mailto:team@zozio.cz">team@zozio.cz</a>.
        </p>
      </div>

    </LegalPage>
  )
}
