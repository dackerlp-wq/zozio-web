import React from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PrintControls } from '@/components/admin/PrintControls'

/* ─── Helpers ─────────────────────────────────────────── */

function czDate(d: string | null | undefined): string {
  if (!d) return '—'
  const s = String(d).slice(0, 10)
  const [y, m, day] = s.split('-')
  return `${day}.${m}.${y}`
}

function sexLabel(sex: unknown): string {
  if (sex === 'male' || sex === 'm') return 'Samec'
  if (sex === 'female' || sex === 'f') return 'Samice'
  return '—'
}

function yesNo(v: unknown): string {
  if (v === true || v === 'yes' || v === 'ok') return 'Ano'
  if (v === false || v === 'no') return 'Ne'
  return '—'
}

function exitTypeLabel(t: unknown): string {
  const map: Record<string, string> = {
    adoption: 'Adopce', death: 'Úhyn', transfer: 'Převod', escape: 'Útěk',
    return_to_owner: 'Vrácení majiteli', euthanasia: 'Eutanázie', release: 'Vypuštění',
  }
  return map[String(t ?? '')] ?? String(t ?? '—')
}

function intakeReasonLabel(r: unknown): string {
  const map: Record<string, string> = {
    found: 'Nálezce', stray: 'Toulavé', surrender: 'Vzdání se', confiscated: 'Konfiskace',
    transfer: 'Převod', other: 'Jiné',
  }
  return map[String(r ?? '')] ?? String(r ?? '—')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

/* ─── Print CSS ─────────────────────────────────────────── */
const PRINT_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111; margin: 0; background: #f0ede8; }

  /* Browser view: push content below fixed control bar (target the content wrapper, not topbar) */
  main > div + div { padding-top: 60px !important; }

  @media print {
    @page { size: A4; margin: 0; }

    /* Hide fixed UI chrome */
    #print-controls { display: none !important; }

    /* Hide admin sidebar & bottom nav */
    aside { display: none !important; }
    nav   { display: none !important; }

    /* Hide admin topbar (first child of main) */
    main > div:first-child { display: none !important; }

    /* Reset main layout */
    body  { background: white !important; }
    main  { margin-left: 0 !important; padding: 0 !important; }

    /* Reset content wrapper padding/max-width */
    main > div:last-child {
      max-width: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Clean up print-page */
    .print-page {
      box-shadow: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
      padding: 1.5cm !important;
      width: 100% !important;
      min-height: auto !important;
    }
  }

  .print-page {
    background: white;
    width: 21cm;
    min-height: 29.7cm;
    margin: 80px auto 40px;
    padding: 2cm;
    box-shadow: 0 2px 20px rgba(0,0,0,.12);
    border-radius: 6px;
  }

  /* Typography */
  h1 { font-size: 16pt; font-weight: 900; margin: 0 0 4px; color: #1a1a1a; }
  h2 { font-size: 12pt; font-weight: 900; margin: 18px 0 8px; color: #1a1a1a; border-bottom: 2px solid #e0dbd5; padding-bottom: 4px; }
  h3 { font-size: 10pt; font-weight: 700; margin: 12px 0 6px; color: #333; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 12px; }
  th { background: #2C1810; color: white; padding: 6px 8px; text-align: left; font-weight: 700; font-size: 9pt; }
  td { padding: 5px 8px; border-bottom: 1px solid #e8e4e0; vertical-align: top; }
  tr:nth-child(even) td { background: #faf8f6; }

  /* Field rows */
  .field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; margin-bottom: 6px; }
  .field-grid.cols3 { grid-template-columns: repeat(3, 1fr); }
  .field-item { border: 1px solid #ddd; padding: 5px 8px; }
  .field-item + .field-item { border-left: none; }
  .field-item:nth-child(n+3) { border-top: none; }
  .field-label { font-size: 7.5pt; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; display: block; margin-bottom: 2px; }
  .field-value { font-size: 10pt; font-weight: 700; color: #111; min-height: 16px; }

  /* Signature */
  .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
  .sig-box { border-top: 2px solid #333; padding-top: 6px; }
  .sig-label { font-size: 9pt; color: #555; }

  /* Doc header */
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #2C1810; }
  .doc-header-left h1 { color: #2C1810; }
  .doc-header-right { text-align: right; font-size: 9pt; color: #555; }
  .doc-number { font-size: 10pt; font-weight: 900; color: #2C1810; }

  /* Stats grid */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #ddd; margin-bottom: 16px; }
  .stat-cell { background: white; padding: 12px; text-align: center; }
  .stat-num { font-size: 22pt; font-weight: 900; color: #2C1810; line-height: 1; }
  .stat-lbl { font-size: 8pt; color: #666; font-weight: 700; text-transform: uppercase; }

  .note-text { font-size: 8pt; color: #666; font-style: italic; margin-top: 8px; }
  .page-break { page-break-after: always; }
`

/* ─── Doc header component ──────────────────────────────── */
function DocHeader({
  title,
  subtitle,
  institutionName,
  docNumber,
  date,
}: {
  title: string
  subtitle?: string
  institutionName: string
  docNumber?: string
  date?: string
}) {
  return (
    <div className="doc-header">
      <div className="doc-header-left">
        <h1>{title}</h1>
        {subtitle && <div style={{ fontSize: '10pt', color: '#555', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      <div className="doc-header-right">
        <div style={{ fontWeight: 900, fontSize: '11pt', color: '#111' }}>{institutionName}</div>
        {docNumber && <div className="doc-number">č. {docNumber}</div>}
        <div style={{ marginTop: '4px' }}>Datum tisku: {czDate(date ?? new Date().toISOString().slice(0, 10))}</div>
      </div>
    </div>
  )
}

/* ─── Field grid helper ─────────────────────────────────── */
function Fields({ items, cols = 2 }: { items: [string, string | null | undefined][]; cols?: 2 | 3 }) {
  return (
    <div className={`field-grid${cols === 3 ? ' cols3' : ''}`}>
      {items.map(([label, value]) => (
        <div className="field-item" key={label}>
          <span className="field-label">{label}</span>
          <div className="field-value">{value ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DOCUMENT TEMPLATES
══════════════════════════════════════════════════════════ */

/* ─── animal-card ─────────────────────────────────────── */
function AnimalCard({ animal, inst }: { animal: Row; inst: string }) {
  return (
    <div className="print-page">
      <DocHeader
        title="Veterinární karta zvířete"
        subtitle="Evidence dle §25 zák. č. 246/1992 Sb."
        institutionName={inst}
        docNumber={animal.evidence_number ?? undefined}
      />

      <h2>Identifikace zvířete</h2>
      <Fields items={[
        ['Jméno', animal.name],
        ['Druh', animal.species_name ?? animal.species_id ?? '—'],
        ['Pohlaví', sexLabel(animal.sex)],
        ['Rok narození', animal.birth_year],
        ['Barva / zbarvení', animal.color],
        ['Hmotnost (kg)', animal.weight_kg],
      ]} />
      <Fields items={[
        ['Plemeno', animal.breed],
        ['Číslo čipu', animal.chip_number],
        ['Datum čipování', czDate(animal.chip_date)],
        ['Číslo pasu', animal.passport_number],
        ['Číslo průkazu (evidence)', animal.evidence_number],
        ['Tetování', animal.tattoo_number ?? '—'],
      ]} />

      <h2>Příjem</h2>
      <Fields items={[
        ['Datum příjmu', czDate(animal.intake_date)],
        ['Čas příjmu', animal.intake_time ?? '—'],
        ['Důvod příjmu', intakeReasonLabel(animal.intake_reason)],
        ['Přijal pracovník', animal.intake_worker ?? '—'],
        ['Místo nálezu', animal.found_location ?? '—'],
        ['Datum nálezu', czDate(animal.found_date)],
      ]} />
      <Fields items={[
        ['Nálezce / jméno', animal.intake_finder_name ?? animal.finder_name ?? '—'],
        ['Telefon', animal.intake_finder_phone ?? animal.finder_phone ?? '—'],
        ['Adresa', animal.intake_finder_address ?? '—'],
        ['Email', animal.intake_finder_email ?? '—'],
        ['Předchozí majitel', animal.previous_owner ?? '—'],
        ['Telefon majitele', animal.previous_owner_phone ?? '—'],
      ]} />
      {animal.intake_notes && (
        <p className="note-text">Poznámka k příjmu: {animal.intake_notes}</p>
      )}

      <h2>Karanténa</h2>
      <Fields items={[
        ['Karanténa zahájena', czDate(animal.quarantine_start)],
        ['Karanténa ukončena', czDate(animal.quarantine_end ?? animal.quarantine_until)],
        ['Důvod karantény', animal.quarantine_reason ?? '—'],
        ['Odpovědný veterinář', animal.quarantine_vet ?? '—'],
        ['Výsledek karantény', animal.quarantine_result ?? '—'],
        ['Box karantény', animal.quarantine_box ?? '—'],
      ]} />

      <h2>Zdravotní stav</h2>
      <Fields items={[
        ['Zdravotní stav', animal.health_status ?? '—'],
        ['Vakcinován', yesNo(animal.vaccinated)],
        ['Kastrován / sterilizován', yesNo(animal.neutered)],
        ['Speciální potřeby', yesNo(animal.special_needs)],
        ['Ošetřující veterinář', animal.vet_name ?? '—'],
        ['Telefon veterináře', animal.vet_phone ?? '—'],
        ['Poslední návštěva vet.', czDate(animal.last_vet_visit)],
        ['Medikace', animal.medications ?? '—'],
      ]} />
      {animal.medical_notes && (
        <>
          <h3>Zdravotní poznámky</h3>
          <p style={{ fontSize: '10pt', color: '#333', margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{animal.medical_notes}</p>
        </>
      )}

      <h2>Charakter a vhodnost</h2>
      <Fields cols={3} items={[
        ['Vhodný pro byt', yesNo(animal.suitable_for_flat)],
        ['Vhodný pro dům', yesNo(animal.suitable_for_house)],
        ['Aktivita', animal.activity_level ?? '—'],
        ['Vychází s dětmi', yesNo(animal.good_with_kids)],
        ['Vychází se psy', yesNo(animal.good_with_dogs)],
        ['Vychází s kočkami', yesNo(animal.good_with_cats)],
      ]} />

      {animal.description && (
        <>
          <h3>Popis zvířete</h3>
          <p style={{ fontSize: '10pt', color: '#333', margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{animal.description}</p>
        </>
      )}

      <h2>Stav pobytu</h2>
      <Fields items={[
        ['Status adopce', animal.adoption_status ?? '—'],
        ['Dočasná péče', yesNo(animal.in_foster)],
        ['Jméno dočasné pěstounky', animal.foster_name ?? '—'],
        ['Telefon dočasné pěstounky', animal.foster_phone ?? '—'],
        ['Datum přidělení', czDate(animal.foster_since)],
        ['Interní poznámky', animal.internal_notes ?? '—'],
      ]} />

      <div className="sig-row">
        <div className="sig-box">
          <div className="sig-label">Podpis odpovědné osoby</div>
        </div>
        <div className="sig-box">
          <div className="sig-label">Datum a razítko organizace</div>
        </div>
      </div>
    </div>
  )
}

/* ─── handover-protocol ───────────────────────────────── */
function HandoverProtocol({ animal, inst }: { animal: Row; inst: string }) {
  return (
    <div className="print-page">
      <DocHeader
        title="Předávací protokol"
        subtitle="Protokol o předání zvířete do péče nového majitele"
        institutionName={inst}
        docNumber={animal.adoption_contract_num ?? undefined}
      />

      <h2>Identifikace zvířete</h2>
      <Fields items={[
        ['Jméno zvířete', animal.name],
        ['Druh', animal.species_name ?? '—'],
        ['Pohlaví', sexLabel(animal.sex)],
        ['Rok narození', animal.birth_year ?? '—'],
        ['Číslo čipu', animal.chip_number ?? '—'],
        ['Číslo evidenčního průkazu', animal.evidence_number ?? '—'],
      ]} />

      <h2>Přebírající osoba</h2>
      <Fields items={[
        ['Jméno a příjmení', animal.adopter_name ?? '—'],
        ['Telefon', animal.adopter_phone ?? '—'],
        ['Email', animal.adopter_email ?? '—'],
        ['Adresa trvalého pobytu', animal.adopter_address ?? '—'],
        ['Číslo OP / pasu', animal.adopter_id_number ?? '—'],
        ['Číslo smlouvy o adopci', animal.adoption_contract_num ?? '—'],
      ]} />

      <h2>Podmínky předání</h2>
      <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.7, marginBottom: '12px' }}>
        Přebírající osoba potvrzuje, že přebírá zvíře dobrovolně a ve stavu, v jakém bylo presentováno,
        a zavazuje se k jeho řádné péči dle platných právních předpisů. Přebírající bere na vědomí,
        že zvíře nesmí být dále prodáno ani předáno bez souhlasu předávající organizace po dobu 1 roku
        od data adopce. V případě porušení podmínek adopce se přebírající zavazuje vrátit zvíře organizaci.
      </p>

      <h2>Zdravotní stav při předání</h2>
      <Fields items={[
        ['Vakcinováno', yesNo(animal.vaccinated)],
        ['Kastrováno / sterilizováno', yesNo(animal.neutered)],
        ['Čipováno', yesNo(animal.chip_number)],
        ['Zdravotní stav', animal.health_status ?? '—'],
        ['Medikace', animal.medications ?? '—'],
        ['Speciální potřeby', animal.special_needs ? 'Ano' : 'Ne'],
      ]} />

      {animal.adopter_requirements && (
        <>
          <h3>Požadavky na přebírající osobu</h3>
          <p style={{ fontSize: '10pt', color: '#333', margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{animal.adopter_requirements}</p>
        </>
      )}

      <h2>Datum a podpisy</h2>
      <Fields items={[
        ['Datum adopce', czDate(animal.adoption_date ?? animal.adopted_at ?? animal.exit_date)],
        ['Pracovník organizace', animal.exit_worker ?? '—'],
        ['', ''],
        ['', ''],
      ]} />

      <div className="sig-row">
        <div className="sig-box">
          <div className="sig-label">Podpis přebírající osoby</div>
        </div>
        <div className="sig-box">
          <div className="sig-label">Podpis a razítko organizace</div>
        </div>
      </div>
    </div>
  )
}

/* ─── intake-list ─────────────────────────────────────── */
function IntakeList({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  return (
    <div className="print-page">
      <DocHeader
        title="Příjmový list"
        subtitle={`Evidence přijatých zvířat za období ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-num">{animals.length}</div>
          <div className="stat-lbl">Celkem přijato</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.intake_reason === 'found').length}</div>
          <div className="stat-lbl">Nálezci</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.chip_number).length}</div>
          <div className="stat-lbl">Čipováno</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.sex === 'female' || a.sex === 'f').length}</div>
          <div className="stat-lbl">Samice</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Jméno</th>
            <th>Druh / Plemeno</th>
            <th>Pohlaví</th>
            <th>Datum příjmu</th>
            <th>Důvod příjmu</th>
            <th>Číslo čipu</th>
            <th>Evidence č.</th>
            <th>Nálezce</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a, i) => (
            <tr key={String(a.id)}>
              <td style={{ fontWeight: 700, color: '#666' }}>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{a.name}</td>
              <td>{a.species_name ?? '—'}{a.breed ? ` / ${a.breed}` : ''}</td>
              <td>{sexLabel(a.sex)}</td>
              <td>{czDate(a.intake_date)}</td>
              <td>{intakeReasonLabel(a.intake_reason)}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '8pt' }}>{a.chip_number ?? '—'}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '8pt' }}>{a.evidence_number ?? '—'}</td>
              <td>{a.intake_finder_name ?? a.finder_name ?? '—'}</td>
            </tr>
          ))}
          {animals.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              Žádná zvířata v daném období
            </td></tr>
          )}
        </tbody>
      </table>

      <div className="sig-row">
        <div className="sig-box">
          <div className="sig-label">Podpis zodpovědné osoby</div>
        </div>
        <div className="sig-box">
          <div className="sig-label">Datum a razítko organizace</div>
        </div>
      </div>
    </div>
  )
}

/* ─── exit-list ──────────────────────────────────────── */
function ExitList({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  const byType = animals.reduce<Record<string, number>>((acc, a) => {
    const k = String(a.exit_type ?? 'other')
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="print-page">
      <DocHeader
        title="Výstupní list"
        subtitle={`Evidence odchozích zvířat za období ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-num">{animals.length}</div>
          <div className="stat-lbl">Celkem odchozích</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{byType.adoption ?? 0}</div>
          <div className="stat-lbl">Adopcí</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{byType.death ?? 0}</div>
          <div className="stat-lbl">Úhynů</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{byType.transfer ?? 0}</div>
          <div className="stat-lbl">Převodů</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Jméno</th>
            <th>Druh / Plemeno</th>
            <th>Pohlaví</th>
            <th>Datum příjmu</th>
            <th>Datum odchodu</th>
            <th>Typ odchodu</th>
            <th>Přejímající</th>
            <th>Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a, i) => (
            <tr key={String(a.id)}>
              <td style={{ fontWeight: 700, color: '#666' }}>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{a.name}</td>
              <td>{a.species_name ?? '—'}{a.breed ? ` / ${a.breed}` : ''}</td>
              <td>{sexLabel(a.sex)}</td>
              <td>{czDate(a.intake_date)}</td>
              <td style={{ fontWeight: 700 }}>{czDate(a.exit_date)}</td>
              <td>{exitTypeLabel(a.exit_type)}</td>
              <td>{a.adopter_name ?? a.transfer_institution ?? '—'}</td>
              <td style={{ fontSize: '8pt', color: '#555' }}>{a.exit_notes ?? '—'}</td>
            </tr>
          ))}
          {animals.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              Žádná odchozí zvířata v daném období
            </td></tr>
          )}
        </tbody>
      </table>

      <div className="sig-row">
        <div className="sig-box">
          <div className="sig-label">Podpis zodpovědné osoby</div>
        </div>
        <div className="sig-box">
          <div className="sig-label">Datum a razítko organizace</div>
        </div>
      </div>
    </div>
  )
}

/* ─── summary-report ─────────────────────────────────── */
function SummaryReport({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  const intakes = animals.filter(a => a.intake_date >= dateFrom && a.intake_date <= dateTo)
  const exits = animals.filter(a => a.exit_date && a.exit_date >= dateFrom && a.exit_date <= dateTo)
  const currently = animals.filter(a => !a.exit_date || a.exit_date > dateTo)
  const adoptions = exits.filter(a => a.exit_type === 'adoption')
  const deaths = exits.filter(a => a.exit_type === 'death' || a.exit_type === 'euthanasia')

  // Species breakdown
  const speciesCount = intakes.reduce<Record<string, number>>((acc, a) => {
    const k = a.species_name ?? 'Jiné'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="print-page">
      <DocHeader
        title="Přehledová zpráva útulku"
        subtitle={`Období: ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-num">{intakes.length}</div>
          <div className="stat-lbl">Nových příjmů</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{exits.length}</div>
          <div className="stat-lbl">Odchodů celkem</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{adoptions.length}</div>
          <div className="stat-lbl">Adopcí</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{currently.length}</div>
          <div className="stat-lbl">Aktuálně v péči</div>
        </div>
      </div>

      <h2>Odchody podle typu</h2>
      <table>
        <thead>
          <tr><th>Typ odchodu</th><th>Počet</th><th>%</th></tr>
        </thead>
        <tbody>
          {Object.entries(
            exits.reduce<Record<string, number>>((acc, a) => {
              const k = exitTypeLabel(a.exit_type)
              acc[k] = (acc[k] ?? 0) + 1
              return acc
            }, {})
          ).map(([type, count]) => (
            <tr key={type}>
              <td>{type}</td>
              <td style={{ fontWeight: 700 }}>{count}</td>
              <td>{exits.length ? Math.round((count / exits.length) * 100) : 0} %</td>
            </tr>
          ))}
          {exits.length === 0 && (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Žádné odchody</td></tr>
          )}
        </tbody>
      </table>

      <h2>Příjmy podle druhu</h2>
      <table>
        <thead>
          <tr><th>Druh</th><th>Počet</th><th>%</th></tr>
        </thead>
        <tbody>
          {Object.entries(speciesCount).map(([species, count]) => (
            <tr key={species}>
              <td>{species}</td>
              <td style={{ fontWeight: 700 }}>{count}</td>
              <td>{intakes.length ? Math.round((count / intakes.length) * 100) : 0} %</td>
            </tr>
          ))}
          {intakes.length === 0 && (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Žádné příjmy</td></tr>
          )}
        </tbody>
      </table>

      <h2>Zdravotní statistiky (příjmy v období)</h2>
      <Fields cols={3} items={[
        ['Vakcinováno při příjmu', String(intakes.filter(a => a.vaccinated).length)],
        ['Kastrováno při příjmu', String(intakes.filter(a => a.neutered).length)],
        ['Čipováno při příjmu', String(intakes.filter(a => a.chip_number).length)],
        ['V karanténě', String(intakes.filter(a => a.in_quarantine).length)],
        ['Úhyny celkem', String(deaths.length)],
        ['Speciální potřeby', String(intakes.filter(a => a.special_needs).length)],
      ]} />

      <div className="sig-row">
        <div className="sig-box">
          <div className="sig-label">Vedoucí útulku / podpis</div>
        </div>
        <div className="sig-box">
          <div className="sig-label">Datum a razítko organizace</div>
        </div>
      </div>
    </div>
  )
}

/* ─── found-animals ───────────────────────────────────── */
function FoundAnimals({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  return (
    <div className="print-page">
      <DocHeader
        title="Evidence nalezených zvířat"
        subtitle={`Pro obecní úřad / KVS · Období: ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Datum nálezu</th>
            <th>Místo nálezu</th>
            <th>Druh</th>
            <th>Popis (barva, poh.)</th>
            <th>Nálezce</th>
            <th>Telefon nálezce</th>
            <th>Číslo čipu</th>
            <th>Datum příjmu</th>
            <th>Evidence č.</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a, i) => (
            <tr key={String(a.id)}>
              <td style={{ fontWeight: 700, color: '#666' }}>{i + 1}</td>
              <td>{czDate(a.found_date ?? a.intake_date)}</td>
              <td>{a.found_location ?? '—'}</td>
              <td>{a.species_name ?? '—'}</td>
              <td>{[a.color, sexLabel(a.sex)].filter(Boolean).join(', ') || '—'}</td>
              <td>{a.intake_finder_name ?? a.finder_name ?? '—'}</td>
              <td>{a.intake_finder_phone ?? a.finder_phone ?? '—'}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '8pt' }}>{a.chip_number ?? '—'}</td>
              <td>{czDate(a.intake_date)}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '8pt' }}>{a.evidence_number ?? '—'}</td>
            </tr>
          ))}
          {animals.length === 0 && (
            <tr><td colSpan={10} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              Žádná nalezená zvířata v daném období
            </td></tr>
          )}
        </tbody>
      </table>

      <p className="note-text">
        Dokument slouží jako podklad pro hlášení obci dle §14 zák. č. 246/1992 Sb. a §66 zák. č. 128/2000 Sb.
      </p>

      <div className="sig-row">
        <div className="sig-box">
          <div className="sig-label">Podpis zodpovědné osoby</div>
        </div>
        <div className="sig-box">
          <div className="sig-label">Datum a razítko organizace</div>
        </div>
      </div>
    </div>
  )
}

/* ─── patient-card (rescue) ───────────────────────────── */
function PatientCard({ animal, inst }: { animal: Row; inst: string }) {
  return (
    <div className="print-page">
      <DocHeader
        title="Karta pacienta záchranné stanice"
        subtitle="Ošetření volně žijícího živočicha"
        institutionName={inst}
        docNumber={animal.evidence_number ?? undefined}
      />

      <h2>Identifikace pacienta</h2>
      <Fields items={[
        ['Druh živočicha', animal.species_name ?? animal.species_id ?? '—'],
        ['Jméno / označení', animal.name],
        ['Pohlaví', sexLabel(animal.sex)],
        ['Odhadovaný věk', animal.birth_year ? `nar. ${animal.birth_year}` : (animal.age_months ? `${animal.age_months} měs.` : '—')],
        ['Barva / popis', animal.color ?? '—'],
        ['Hmotnost (kg)', animal.weight_kg ?? '—'],
      ]} />
      <Fields items={[
        ['Číslo čipu / kroužku', animal.chip_number ?? '—'],
        ['Číslo evidence', animal.evidence_number ?? '—'],
        ['Původ nálezu', animal.origin ?? '—'],
        ['Místo nálezu', animal.found_location ?? '—'],
        ['Datum nálezu', czDate(animal.found_date ?? animal.intake_date)],
        ['Nálezce', animal.intake_finder_name ?? animal.finder_name ?? '—'],
      ]} />

      <h2>Stav při příjmu</h2>
      <Fields items={[
        ['Datum příjmu', czDate(animal.intake_date)],
        ['Důvod příjmu', intakeReasonLabel(animal.intake_reason)],
        ['Stav při příjmu', animal.intake_condition ?? animal.health_status ?? '—'],
        ['Příjmový pracovník', animal.intake_worker ?? '—'],
        ['Popis poranění', animal.intake_notes ?? '—'],
        ['', ''],
      ]} />

      <h2>Průběh léčby a ošetření</h2>
      <table>
        <thead>
          <tr>
            <th style={{ width: '18%' }}>Datum</th>
            <th>Popis ošetření / diagnóza</th>
            <th style={{ width: '20%' }}>Medikace / výkon</th>
            <th style={{ width: '18%' }}>Ošetřující</th>
          </tr>
        </thead>
        <tbody>
          {/* Render medical notes as rows if parseable, else empty rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}><td style={{ height: '24px' }}>&nbsp;</td><td></td><td></td><td></td></tr>
          ))}
        </tbody>
      </table>

      <h2>Výsledek péče</h2>
      <Fields items={[
        ['Výsledný stav', animal.health_status ?? '—'],
        ['Datum odchodu', czDate(animal.exit_date)],
        ['Typ odchodu', exitTypeLabel(animal.exit_type)],
        ['Prognóza při příjmu', animal.rescue_prognosis ?? '—'],
        ['Medikace', animal.medications ?? '—'],
        ['Poznámky', animal.medical_notes ?? '—'],
      ]} />

      {animal.care_instructions && (
        <>
          <h3>Pokyny pro péči</h3>
          <p style={{ fontSize: '10pt', margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{animal.care_instructions}</p>
        </>
      )}

      <div className="sig-row">
        <div className="sig-box">
          <div className="sig-label">Podpis ošetřujícího pracovníka</div>
        </div>
        <div className="sig-box">
          <div className="sig-label">Datum a razítko stanice</div>
        </div>
      </div>
    </div>
  )
}

/* ─── rescue-intake-list ──────────────────────────────── */
function RescueIntakeList({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  return (
    <div className="print-page">
      <DocHeader
        title="Příjmový list záchranné stanice"
        subtitle={`Evidence přijatých pacientů · ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-num">{animals.length}</div>
          <div className="stat-lbl">Celkem přijato</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.chip_number || a.ring_number).length}</div>
          <div className="stat-lbl">Označeno</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.found_location).length}</div>
          <div className="stat-lbl">Se zázn. místa</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.intake_finder_name || a.finder_name).length}</div>
          <div className="stat-lbl">S nálezcem</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Druh / Jméno</th>
            <th>Datum příjmu</th>
            <th>Místo nálezu</th>
            <th>Stav při příjmu</th>
            <th>Nálezce / telefon</th>
            <th>Označení</th>
            <th>Evidence č.</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a, i) => (
            <tr key={String(a.id)}>
              <td style={{ fontWeight: 700, color: '#666' }}>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{a.species_name ?? '—'}<br/><span style={{ fontWeight: 400, fontSize: '8.5pt', color: '#666' }}>{a.name}</span></td>
              <td>{czDate(a.intake_date)}</td>
              <td>{a.found_location ?? '—'}</td>
              <td style={{ fontSize: '8.5pt' }}>{a.intake_condition ?? a.health_status ?? '—'}</td>
              <td style={{ fontSize: '8.5pt' }}>{a.intake_finder_name ?? a.finder_name ?? '—'}{a.intake_finder_phone ? <><br/>{a.intake_finder_phone}</> : ''}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '8pt' }}>{a.chip_number ?? '—'}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '8pt' }}>{a.evidence_number ?? '—'}</td>
            </tr>
          ))}
          {animals.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Žádní pacienti v daném období</td></tr>
          )}
        </tbody>
      </table>

      <div className="sig-row">
        <div className="sig-box"><div className="sig-label">Podpis zodpovědné osoby</div></div>
        <div className="sig-box"><div className="sig-label">Datum a razítko stanice</div></div>
      </div>
    </div>
  )
}

