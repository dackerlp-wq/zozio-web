/**
 * PDF: Zákonná evidence — pro kontrolu SVS / státních orgánů
 * Určeno pro úřední kontroly (Státní veterinární správa, obecní úřad apod.)
 *
 * Legislativní základ:
 *   §25b zák. 246/1992 Sb. (evidence v útulcích)
 *   Vyhláška 342/2012 Sb. (karanténa, zdravotní záznamy)
 *   §13 zák. 166/1999 Sb. (identifikace zvířat — čip)
 *   §54 zák. 114/1992 Sb. (záchranné stanice — CITES)
 *   VZ 255/2012 Sb. (likvidace kadáverů)
 *
 * GET /admin/animals/[id]/pdf/records
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ADOPTION_STATUS_LABEL, RESCUE_STATUS_LABEL,
  HEALTH_STATUS_LABEL, INTAKE_REASON_LABEL, SEX_LABEL, SIZE_LABEL,
} from '@/lib/animal-labels'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Nepřihlášen', { status: 401 })

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return new NextResponse('Nemáš přístup', { status: 403 })

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, type, city, street, zip, email, phone, ico, registration_number')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) return new NextResponse('Instituce nenalezena', { status: 404 })

  const isShelter = institution.type === 'shelter'
  const inst = institution as any

  const { data: animal } = isShelter
    ? await service.from('animals').select('*, species:animal_species(name_cs, icon)').eq('id', id).eq('institution_id', institution.id).single()
    : await service.from('rescue_cases').select('*, species:animal_species(name_cs, icon)').eq('id', id).eq('institution_id', institution.id).single()

  if (!animal) return new NextResponse('Záznam nenalezen', { status: 404 })

  const a = animal as any

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

  // QR → digitální ověření záznamu (admin URL)
  const verifyUrl = `${BASE}/admin/animals/${id}?scan=1`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=1a1a1a&margin=2`

  const today = new Date()
  const todayCs = today.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('cs-CZ') } catch { return d }
  }

  const v = (val: unknown) => (val != null && val !== '' ? String(val) : '—')
  const bool = (b: boolean | null | undefined) => b === true ? 'ANO' : b === false ? 'NE' : '—'

  // Vakcinace — parsuj JSONB
  let vaccinations: Array<{ type: string; label: string; last_date: string; batch_number?: string; expiry_date?: string; vet_name?: string }> = []
  try {
    const raw = a.vaccination_records ?? a.vaccinations
    if (Array.isArray(raw)) vaccinations = raw
    else if (typeof raw === 'string') vaccinations = JSON.parse(raw)
  } catch { vaccinations = [] }

  // Medikace — parsuj JSONB
  let medications: Array<{ name: string; dosage: string; frequency: string }> = []
  try {
    const raw = a.current_medications ?? a.medications_list
    if (Array.isArray(raw)) medications = raw
    else if (typeof raw === 'string') medications = JSON.parse(raw)
  } catch { medications = [] }

  const row = (label: string, value: string | null | undefined, highlight = false) =>
    value && value !== '—' ? `
      <tr>
        <td class="label-cell">${label}</td>
        <td class="value-cell${highlight ? ' highlight' : ''}">${value}</td>
      </tr>` : `
      <tr class="empty-row">
        <td class="label-cell">${label}</td>
        <td class="value-cell empty">—</td>
      </tr>`

  const section = (num: string, title: string, legalRef: string, content: string) => `
    <div class="section">
      <div class="section-header">
        <span class="section-num">${num}</span>
        <span class="section-title">${title}</span>
        <span class="section-legal">${legalRef}</span>
      </div>
      <table class="data-table">${content}</table>
    </div>`

  // ── Stav / status ─────────────────────────────────────────────────────────
  const status = isShelter
    ? (ADOPTION_STATUS_LABEL[a.adoption_status ?? ''] ?? a.adoption_status ?? '—')
    : (RESCUE_STATUS_LABEL[a.status ?? ''] ?? a.status ?? '—')

  const evidenceNum = a.evidence_number ?? `ZOZ-${today.getFullYear()}-????`

  // ── Karanténní výsledek ────────────────────────────────────────────────────
  const quarantineResultLabel: Record<string, string> = {
    negative: 'NEGATIVNÍ', positive: 'POZITIVNÍ', inconclusive: 'NEPRŮKAZNÉ'
  }

  // ── Odchod ────────────────────────────────────────────────────────────────
  const exitTypeLabel: Record<string, string> = {
    adopted: 'Předáno k adopci', returned: 'Vráceno majiteli',
    transferred: 'Přemístěno', deceased: 'Uhynutí', escaped: 'Útěk'
  }

  const deathTypeLabel: Record<string, string> = {
    natural: 'Přirozená', euthanasia: 'Eutanazie', accident: 'Nehoda/úraz', unknown: 'Neznámá'
  }

  const disposalLabel: Record<string, string> = {
    incineration: 'Spalovna', composting: 'Kompostování', burial: 'Pohřbení',
    rendering: 'Asanační podnik', other: 'Jiné'
  }

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Zákonná evidence — ${a.name ?? a.case_number ?? id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #F5F0EA;
    color: #1a1a1a;
    font-size: 10pt;
    line-height: 1.4;
  }
  .page {
    max-width: 210mm;
    margin: 0 auto;
    padding: 14mm 16mm 14mm;
    background: white;
    min-height: 297mm;
  }

  /* Hlavička */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #2C1810;
    padding-bottom: 12px;
    margin-bottom: 14px;
    gap: 16px;
  }
  .doc-header-left .logo {
    font-size: 18pt;
    font-weight: 900;
    color: #E8634A;
    letter-spacing: -0.5px;
    line-height: 1;
  }
  .doc-header-left .logo span { color: #F0A500; }
  .doc-header-left .inst-name {
    font-size: 9pt;
    font-weight: 700;
    color: #2C1810;
    margin-top: 4px;
  }
  .doc-header-left .inst-addr {
    font-size: 7.5pt;
    color: #6B4030;
    margin-top: 2px;
  }
  .doc-header-right { text-align: right; }
  .doc-type-badge {
    display: inline-block;
    background: #2C1810;
    color: white;
    font-size: 8pt;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 5px;
  }
  .evidence-num {
    font-size: 11pt;
    font-weight: 900;
    color: #E8634A;
    display: block;
  }
  .print-date {
    font-size: 7.5pt;
    color: #8B6550;
    display: block;
    margin-top: 3px;
  }

  /* Název dokumentu */
  .doc-title-bar {
    background: #2C1810;
    color: white;
    padding: 7px 12px;
    border-radius: 4px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .doc-title-bar h1 {
    font-size: 11pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .doc-title-bar .status-pill {
    background: ${isShelter ? '#E8634A' : '#2E9E8F'};
    color: white;
    font-size: 8pt;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 100px;
  }

  /* Sekce */
  .section {
    margin-bottom: 10px;
    break-inside: avoid;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    background: ${isShelter ? '#E8634A' : '#2E9E8F'};
    color: white;
    padding: 4px 10px;
    border-radius: 3px 3px 0 0;
    font-size: 8.5pt;
  }
  .section-num {
    font-weight: 900;
    font-size: 10pt;
    background: rgba(255,255,255,0.2);
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .section-title {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    flex: 1;
  }
  .section-legal {
    font-size: 7pt;
    opacity: 0.8;
    font-style: italic;
    white-space: nowrap;
  }

  /* Tabulka dat */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #E0D8D0;
    border-top: none;
    border-radius: 0 0 3px 3px;
    overflow: hidden;
    font-size: 9pt;
  }
  .data-table tr:nth-child(even) { background: #FAFAF8; }
  .data-table tr.empty-row { opacity: 0.5; }
  .label-cell {
    width: 160px;
    padding: 4px 10px;
    font-weight: 700;
    color: #6B4030;
    font-size: 8pt;
    border-right: 1px solid #E0D8D0;
    border-bottom: 1px solid #F0E8DC;
    vertical-align: top;
    background: #FDEAE6;
    white-space: nowrap;
  }
  .value-cell {
    padding: 4px 10px;
    color: #1a1a1a;
    border-bottom: 1px solid #F0E8DC;
    vertical-align: top;
  }
  .value-cell.highlight {
    font-weight: 700;
    color: #1a1a1a;
  }
  .value-cell.empty { color: #B0A090; }

  /* Vakcinace tabulka */
  .vaccine-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    border: 1px solid #E0D8D0;
    border-top: none;
    border-radius: 0 0 3px 3px;
  }
  .vaccine-table th {
    background: #F5EDE6;
    padding: 4px 8px;
    font-size: 7.5pt;
    font-weight: 700;
    color: #6B4030;
    text-align: left;
    border-bottom: 1px solid #E0D8D0;
    border-right: 1px solid #E0D8D0;
  }
  .vaccine-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #F0E8DC;
    border-right: 1px solid #F0E8DC;
    vertical-align: top;
  }
  .vaccine-table tr:nth-child(even) td { background: #FAFAF8; }

  /* Med tabulka */
  .med-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    border: 1px solid #E0D8D0;
    border-top: none;
  }
  .med-table th {
    background: #F5EDE6;
    padding: 4px 8px;
    font-size: 7.5pt;
    font-weight: 700;
    color: #6B4030;
    text-align: left;
    border-bottom: 1px solid #E0D8D0;
    border-right: 1px solid #E0D8D0;
  }
  .med-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #F0E8DC;
    border-right: 1px solid #F0E8DC;
  }

  /* Spodní část — QR + podpis */
  .bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 14px;
    gap: 20px;
  }
  .qr-block { text-align: center; }
  .qr-block img {
    width: 90px; height: 90px;
    border: 1.5px solid #E0D8D0;
    border-radius: 4px;
    display: block;
  }
  .qr-label {
    font-size: 6.5pt;
    color: #8B6550;
    margin-top: 3px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: center;
  }
  .sig-area {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .sig-block .sig-line {
    border-bottom: 1px solid #2C1810;
    height: 40px;
    margin-bottom: 4px;
  }
  .sig-block .sig-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #8B6550;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .sig-block .sig-date {
    font-size: 7pt;
    color: #A09890;
    text-align: center;
    margin-top: 2px;
  }

  /* Patička */
  .doc-footer {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1.5px solid #E0D8D0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 7pt;
    color: #A09880;
  }
  .doc-footer .legal-refs {
    font-style: italic;
    line-height: 1.6;
  }

  /* Tisk */
  .no-print {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding: 14px 0;
    background: #EDE8E2;
  }
  .btn {
    padding: 9px 22px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: Arial, sans-serif;
  }
  .btn-print { background: #2C1810; color: white; }
  .btn-adopt { background: #E8634A; color: white; }
  .btn-back  { background: #F0E8DC; color: #6B4030; }

  /* Dvousloupcový layout pro více sekcí */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  @media print {
    body { background: white; }
    .no-print { display: none; }
    .page { padding: 8mm 10mm; margin: 0; max-width: 100%; }
    .section { break-inside: avoid; }
    @page { size: A4 portrait; margin: 0; }
  }
</style>
</head>
<body>

<!-- Tlačítka (skryta při tisku) -->
<div class="no-print">
  <button class="btn btn-print" onclick="window.print()">🖨️ Tisknout / Uložit PDF</button>
  ${isShelter ? `<a class="btn btn-adopt" href="/admin/animals/${id}/pdf/adoption" target="_blank">📋 Adopční smlouva</a>` : ''}
  <a class="btn btn-back" href="/admin/animals/${id}">← Zpět na kartu</a>
</div>

<div class="page">

  <!-- Hlavička dokumentu -->
  <div class="doc-header">
    <div class="doc-header-left">
      <div class="logo">Z<span>O</span>Z<span style="color:#E8634A">IO</span></div>
      <div class="inst-name">${v(inst.name)}</div>
      <div class="inst-addr">${[inst.street, inst.zip, inst.city].filter(Boolean).join(', ') || '—'}${inst.ico ? ' · IČO: ' + inst.ico : ''}${inst.registration_number ? ' · Reg.: ' + inst.registration_number : ''}</div>
      <div class="inst-addr">${v(inst.email)} · ${v(inst.phone)}</div>
    </div>
    <div class="doc-header-right">
      <span class="doc-type-badge">${isShelter ? 'Útulok' : 'Záchranná stanice'}</span>
      <span class="evidence-num">${evidenceNum}</span>
      <span class="print-date">Vytisknuto: ${todayCs}</span>
    </div>
  </div>

  <!-- Název dokumentu -->
  <div class="doc-title-bar">
    <h1>Zákonná evidence zvířete — ${isShelter ? 'Útulok' : 'Záchranná stanice'}</h1>
    <span class="status-pill">${status}</span>
  </div>

  <!-- 1. ZÁKLADNÍ IDENTIFIKACE -->
  ${section('1', 'Základní identifikace', '§25b zák. 246/1992 Sb.', `
    ${row('Evidenční číslo', v(a.evidence_number), true)}
    ${row('Jméno / označení', v(a.name ?? a.case_number), true)}
    ${row('ID záznamu (UUID)', String(a.id ?? '—').slice(0, 8) + '...')}
    ${row('Druh', a.species?.name_cs ? `${a.species.icon ?? ''} ${a.species.name_cs}` : '—')}
    ${row('Plemeno / rasa', v(a.breed))}
    ${row('Pohlaví', SEX_LABEL[a.sex ?? ''] ?? '—')}
    ${isShelter
      ? row('Rok narození (odhad)', v(a.birth_year?.toString()))
      : row('Odhadovaný věk', v(a.estimated_age))}
    ${row('Barva / zbarvení', v(a.color))}
    ${isShelter ? row('Velikost', SIZE_LABEL[a.size ?? ''] ?? '—') : ''}
    ${!isShelter ? row('Hmotnost při příjmu', a.weight_g ? a.weight_g + ' g' : '—') : ''}
  `)}

  <!-- 2. ČIPOVÁNÍ A DOKLADY (§13 zák. 166/1999 Sb.) -->
  ${section('2', 'Čipování a doklady', '§13 zák. 166/1999 Sb.', `
    ${row('Číslo čipu (ISO 11784/85)', v(a.chip_number), true)}
    ${row('Datum čipování', fmtDate(a.chip_date))}
    ${row('Kdo čipoval', v(a.chip_implanter ?? a.vet_name))}
    ${row('Místo vpichu', v(a.chip_location))}
    ${row('Číslo průkazu / pasu', v(a.passport_number))}
    ${row('Datum vydání průkazu', fmtDate(a.passport_issued))}
    ${row('Registrace v CRZ', bool(a.crz_registered))}
    ${row('Datum registrace CRZ', fmtDate(a.crz_reg_date))}
    ${!isShelter ? row('Číslo kroužku / značení', v(a.ring_number)) : ''}
  `)}

  <!-- 3. PŘÍJEM DO ZAŘÍZENÍ -->
  ${section('3', 'Příjem do zařízení', '§25b odst. 2 zák. 246/1992 Sb.', `
    ${row('Datum příjmu', fmtDate(a.intake_date), true)}
    ${row('Čas příjmu', v(a.intake_time))}
    ${row('Pracovník příjmu', v(a.intake_worker))}
    ${row('Důvod příjmu', INTAKE_REASON_LABEL[a.intake_reason ?? ''] ?? v(a.intake_reason))}
    ${row('Místo nálezu / původu', v(a.found_location))}
    ${row('Datum nálezu', fmtDate(a.found_date))}
    ${row('Jméno nálezce / předávajícího', v(a.intake_finder_name ?? a.finder_name))}
    ${row('Adresa nálezce', v(a.intake_finder_address))}
    ${row('Telefon nálezce', v(a.intake_finder_phone ?? a.finder_phone))}
    ${row('E-mail nálezce', v(a.intake_finder_email))}
    ${row('OP č. nálezce', v(a.intake_finder_id))}
    ${isShelter && a.previous_owner
      ? row('Předchozí majitel', `${a.previous_owner}${a.previous_owner_phone ? ' · ' + a.previous_owner_phone : ''}`)
      : ''}
    ${row('Poznámky k příjmu', v(a.intake_notes))}
  `)}

  <!-- 4. KARANTÉNA (Vyhl. 342/2012 Sb.) -->
  ${section('4', 'Karanténa', 'Vyhl. 342/2012 Sb.', `
    ${row('Karanténa zahájena', fmtDate(a.quarantine_start ?? a.quarantine_until?.split('|')[0]))}
    ${row('Karanténa ukončena', fmtDate(a.quarantine_end ?? a.quarantine_until))}
    ${row('Zodpovědný veterinář', v(a.quarantine_vet))}
    ${row('Výsledek karantény', a.quarantine_result ? (quarantineResultLabel[a.quarantine_result] ?? a.quarantine_result) : '—')}
    ${row('Číslo karanténního boxu', v(a.quarantine_box))}
    ${row('Aktuálně v karanténě', bool(a.in_quarantine))}
  `)}

  <!-- 5. ZDRAVOTNÍ STAV -->
  ${section('5', 'Zdravotní stav', 'Vyhl. 342/2012 Sb.', `
    ${row('Zdravotní stav', HEALTH_STATUS_LABEL[a.health_status ?? ''] ?? '—')}
    ${row('Kastrovaný/á', bool(a.neutered))}
    ${row('Poslední vet. návštěva', fmtDate(a.last_vet_visit))}
    ${row('Veterinář', v(a.vet_name))}
    ${row('Telefon veterináře', v(a.vet_phone))}
    ${row('Zdravotní poznámky', v(a.medical_notes))}
    ${!isShelter ? row('Příčina zranění / nálezu', v(a.cause_of_injury)) : ''}
    ${!isShelter ? row('Diagnóza', v(a.diagnosis)) : ''}
    ${!isShelter ? row('Průběh léčby', v(a.treatment_notes)) : ''}
    ${!isShelter ? row('Prognóza', v(a.prognosis)) : ''}
  `)}

  <!-- 6. VAKCINACE (§13 zák. 166/1999 Sb.) -->
  <div class="section">
    <div class="section-header">
      <span class="section-num">6</span>
      <span class="section-title">Vakcinace a ošetření</span>
      <span class="section-legal">§13 zák. 166/1999 Sb.</span>
    </div>
    ${vaccinations.length > 0 ? `
    <table class="vaccine-table">
      <thead>
        <tr>
          <th>Typ vakcinace</th>
          <th>Datum aplikace</th>
          <th>Šarže / batch</th>
          <th>Expirace vakcíny</th>
          <th>Veterinář</th>
        </tr>
      </thead>
      <tbody>
        ${vaccinations.map(vc => `
        <tr>
          <td><strong>${vc.label ?? vc.type ?? '—'}</strong></td>
          <td>${fmtDate(vc.last_date)}</td>
          <td>${v(vc.batch_number)}</td>
          <td>${fmtDate(vc.expiry_date)}</td>
          <td>${v(vc.vet_name)}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : `
    <table class="vaccine-table">
      <tr><td colspan="5" style="padding:8px;text-align:center;color:#A09890;font-style:italic">Žádné záznamy o vakcinaci</td></tr>
    </table>`}
  </div>

  <!-- 7. AKTUÁLNÍ MEDIKACE -->
  ${medications.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <span class="section-num">7</span>
      <span class="section-title">Aktuální medikace</span>
      <span class="section-legal">Vyhl. 342/2012 Sb.</span>
    </div>
    <table class="med-table">
      <thead>
        <tr>
          <th>Název léčiva</th>
          <th>Dávkování</th>
          <th>Frekvence</th>
        </tr>
      </thead>
      <tbody>
        ${medications.map(m => `
        <tr>
          <td><strong>${v(m.name)}</strong></td>
          <td>${v(m.dosage)}</td>
          <td>${v(m.frequency)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- 8. ODCHOD ZE ZAŘÍZENÍ -->
  ${section('8', 'Odchod ze zařízení', '§25b odst. 4 zák. 246/1992 Sb.', `
    ${row('Typ odchodu', a.exit_type ? (exitTypeLabel[a.exit_type] ?? a.exit_type) : '—', true)}
    ${row('Datum odchodu', fmtDate(a.exit_date))}
    ${row('Pracovník propuštění', v(a.exit_worker))}
    ${row('Poznámky k odchodu', v(a.exit_notes))}
    ${a.exit_type === 'adopted' ? `
      ${row('Adoptér — jméno', v(a.adopter_name))}
      ${row('Adoptér — adresa', v(a.adopter_address))}
      ${row('Adoptér — telefon', v(a.adopter_phone))}
      ${row('OP č. adoptéra', v(a.adopter_id_number))}
      ${row('Číslo adopční smlouvy', v(a.adoption_contract_num), true)}
      ${row('Datum adopce', fmtDate(a.adoption_date))}
    ` : ''}
    ${a.exit_type === 'transferred' ? `
      ${row('Přemístěno do', v(a.transfer_institution))}
      ${row('Datum přemístění', fmtDate(a.transfer_date))}
      ${row('Doklad č.', v(a.transfer_doc_number))}
    ` : ''}
    ${a.exit_type === 'deceased' || a.adoption_status === 'deceased' || a.status === 'deceased' ? `
      ${row('Datum uhynutí', fmtDate(a.death_date), true)}
      ${row('Příčina uhynutí', a.death_type ? (deathTypeLabel[a.death_type] ?? a.death_type) : '—')}
      ${row('Popis příčiny', v(a.death_cause))}
      ${row('Veterinář', v(a.death_vet))}
      ${row('Způsob likvidace těla', a.disposal_method ? (disposalLabel[a.disposal_method] ?? a.disposal_method) : '—')}
      ${row('Doklad o likvidaci č.', v(a.disposal_doc_number))}
      ${row('Firma / asanační podnik', v(a.disposal_company))}
    ` : ''}
  `)}

  <!-- QR + podpis oprávněné osoby -->
  <div class="bottom-row">
    <div class="qr-block">
      <img src="${qrUrl}" alt="QR digitální záznam" />
      <div class="qr-label">Digitální záznam<br>${BASE}</div>
    </div>
    <div class="sig-area">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Odpovědná osoba instituce</div>
        <div class="sig-date">${todayCs}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Razítko instituce</div>
      </div>
    </div>
  </div>

  <!-- Patička -->
  <div class="doc-footer">
    <div>
      <div>Evidenční číslo: <strong>${evidenceNum}</strong> · ID: ${String(a.id ?? '').slice(0, 8)}...</div>
      <div>Generováno systémem Zozio · zozio.cz · Vytisknuto: ${todayCs}</div>
    </div>
    <div class="legal-refs">
      §25b zák. 246/1992 Sb. · Vyhl. 342/2012 Sb.<br>
      §13 zák. 166/1999 Sb. · VZ 255/2012 Sb.${!isShelter ? ' · §54 zák. 114/1992 Sb.' : ''}
    </div>
  </div>

</div><!-- /page -->

</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
