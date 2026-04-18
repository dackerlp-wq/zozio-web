/**
 * PDF: Adopční smlouva
 * Určeno pro nového majitele (adoptéra).
 * Obsahuje: smluvní strany, popis zvířete, podmínky, QR ověření, podpisy.
 *
 * GET /admin/animals/[id]/pdf/adoption
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SEX_LABEL, HEALTH_STATUS_LABEL } from '@/lib/animal-labels'

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

  if (institution.type !== 'shelter') {
    return new NextResponse('Adopční smlouva je dostupná pouze pro útulky', { status: 400 })
  }

  const { data: animal } = await service
    .from('animals')
    .select('*, species:animal_species(name_cs, icon)')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!animal) return new NextResponse('Záznam nenalezen', { status: 404 })

  const a = animal as any
  const inst = institution as any

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

  // QR kód — verifikace smlouvy (odkaz na veřejný profil zvířete)
  const verifyUrl = `${BASE}/animals/${id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=1a1a1a&margin=3`

  const today = new Date()
  const todayCs = today.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
  const todayIso = today.toISOString().split('T')[0]

  // Číslo smlouvy
  const contractNum = a.adoption_contract_num
    || `ZOZ-SMLV-${today.getFullYear()}-${String(id).slice(0, 6).toUpperCase()}`

  const adoptionDate = a.adoption_date
    ? new Date(a.adoption_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : todayCs

  const animalName = a.name ?? 'Bez jména'
  const species = a.species?.name_cs ?? '—'
  const breed = a.breed ?? '—'
  const sex = SEX_LABEL[a.sex ?? ''] ?? '—'
  const birthYear = a.birth_year ? `${a.birth_year}` : '—'
  const chipNumber = a.chip_number ?? 'Nečipováno'
  const passportNum = a.passport_number ?? '—'
  const healthStatus = HEALTH_STATUS_LABEL[a.health_status ?? ''] ?? '—'
  const color = a.color ?? '—'

  // Adopter data
  const adopterName = a.adopter_name ?? '.................................................'
  const adopterAddress = a.adopter_address ?? '.................................................'
  const adopterPhone = a.adopter_phone ?? '.................................................'
  const adopterEmail = a.adopter_email ?? '.................................................'
  const adopterIdNum = a.adopter_id_number ?? '.................................................'
  const adoptionFee = a.adoption_fee != null
    ? (Number(a.adoption_fee) === 0 ? 'zdarma' : `${Number(a.adoption_fee).toFixed(0)} Kč`)
    : '.................................................'

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Adopční smlouva — ${animalName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #FFFCF8;
    color: #1a1a1a;
    font-size: 11pt;
    line-height: 1.5;
  }
  .page {
    max-width: 210mm;
    margin: 0 auto;
    padding: 20mm 20mm 18mm;
    background: white;
    min-height: 297mm;
    position: relative;
  }

  /* Hlavička */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2.5px solid #E8634A;
    padding-bottom: 14px;
    margin-bottom: 20px;
    gap: 20px;
  }
  .header-brand { flex: 1; }
  .header-brand .logo {
    font-size: 22pt;
    font-weight: 900;
    color: #E8634A;
    letter-spacing: -0.5px;
    line-height: 1;
  }
  .header-brand .logo span { color: #F0A500; }
  .header-brand .subtitle {
    font-size: 8pt;
    color: #8B6550;
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .header-meta { text-align: right; }
  .header-meta .contract-num {
    font-size: 9pt;
    font-weight: 700;
    color: #2C1810;
    background: #FDEAE6;
    padding: 4px 10px;
    border-radius: 100px;
    display: inline-block;
    margin-bottom: 4px;
  }
  .header-meta .date {
    font-size: 8.5pt;
    color: #8B6550;
    display: block;
  }

  /* Nadpis */
  h1.doc-title {
    font-size: 16pt;
    font-weight: 900;
    color: #2C1810;
    text-align: center;
    margin-bottom: 6px;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 9pt;
    color: #8B6550;
    margin-bottom: 22px;
  }

  /* Sekce */
  .section {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 10pt;
    font-weight: 700;
    color: white;
    background: #E8634A;
    padding: 5px 10px;
    border-radius: 4px 4px 0 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .section-body {
    border: 1.5px solid #F0E8DC;
    border-top: none;
    border-radius: 0 0 4px 4px;
    padding: 10px 12px;
    background: white;
  }

  /* Grid pro 2 sloupce */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 16px; }

  .field { margin-bottom: 4px; }
  .field-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #8B6550;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .field-value {
    font-size: 10.5pt;
    color: #1a1a1a;
    font-weight: 600;
    border-bottom: 1px solid #E8E0D8;
    padding-bottom: 1px;
    min-height: 18px;
  }
  .field-value.highlight {
    color: #E8634A;
    font-weight: 700;
  }

  /* Podmínky */
  .terms {
    font-size: 9pt;
    color: #3a3a3a;
    line-height: 1.6;
  }
  .terms ol { padding-left: 18px; }
  .terms li { margin-bottom: 5px; }
  .terms strong { color: #2C1810; }

  /* Checkbox */
  .checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 8px;
    font-size: 9pt;
  }
  .checkbox-box {
    width: 12px; height: 12px;
    border: 1.5px solid #8B6550;
    border-radius: 2px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  /* QR + podpisy */
  .bottom-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 20px;
    gap: 20px;
  }
  .qr-block {
    text-align: center;
    flex-shrink: 0;
  }
  .qr-block img {
    width: 100px; height: 100px;
    border: 1.5px solid #E8E0D8;
    border-radius: 6px;
    display: block;
  }
  .qr-label {
    font-size: 7pt;
    color: #8B6550;
    margin-top: 4px;
    text-align: center;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .signatures {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .sig-block { }
  .sig-line {
    border-bottom: 1px solid #2C1810;
    margin-bottom: 6px;
    height: 50px;
  }
  .sig-label {
    font-size: 8pt;
    color: #8B6550;
    text-align: center;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .sig-name {
    font-size: 8pt;
    color: #2C1810;
    text-align: center;
    font-weight: 600;
    margin-top: 2px;
  }

  /* Patička */
  .footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #F0E8DC;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #A09880;
  }
  .footer .legal-ref {
    font-style: italic;
  }

  /* Tlačítka — schovaná při tisku */
  .no-print {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding: 16px 0;
    background: #F5F0EA;
  }
  .btn {
    padding: 10px 24px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: Arial, sans-serif;
  }
  .btn-print { background: #E8634A; color: white; }
  .btn-back  { background: #F0E8DC; color: #6B4030; }

  /* Zvíře foto */
  .animal-photo {
    width: 80px; height: 80px;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid #F0E8DC;
    float: right;
    margin-left: 12px;
  }
  .animal-icon {
    width: 80px; height: 80px;
    border-radius: 8px;
    border: 2px solid #F0E8DC;
    float: right;
    margin-left: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    background: #FDEAE6;
  }

  @media print {
    body { background: white; }
    .no-print { display: none; }
    .page { padding: 10mm 12mm; margin: 0; max-width: 100%; }
    @page {
      size: A4 portrait;
      margin: 0;
    }
  }
</style>
</head>
<body>

<!-- Tlačítka + předvyplnění (skrytá při tisku) -->
<div class="no-print">
  <div style="background:#FFF8F6;border:1.5px solid #F5C5B5;border-radius:8px;padding:14px 18px;max-width:640px;margin:0 auto 10px;font-family:Arial,sans-serif">
    <div style="font-size:11px;font-weight:700;color:#E8634A;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">📋 Vyplnit údaje adoptéra před tiskem</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div>
        <label style="font-size:10px;color:#8B6550;font-weight:700;display:block;margin-bottom:2px">Jméno a příjmení</label>
        <input style="width:100%;border:1px solid #E0C8C0;border-radius:4px;padding:5px 8px;font-size:12px;font-family:Arial" value="${a.adopter_name ?? ''}" oninput="var v=this.value||'.................................................' ; document.getElementById('av-name').textContent=v; document.getElementById('av-sig-name').textContent=this.value" />
      </div>
      <div>
        <label style="font-size:10px;color:#8B6550;font-weight:700;display:block;margin-bottom:2px">Trvalé bydliště</label>
        <input style="width:100%;border:1px solid #E0C8C0;border-radius:4px;padding:5px 8px;font-size:12px;font-family:Arial" value="${a.adopter_address ?? ''}" oninput="document.getElementById('av-addr').textContent=this.value||'.................................................'"/>
      </div>
      <div>
        <label style="font-size:10px;color:#8B6550;font-weight:700;display:block;margin-bottom:2px">Telefon</label>
        <input style="width:100%;border:1px solid #E0C8C0;border-radius:4px;padding:5px 8px;font-size:12px;font-family:Arial" value="${a.adopter_phone ?? ''}" oninput="document.getElementById('av-phone').textContent=this.value||'.................................................'"/>
      </div>
      <div>
        <label style="font-size:10px;color:#8B6550;font-weight:700;display:block;margin-bottom:2px">E-mail</label>
        <input style="width:100%;border:1px solid #E0C8C0;border-radius:4px;padding:5px 8px;font-size:12px;font-family:Arial" value="${a.adopter_email ?? ''}" oninput="document.getElementById('av-email').textContent=this.value||'.................................................'"/>
      </div>
      <div>
        <label style="font-size:10px;color:#8B6550;font-weight:700;display:block;margin-bottom:2px">Číslo OP / pasu</label>
        <input style="width:100%;border:1px solid #E0C8C0;border-radius:4px;padding:5px 8px;font-size:12px;font-family:Arial" value="${a.adopter_id_number ?? ''}" oninput="document.getElementById('av-id').textContent=this.value||'.................................................'"/>
      </div>
      <div>
        <label style="font-size:10px;color:#8B6550;font-weight:700;display:block;margin-bottom:2px">Adopční příspěvek (Kč)</label>
        <input style="width:100%;border:1px solid #E0C8C0;border-radius:4px;padding:5px 8px;font-size:12px;font-family:Arial" type="number" value="${a.adoption_fee ?? ''}" oninput="document.getElementById('av-fee').textContent=this.value?this.value+' Kč':'.................................................'"/>
      </div>
    </div>
    <div style="font-size:10px;color:#A08878;margin-top:8px">💡 Zadané údaje se zobrazí v dokumentu níže. Klikněte Tisknout pro uložení PDF.</div>
  </div>
  <div style="display:flex;gap:10px;justify-content:center;padding:6px 0">
    <button class="btn btn-print" onclick="window.print()">🖨️ Tisknout / Uložit PDF</button>
    <a class="btn btn-back" href="/admin/animals/${id}">← Zpět na kartu</a>
  </div>
</div>

<div class="page">

  <!-- Hlavička -->
  <div class="header">
    <div class="header-brand">
      <div class="logo">Z<span>O</span>Z<span style="color:#E8634A">IO</span></div>
      <div class="subtitle">Platforma pro útulky · zozio.cz</div>
    </div>
    <div class="header-meta">
      <span class="contract-num">Smlouva č. ${contractNum}</span>
      <span class="date">Datum: ${adoptionDate}</span>
    </div>
  </div>

  <!-- Název dokumentu -->
  <h1 class="doc-title">ADOPČNÍ SMLOUVA</h1>
  <p class="doc-subtitle">uzavřená dle § 1746 odst. 2 zák. č. 89/2012 Sb., občanský zákoník</p>

  <!-- I. SMLUVNÍ STRANY -->
  <div class="section">
    <div class="section-title">I. Smluvní strany</div>
    <div class="section-body">
      <div class="grid-2">
        <div>
          <div style="font-size:8.5pt;font-weight:700;color:#E8634A;text-transform:uppercase;margin-bottom:6px">Předávající (útulok)</div>
          <div class="field"><div class="field-label">Název instituce</div><div class="field-value">${inst.name ?? '—'}</div></div>
          <div class="field"><div class="field-label">Adresa</div><div class="field-value">${[inst.street, inst.zip, inst.city].filter(Boolean).join(', ') || '—'}</div></div>
          <div class="field"><div class="field-label">IČO</div><div class="field-value">${inst.ico ?? '—'}</div></div>
          <div class="field"><div class="field-label">Reg. č. (útulku)</div><div class="field-value">${inst.registration_number ?? '—'}</div></div>
          <div class="field"><div class="field-label">Kontakt</div><div class="field-value">${inst.email ?? '—'} · ${inst.phone ?? '—'}</div></div>
        </div>
        <div>
          <div style="font-size:8.5pt;font-weight:700;color:#E8634A;text-transform:uppercase;margin-bottom:6px">Přijímající (adoptér)</div>
          <div class="field"><div class="field-label">Jméno a příjmení</div><div class="field-value" id="av-name">${adopterName}</div></div>
          <div class="field"><div class="field-label">Trvalé bydliště</div><div class="field-value" id="av-addr">${adopterAddress}</div></div>
          <div class="field"><div class="field-label">Telefon</div><div class="field-value" id="av-phone">${adopterPhone}</div></div>
          <div class="field"><div class="field-label">E-mail</div><div class="field-value" id="av-email">${adopterEmail}</div></div>
          <div class="field"><div class="field-label">Číslo OP / pasu</div><div class="field-value" id="av-id">${adopterIdNum}</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- II. PŘEDMĚT SMLOUVY -->
  <div class="section">
    <div class="section-title">II. Zvíře — předmět smlouvy</div>
    <div class="section-body">
      ${a.primary_photo
        ? `<img class="animal-photo" src="${a.primary_photo}" alt="${animalName}" />`
        : `<div class="animal-icon">${a.species?.icon ?? '🐾'}</div>`
      }
      <div class="grid-3">
        <div class="field"><div class="field-label">Jméno</div><div class="field-value highlight">${animalName}</div></div>
        <div class="field"><div class="field-label">Druh</div><div class="field-value">${species}</div></div>
        <div class="field"><div class="field-label">Plemeno</div><div class="field-value">${breed}</div></div>
        <div class="field"><div class="field-label">Pohlaví</div><div class="field-value">${sex}</div></div>
        <div class="field"><div class="field-label">Rok narození</div><div class="field-value">${birthYear}</div></div>
        <div class="field"><div class="field-label">Barva / srst</div><div class="field-value">${color}</div></div>
        <div class="field"><div class="field-label">Číslo čipu (ISO 11784)</div><div class="field-value highlight">${chipNumber}</div></div>
        <div class="field"><div class="field-label">Číslo průkazu / pasu</div><div class="field-value">${passportNum}</div></div>
        <div class="field"><div class="field-label">Zdravotní stav</div><div class="field-value">${healthStatus}</div></div>
      </div>
      ${a.evidence_number ? `<div style="margin-top:8px"><div class="field-label">Evidenční číslo</div><div class="field-value" style="font-size:9pt;max-width:200px">${a.evidence_number}</div></div>` : ''}
    </div>
  </div>

  <!-- III. PODMÍNKY ADOPCE -->
  <div class="section">
    <div class="section-title">III. Podmínky adopce</div>
    <div class="section-body terms">
      <ol>
        <li>Přijímající bere na vědomí, že přijímá zvíře dobrovolně a zavazuje se mu poskytovat <strong>řádnou péči</strong> — odpovídající výživu, veterinární péči, přiměřené ubytování a sociální kontakt.</li>
        <li>Přijímající se zavazuje <strong>nepřevádět zvíře na jinou osobu</strong> bez předchozího písemného souhlasu předávajícího. V případě nemožnosti péče je povinen zvíře vrátit předávajícímu.</li>
        <li>Přijímající se zavazuje <strong>udržovat platnost vakcinace</strong> v souladu s doporučením veterináře a předložit doklady na žádost předávajícího.</li>
        <li>Zvíře je <strong>čipováno</strong> a přijímající je povinen zajistit aktualizaci kontaktních údajů v centrálním registru zvířat (CRZ/ČMKU).</li>
        <li>Předávající si vyhrazuje právo provést <strong>kontrolu životních podmínek</strong> zvířete, a to po předchozím telefonickém oznámení.</li>
        <li>Přijímající <strong>potvrzuje seznámení</strong> se zdravotním stavem zvířete k datu adopce a nebude uplatňovat nároky z případných skrytých vad zdravotního charakteru.</li>
        <li>Adopční příspěvek ve výši <strong id="av-fee">${adoptionFee}</strong> pokrývá náklady na veterinární péči poskytnutou v útulku a není cenou za zvíře.</li>
      </ol>

      <div class="checkbox-row">
        <div class="checkbox-box"></div>
        <span>Přijímající prohlašuje, že byl/a řádně informován/a o zdravotním stavu, povaze a potřebách zvířete.</span>
      </div>
      <div class="checkbox-row">
        <div class="checkbox-box"></div>
        <span>Přijímající souhlasí se zpracováním osobních údajů za účelem vedení evidence adopcí dle čl. 6 odst. 1 písm. b) GDPR.</span>
      </div>
    </div>
  </div>

  <!-- QR + Podpisy -->
  <div class="bottom-section">
    <div class="qr-block">
      <img src="${qrUrl}" alt="QR ověření" />
      <div class="qr-label">Ověření smlouvy<br>online</div>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Předávající</div>
        <div class="sig-name">${inst.name ?? ''}</div>
        <div class="sig-name" style="color:#8B6550;font-size:7.5pt">${adoptionDate}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Přijímající (adoptér)</div>
        <div class="sig-name" id="av-sig-name">${a.adopter_name ?? ''}</div>
        <div class="sig-name" style="color:#8B6550;font-size:7.5pt">${adoptionDate}</div>
      </div>
    </div>
  </div>

  <!-- Patička -->
  <div class="footer">
    <span>Generováno systémem Zozio · zozio.cz · Smlouva č. ${contractNum}</span>
    <span class="legal-ref">§ 1746 odst. 2 zák. č. 89/2012 Sb. · §25b zák. 246/1992 Sb.</span>
  </div>

</div><!-- /page -->

</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