/* ─── rescue-release-list ─────────────────────────────── */
function RescueReleaseList({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  return (
    <div className="print-page">
      <DocHeader
        title="Propouštěcí list záchranné stanice"
        subtitle={`Evidence vypuštěných a předaných pacientů · ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Druh / Jméno</th>
            <th>Datum příjmu</th>
            <th>Datum odchodu</th>
            <th>Typ odchodu</th>
            <th>Délka pobytu (dní)</th>
            <th>Stav při odchodu</th>
            <th>Místo vypuštění / kam předáno</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a, i) => {
            const days = a.intake_date && a.exit_date
              ? Math.floor((new Date(String(a.exit_date)).getTime() - new Date(String(a.intake_date)).getTime()) / 86400000)
              : '—'
            return (
              <tr key={String(a.id)}>
                <td style={{ fontWeight: 700, color: '#666' }}>{i + 1}</td>
                <td style={{ fontWeight: 700 }}>{a.species_name ?? '—'}<br/><span style={{ fontWeight: 400, fontSize: '8.5pt', color: '#666' }}>{a.name}</span></td>
                <td>{czDate(a.intake_date)}</td>
                <td style={{ fontWeight: 700 }}>{czDate(a.exit_date)}</td>
                <td>{exitTypeLabel(a.exit_type)}</td>
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{String(days)}</td>
                <td style={{ fontSize: '8.5pt' }}>{a.health_status ?? '—'}</td>
                <td style={{ fontSize: '8.5pt' }}>{a.transfer_institution ?? a.found_location ?? a.exit_notes ?? '—'}</td>
              </tr>
            )
          })}
          {animals.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Žádní propuštění pacienti v daném období</td></tr>
          )}
        </tbody>
      </table>

      <div className="sig-row">
        <div className="sig-box"><div className="sig-label">Podpis zodpovědné osoby</div></div>
        <div className="sig-box"><div className="sig-label">Datum a razítko stanice</div></div>
      </div>
    </div>
  )
}

/* ─── death-list ──────────────────────────────────────── */
function DeathList({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  return (
    <div className="print-page">
      <DocHeader
        title="Úhynová evidence"
        subtitle={`Povinná evidence dle vyhlášky · Období: ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-num">{animals.length}</div>
          <div className="stat-lbl">Celkem</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.exit_type === 'death').length}</div>
          <div className="stat-lbl">Přirozené úhyny</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.exit_type === 'euthanasia').length}</div>
          <div className="stat-lbl">Eutanazie</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{animals.filter(a => a.disposal_method).length}</div>
          <div className="stat-lbl">Se záz. likvidace</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Jméno / druh</th>
            <th>Datum příjmu</th>
            <th>Datum úhynu</th>
            <th>Typ</th>
            <th>Příčina</th>
            <th>Ošetřující veterinář</th>
            <th>Způsob likvidace</th>
            <th>Doklad č.</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a, i) => (
            <tr key={String(a.id)}>
              <td style={{ fontWeight: 700, color: '#666' }}>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{a.name}<br/><span style={{ fontWeight: 400, fontSize: '8.5pt', color: '#666' }}>{a.species_name ?? '—'}</span></td>
              <td>{czDate(a.intake_date)}</td>
              <td style={{ fontWeight: 700 }}>{czDate(a.death_date ?? a.exit_date)}</td>
              <td>{a.exit_type === 'euthanasia' ? 'Eutanazie' : 'Úhyn'}</td>
              <td style={{ fontSize: '8.5pt' }}>{a.death_cause ?? a.death_type ?? '—'}</td>
              <td style={{ fontSize: '8.5pt' }}>{a.death_vet ?? a.vet_name ?? '—'}</td>
              <td style={{ fontSize: '8.5pt' }}>{a.disposal_method ?? '—'}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '8pt' }}>{a.disposal_doc_number ?? '—'}</td>
            </tr>
          ))}
          {animals.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Žádné úhyny v daném období</td></tr>
          )}
        </tbody>
      </table>

      <p className="note-text">
        Likvidace kadaverů provedena v souladu s nař. EP a Rady (ES) č. 1069/2009 a zák. č. 166/1999 Sb.
      </p>

      <div className="sig-row">
        <div className="sig-box"><div className="sig-label">Podpis zodpovědné osoby</div></div>
        <div className="sig-box"><div className="sig-label">Datum a razítko organizace</div></div>
      </div>
    </div>
  )
}

