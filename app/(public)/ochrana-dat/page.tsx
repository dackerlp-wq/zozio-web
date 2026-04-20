import type { Metadata } from 'next'
import { LegalPage } from '@/components/public/LegalPage'

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů | Zozio',
  description: 'Zásady ochrany osobních údajů platformy Zozio — jak zpracováváme vaše data, jaká máte práva a jak nás kontaktovat.',
  robots: { index: true, follow: true },
}

const UPDATED = '2026-04-19'

export default function OchranaDataPage() {
  return (
    <LegalPage title="Ochrana osobních údajů" updated={UPDATED}>

      <div className="highlight">
        <p>
          Zozio s.r.o. zpracovává vaše osobní údaje jako <strong>správce</strong> v souladu s nařízením
          GDPR (EU) 2016/679 a zákonem č. 110/2019 Sb. o zpracování osobních údajů.
          Tato stránka vysvětluje, jaké údaje sbíráme, proč a jak je chráníme.
        </p>
      </div>

      <div>
        <h2>1. Správce osobních údajů</h2>
        <p>
          <strong>Zozio s.r.o.</strong><br />
          E-mail: <a href="mailto:team@zozio.cz">team@zozio.cz</a><br />
          Web: <a href="https://zozio.cz">zozio.cz</a>
        </p>
        <p>
          Nemáme jmenovaného pověřence pro ochranu osobních údajů (DPO), protože nejsme
          povinni jej jmenovat. Dotazy k ochraně dat směřujte na výše uvedený e-mail.
        </p>
      </div>

      <div>
        <h2>2. Jaké osobní údaje zpracováváme a proč</h2>

        <h3>2.1 Registrace a uživatelský účet</h3>
        <table>
          <thead>
            <tr><th>Údaj</th><th>Účel</th><th>Právní základ</th><th>Doba uchování</th></tr>
          </thead>
          <tbody>
            <tr><td>E-mailová adresa</td><td>Přihlášení, komunikace</td><td>Plnění smlouvy (čl. 6 odst. 1 písm. b)</td><td>Po dobu existence účtu + 30 dní</td></tr>
            <tr><td>Jméno a příjmení</td><td>Personalizace, komunikace</td><td>Plnění smlouvy</td><td>Po dobu existence účtu + 30 dní</td></tr>
            <tr><td>Heslo (bcrypt hash)</td><td>Autentizace</td><td>Plnění smlouvy</td><td>Po dobu existence účtu</td></tr>
            <tr><td>Datum a čas registrace</td><td>Bezpečnost, audit</td><td>Oprávněný zájem (čl. 6 odst. 1 písm. f)</td><td>Po dobu existence účtu + 30 dní</td></tr>
          </tbody>
        </table>

        <h3>2.2 Žádost o adopci</h3>
        <table>
          <thead>
            <tr><th>Údaj</th><th>Účel</th><th>Právní základ</th><th>Doba uchování</th></tr>
          </thead>
          <tbody>
            <tr><td>Jméno a příjmení</td><td>Identifikace žadatele pro útulek</td><td>Plnění smlouvy / oprávněný zájem</td><td>2 roky od podání žádosti</td></tr>
            <tr><td>E-mail</td><td>Komunikace s útulkem</td><td>Plnění smlouvy</td><td>2 roky od podání žádosti</td></tr>
            <tr><td>Telefon</td><td>Komunikace s útulkem</td><td>Souhlas (dobrovolné pole)</td><td>2 roky od podání žádosti</td></tr>
            <tr><td>Zpráva žadatele</td><td>Přenos informací útulku</td><td>Plnění smlouvy</td><td>2 roky od podání žádosti</td></tr>
          </tbody>
        </table>
        <p>
          Osobní údaje žadatelů jsou sdíleny s příslušnou institucí (útulkem), která je
          <strong> samostatným správcem</strong> těchto dat pro účely posouzení žádosti o adopci.
        </p>

        <h3>2.3 Dobrovolnictví</h3>
        <table>
          <thead>
            <tr><th>Údaj</th><th>Účel</th><th>Právní základ</th><th>Doba uchování</th></tr>
          </thead>
          <tbody>
            <tr><td>Jméno a příjmení</td><td>Identifikace dobrovolníka</td><td>Souhlas (čl. 6 odst. 1 písm. a)</td><td>2 roky nebo do odvolání souhlasu</td></tr>
            <tr><td>E-mail</td><td>Komunikace s institucí</td><td>Souhlas</td><td>2 roky nebo do odvolání souhlasu</td></tr>
            <tr><td>Telefon</td><td>Komunikace s institucí</td><td>Souhlas</td><td>2 roky nebo do odvolání souhlasu</td></tr>
            <tr><td>Zpráva / motivace</td><td>Posouzení institucí</td><td>Souhlas</td><td>2 roky nebo do odvolání souhlasu</td></tr>
          </tbody>
        </table>

        <h3>2.4 Newsletter</h3>
        <table>
          <thead>
            <tr><th>Údaj</th><th>Účel</th><th>Právní základ</th><th>Doba uchování</th></tr>
          </thead>
          <tbody>
            <tr><td>E-mailová adresa</td><td>Zasílání newsletteru</td><td>Souhlas (čl. 6 odst. 1 písm. a)</td><td>Do odhlášení + 30 dní</td></tr>
            <tr><td>Datum přihlášení</td><td>Důkaz souhlasu</td><td>Právní povinnost (čl. 6 odst. 1 písm. c)</td><td>3 roky od odhlášení</td></tr>
          </tbody>
        </table>
        <p>
          Odběr newsletteru lze kdykoli zrušit kliknutím na odkaz „Odhlásit" v každém e-mailu
          nebo e-mailem na <a href="mailto:team@zozio.cz">team@zozio.cz</a>.
        </p>

        <h3>2.5 Inzerce (reklamní portál)</h3>
        <table>
          <thead>
            <tr><th>Údaj</th><th>Účel</th><th>Právní základ</th><th>Doba uchování</th></tr>
          </thead>
          <tbody>
            <tr><td>Název firmy</td><td>Identifikace inzerenta, fakturace</td><td>Plnění smlouvy</td><td>10 let (zákon o účetnictví)</td></tr>
            <tr><td>IČO / DIČ</td><td>Fakturace, ověření DPH</td><td>Právní povinnost</td><td>10 let</td></tr>
            <tr><td>Fakturační adresa</td><td>Fakturace</td><td>Plnění smlouvy / právní povinnost</td><td>10 let</td></tr>
            <tr><td>Kontaktní e-mail</td><td>Komunikace, schvalování reklam</td><td>Plnění smlouvy</td><td>Po dobu smluvního vztahu + 3 roky</td></tr>
          </tbody>
        </table>

        <h3>2.6 Oblíbená zvířata a instituce</h3>
        <p>
          Ukládáme seznam zvířat a institucí, které jste si uložili jako oblíbené, vázaný na váš účet.
          Právní základ: plnění smlouvy (poskytnutí funkce oblíbených). Uchováváme po dobu existence účtu.
        </p>

        <h3>2.7 Správci institucí a zaměstnanci</h3>
        <p>
          Pro uživatele s rolí správce nebo zaměstnance instituce uchováváme navíc přiřazení k instituci
          a záznamy o prováděných akcích (audit log) po dobu 1 roku. Právní základ: oprávněný zájem
          (bezpečnost a integrita dat).
        </p>
      </div>

      <div>
        <h2>3. Soubory cookie</h2>
        <h3>3.1 Nezbytné cookies</h3>
        <p>
          Platforma využívá session cookies nezbytné pro přihlášení a autentizaci (Supabase Auth).
          Tyto cookies nelze vypnout — bez nich přihlášení nefunguje. Právní základ: oprávněný zájem.
        </p>
        <table>
          <thead>
            <tr><th>Cookie</th><th>Účel</th><th>Platnost</th></tr>
          </thead>
          <tbody>
            <tr><td><code>sb-*-auth-token</code></td><td>Autentizační session (Supabase)</td><td>Do odhlášení / max. 1 rok</td></tr>
            <tr><td><code>sb-*-auth-token.0</code>, <code>.1</code></td><td>Chunked auth token</td><td>Do odhlášení / max. 1 rok</td></tr>
          </tbody>
        </table>

        <h3>3.2 Analytické cookies</h3>
        <p>
          Platformu monitorujeme pomocí <strong>Vercel Analytics</strong>, která nepracuje s cookies
          a nepřiřazuje data ke konkrétní osobě — jde o plně anonymní agregované metriky
          (počet návštěv, stránek, zařízení). IP adresy jsou anonymizovány před zpracováním.
        </p>
        <p>
          Nepoužíváme Google Analytics, Facebook Pixel ani žádné jiné sledovací nástroje třetích stran.
        </p>
      </div>

      <div>
        <h2>4. Příjemci osobních údajů (zpracovatelé)</h2>
        <p>
          Vaše data sdílíme pouze s důvěryhodnými zpracovateli, kteří poskytují záruky v souladu s GDPR:
        </p>
        <table>
          <thead>
            <tr><th>Zpracovatel</th><th>Účel</th><th>Umístění dat</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Supabase Inc.</strong></td><td>Databáze, autentizace, úložiště souborů</td><td>EU (Frankfurt, AWS eu-central-1)</td></tr>
            <tr><td><strong>Vercel Inc.</strong></td><td>Hosting, CDN, anonymní analytika</td><td>EU edge + US zpracování; Standard Contractual Clauses</td></tr>
            <tr><td><strong>Resend Inc.</strong></td><td>Odesílání transakčních e-mailů</td><td>US; Standard Contractual Clauses</td></tr>
            <tr><td><strong>Darujme.cz (Nadace Via)</strong></td><td>Zpracování dárů (sbírky)</td><td>ČR</td></tr>
          </tbody>
        </table>
        <p>
          S útulky a záchranými stanicemi sdílíme osobní údaje žadatelů o adopci a dobrovolníků.
          Tyto instituce jsou samostatnými správci a odpovídají za zpracování dat v souladu s GDPR.
        </p>
        <p>
          <strong>Neprodáváme</strong> vaše osobní údaje žádným třetím stranám pro marketingové účely.
        </p>
      </div>

      <div>
        <h2>5. Vaše práva</h2>
        <p>V souladu s GDPR máte následující práva:</p>
        <ul>
          <li><strong>Právo na přístup (čl. 15)</strong> — kdykoli nás požádejte o kopii vašich osobních údajů.</li>
          <li><strong>Právo na opravu (čl. 16)</strong> — opravte nepřesné údaje přímo v nastavení účtu nebo nás kontaktujte.</li>
          <li><strong>Právo na výmaz (čl. 17)</strong> — „právo být zapomenut" — odstraníme vaše údaje, pokud není důvod k jejich uchování.</li>
          <li><strong>Právo na omezení zpracování (čl. 18)</strong> — v určitých případech můžete požadovat pozastavení zpracování.</li>
          <li><strong>Právo na přenositelnost (čl. 20)</strong> — dostanete vaše data ve strojově čitelném formátu (JSON).</li>
          <li><strong>Právo vznést námitku (čl. 21)</strong> — proti zpracování na základě oprávněného zájmu.</li>
          <li><strong>Právo odvolat souhlas</strong> — kdykoli a bez udání důvodu (newsletter, dobrovolnictví).</li>
        </ul>
        <p>
          Žádost uplatněte e-mailem na <a href="mailto:team@zozio.cz">team@zozio.cz</a>.
          Odpovíme do 30 dní od přijetí žádosti. Totožnost ověřujeme, abychom chránili váš účet.
        </p>
        <p>
          Máte také právo podat stížnost u dozorového orgánu —{' '}
          <strong>Úřadu pro ochranu osobních údajů (ÚOOÚ)</strong>:{' '}
          <a href="https://www.uoou.cz" target="_blank" rel="noreferrer">uoou.cz</a>.
        </p>
      </div>

      <div>
        <h2>6. Bezpečnost dat</h2>
        <p>
          Přijímáme technická a organizační opatření k ochraně vašich dat:
        </p>
        <ul>
          <li>Veškerá komunikace probíhá šifrovaně přes HTTPS (TLS 1.3).</li>
          <li>Hesla jsou ukládána pouze jako bcrypt hash — nikdy v čitelné podobě.</li>
          <li>Databáze je přístupná pouze přes Row Level Security (RLS) — každý uživatel vidí jen svá data.</li>
          <li>Přístupy k databázi jsou auditovány.</li>
          <li>Zálohy databáze jsou šifrované a uchovávány v EU.</li>
        </ul>
        <p>
          V případě bezpečnostního incidentu vás budeme informovat do 72 hodin, jak vyžaduje GDPR.
        </p>
      </div>

      <div>
        <h2>7. Přenos dat mimo EU</h2>
        <p>
          Část zpracování probíhá mimo EU (Vercel, Resend — USA). Přenos je zabezpečen prostřednictvím
          <strong> Standardních smluvních doložek (SCC)</strong> schválených Evropskou komisí.
          Data uložená v databázi jsou výhradně v EU (Supabase, Frankfurt).
        </p>
      </div>

      <div>
        <h2>8. Automatizované rozhodování a profilování</h2>
        <p>
          Nepoužíváme automatizované rozhodování ani profilování ve smyslu čl. 22 GDPR.
          Doporučení zvířat (řazení v katalogu) jsou technická, bez dopadu na práva a zájmy osob.
        </p>
      </div>

      <div>
        <h2>9. Nezletilé osoby</h2>
        <p>
          Platforma je určena osobám starším 16 let. Vědomě neshromažďujeme osobní údaje dětí mladších 16 let.
          Pokud jste rodič nebo zákonný zástupce a zjistíte, že dítě nám poskytlo osobní údaje,
          kontaktujte nás na <a href="mailto:team@zozio.cz">team@zozio.cz</a> a údaje neprodleně vymažeme.
        </p>
      </div>

      <div>
        <h2>10. Změny těchto zásad</h2>
        <p>
          O podstatných změnách vás informujeme e-mailem nebo upozorněním na platformě nejméně 14 dní předem.
          Aktuální verze je vždy dostupná na <a href="/ochrana-dat">zozio.cz/ochrana-dat</a>.
          Datum poslední aktualizace je uvedeno v záhlaví tohoto dokumentu.
        </p>
      </div>

      <div>
        <h2>11. Kontakt</h2>
        <p>
          Veškeré dotazy, žádosti nebo stížnosti k ochraně osobních údajů zasílejte na:{' '}
          <a href="mailto:team@zozio.cz">team@zozio.cz</a>
        </p>
        <p>
          Písemně na adresu provozovatele (k dispozici na vyžádání).
        </p>
      </div>

    </LegalPage>
  )
}