/* ─── rescue-summary ──────────────────────────────────── */
function RescueSummary({
  animals,
  inst,
  dateFrom,
  dateTo,
}: {
  animals: Row[]
  inst: string
  dateFrom: string
  dateTo: string
}) {
  const intakes = animals.filter(a => a.intake_date >= dateFrom && a.intake_date <= dateTo)
  const exits = animals.filter(a => a.exit_date && a.exit_date >= dateFrom && a.exit_date <= dateTo)
  const released = exits.filter(a => a.exit_type === 'release' || a.exit_type === 'released')
  const deaths = exits.filter(a => a.exit_type === 'death' || a.exit_type === 'euthanasia')
  const transferred = exits.filter(a => a.exit_type === 'transfer')

  const speciesCount = intakes.reduce<Record<string, number>>((acc, a) => {
    const k = a.species_name ?? 'Jiné'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="print-page">
      <DocHeader
        title="Přehledová zpráva záchranné stanice"
        subtitle={`Období: ${czDate(dateFrom)} — ${czDate(dateTo)}`}
        institutionName={inst}
      />

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-num">{intakes.length}</div>
          <div className="stat-lbl">Nových příjmů</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{released.length}</div>
          <div className="stat-lbl">Vypuštěno</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{deaths.length}</div>
          <div className="stat-lbl">Úhynů</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{transferred.length}</div>
          <div className="stat-lbl">Převodů</div>
        </div>
      </div>

      <h2>Pacienti podle druhu (příjmy v období)</h2>
      <table>
        <thead>
          <tr><th>Druh živočicha</th><th>Počet</th><th>%</th></tr>
        </thead>
        <tbody>
          {Object.entries(speciesCount).sort((a, b) => b[1] - a[1]).map(([sp, cnt]) => (
            <tr key={sp}>
              <td>{sp}</td>
              <td style={{ fontWeight: 700 }}>{cnt}</td>
              <td>{intakes.length ? Math.round((cnt / intakes.length) * 100) : 0} %</td>
            </tr>
          ))}
          {intakes.length === 0 && (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Žádné příjmy</td></tr>
          )}
        </tbody>
      </table>

      <h2>Výsledky péče (odchody v období)</h2>
      <table>
        <thead>
          <tr><th>Výsledek</th><th>Počet</th><th>%</th></tr>
        </thead>
        <tbody>
          {Object.entries(
            exits.reduce<Record<string, number>>((acc, a) => {
              const k = exitTypeLabel(a.exit_type)
              acc[k] = (acc[k] ?? 0) + 1
              return acc
            }, {})
          ).map(([type, count]) => (
            <tr key={type}>
              <td>{type}</td>
              <td style={{ fontWeight: 700 }}>{count}</td>
              <td>{exits.length ? Math.round((count / exits.length) * 100) : 0} %</td>
            </tr>
          ))}
          {exits.length === 0 && (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Žádné odchody</td></tr>
          )}
        </tbody>
      </table>

      <div className="sig-row">
        <div className="sig-box"><div className="sig-label">Vedoucí stanice / podpis</div></div>
        <div className="sig-box"><div className="sig-label">Datum a razítko stanice</div></div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PAGE — data fetching + routing
══════════════════════════════════════════════════════════ */

const VALID_TYPES = new Set([
  'animal-card', 'handover-protocol', 'intake-list', 'exit-list', 'summary-report', 'found-animals',
  'patient-card', 'rescue-intake-list', 'rescue-release-list', 'death-list', 'rescue-summary',
])

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>
  searchParams: Promise<{ animalId?: string; dateFrom?: string; dateTo?: string; inst?: string; institutionId?: string }>
}) {
  const { type } = await params
  const sp = await searchParams

  if (!VALID_TYPES.has(type)) notFound()

  /* ── Auth ── */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  /* ── Institution ── */
  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const instId = sp.institutionId ?? membership.institution_id
  const instName = sp.inst ?? 'Organizace'

  /* ── Fetch data based on type ── */
  const animalTypes = new Set(['animal-card', 'handover-protocol', 'patient-card'])
  const dateFrom = sp.dateFrom ?? new Date().toISOString().slice(0, 8) + '01'
  const dateTo   = sp.dateTo   ?? new Date().toISOString().slice(0, 10)

  /* ── Species lookup (separate query — avoids FK join issues) ── */
  const { data: speciesRows } = await service.from('animal_species').select('id, name_cs')
  const speciesMap: Record<string, string> = {}
  for (const s of speciesRows ?? []) speciesMap[String(s.id)] = String(s.name_cs)

  function withSpecies(a: Row): Row {
    return { ...a, species_name: a.species_id ? (speciesMap[String(a.species_id)] ?? null) : null }
  }

  let animal: Row | null = null
  let animals: Row[] = []

  if (animalTypes.has(type)) {
    if (!sp.animalId) notFound()
    const { data, error } = await service
      .from('animals')
      .select('*')
      .eq('id', sp.animalId)
      .eq('institution_id', instId)
      .single()
    if (error || !data) notFound()
    animal = withSpecies(data as Row)
  } else {
    let query = service
      .from('animals')
      .select('*')
      .eq('institution_id', instId)

    if (type === 'exit-list' || type === 'rescue-release-list') {
      query = query
        .not('exit_type', 'is', null)
        .gte('exit_date', dateFrom)
        .lte('exit_date', dateTo)
        .order('exit_date')
    } else if (type === 'death-list') {
      query = query
        .in('exit_type', ['death', 'euthanasia'])
        .gte('exit_date', dateFrom)
        .lte('exit_date', dateTo)
        .order('exit_date')
    } else if (type === 'summary-report' || type === 'rescue-summary') {
      query = query
        .lte('intake_date', dateTo)
        .order('intake_date')
    } else {
      query = query
        .gte('intake_date', dateFrom)
        .lte('intake_date', dateTo)
        .order('intake_date')
    }

    const { data } = await query
    animals = (data ?? []).map(a => withSpecies(a as Row))
  }

  /* ── Render ── */
  let docContent: React.ReactNode = null

  switch (type) {
    case 'animal-card':
      docContent = <AnimalCard animal={animal!} inst={instName} />
      break
    case 'handover-protocol':
      docContent = <HandoverProtocol animal={animal!} inst={instName} />
      break
    case 'intake-list':
      docContent = <IntakeList animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
    case 'exit-list':
      docContent = <ExitList animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
    case 'summary-report':
      docContent = <SummaryReport animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
    case 'found-animals':
      docContent = <FoundAnimals animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
    case 'patient-card':
      docContent = <PatientCard animal={animal!} inst={instName} />
      break
    case 'rescue-intake-list':
      docContent = <RescueIntakeList animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
    case 'rescue-release-list':
      docContent = <RescueReleaseList animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
    case 'death-list':
      docContent = <DeathList animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
    case 'rescue-summary':
      docContent = <RescueSummary animals={animals} inst={instName} dateFrom={dateFrom} dateTo={dateTo} />
      break
  }

  return (
    <>
      {/* Print CSS — injected globally, overrides admin layout on print */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Controls bar (hidden on print) */}
      <PrintControls />

      {docContent}
    </>
  )
}
