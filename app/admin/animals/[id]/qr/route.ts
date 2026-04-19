import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ADOPTION_STATUS_LABEL,
  HEALTH_STATUS_LABEL, SEX_LABEL, SIZE_LABEL,
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
    .select('id, name, city, email, phone')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) return new NextResponse('Nenalezeno', { status: 404 })

  const { data: animal } = await service
    .from('animals')
    .select('*, species:animal_species(name_cs, icon)')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!animal) return new NextResponse('Zvíře nenalezeno', { status: 404 })

  const a = animal as any
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

  // URL pro QR kód — otevře editaci zvířete
  const editUrl = `${BASE}/admin/animals/${id}?scan=1`

  // Veřejná URL zvířete
  const publicUrl = `${BASE}/animals/${id}`

  const today = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const name    = a.name ?? 'Bez jména'
  const species = a.species?.icon ? `${a.species.icon} ${a.species.name_cs}` : a.species?.name_cs ?? '—'
  const status  = ADOPTION_STATUS_LABEL[a.adoption_status ?? ''] ?? a.adoption_status
  const health  = HEALTH_STATUS_LABEL[a.health_status ?? ''] ?? '—'
  const sex     = SEX_LABEL[a.sex ?? ''] ?? '—'
  const size    = SIZE_LABEL[a.size ?? ''] ?? '—'
  const age     = a.birth_year ? `${new Date().getFullYear() - a.birth_year} let (nar. ${a.birth_year})` : '—'
  const weight  = a.weight_kg ? `${a.weight_kg} kg` : '—'
  const chip    = a.chip_number ?? '—'
  const intake  = a.intake_date
    ? new Date(a.intake_date).toLocaleDateString('cs-CZ')
    : '—'

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QR karta — ${name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
  }

  .card {
    background: white;
    width: 90mm;
    min-height: 55mm;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    overflow: hidden;
    position: relative;
  }

  .header {
    background: #E8634A;
    color: white;
    padding: 10px 14px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .header-left { flex: 1; min-width: 0; }
  .animal-name {
    font-size: 18px;
    font-weight: 800;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .animal-sub {
    font-size: 10px;
    opacity: 0.85;
    margin-top: 2px;
  }
  .status-pill {
    background: rgba(255,255,255,0.25);
    color: white;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 100px;
    white-space: nowrap;
    margin-top: 4px;
    display: inline-block;
  }

  .photo-area {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    background: rgba(255,255,255,0.2);
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .photo-area img { width: 100%; height: 100%; object-fit: cover; }

  .body {
    display: flex;
    gap: 0;
  }

  .info {
    flex: 1;
    padding: 10px 14px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 10px;
  }

  .info-item { }
  .info-label {
    font-size: 8px;
    font-weight: 700;
    color: #8B7355;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .info-value {
    font-size: 10px;
    color: #2C1810;
    font-weight: 600;
    margin-top: 1px;
  }

  .qr-area {
    padding: 10px 12px 10px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .qr-label {
    font-size: 7px;
    color: #8B7355;
    text-align: center;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .footer {
    border-top: 1px solid #F0E8DC;
    padding: 5px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-inst {
    font-size: 8px;
    color: #8B7355;
    font-weight: 600;
  }
  .footer-date {
    font-size: 7px;
    color: #B0A090;
  }

  /* Urgent badge */
  .urgent-badge {
    position: absolute;
    top: 8px;
    right: 70px;
    background: #E8634A;
    color: white;
    font-size: 8px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 100px;
    border: 2px solid white;
  }

  .print-btn {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 16px;
  }
  .btn {
    padding: 10px 20px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-print  { background: #2C1810; color: white; }
  .btn-edit   { background: #E8634A; color: white; }
  .btn-cancel { background: #F0E8DC; color: #6B3F1F; }

  @media print {
    body { background: white; padding: 0; display: block; }
    .print-btn { display: none; }
    .card {
      box-shadow: none;
      margin: 0;
      border: 1px solid #eee;
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>

<div style="max-width:400px;width:100%">

  <!-- Karta -->
  <div class="card">
    ${a.urgent ? '<div class="urgent-badge">🆘 URGENTNÍ</div>' : ''}

    <!-- Hlavička -->
    <div class="header">
      <div class="header-left">
        <div class="animal-name">${name}</div>
        <div class="animal-sub">${species}${a.breed ? ' · ' + a.breed : ''}</div>
        <span class="status-pill">${status}</span>
      </div>
      <div class="photo-area">
        ${a.primary_photo
          ? `<img src="${a.primary_photo}" alt="${name}" />`
          : `<span>${a.species?.icon ?? '🐾'}</span>`
        }
      </div>
    </div>

    <!-- Tělo -->
    <div class="body">
      <div class="info">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Pohlaví</div>
            <div class="info-value">${sex}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Věk</div>
            <div class="info-value">${age}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Velikost</div>
            <div class="info-value">${size}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Váha</div>
            <div class="info-value">${weight}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Zdraví</div>
            <div class="info-value">${health}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Čip</div>
            <div class="info-value">${chip}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Příjem</div>
            <div class="info-value">${intake}</div>
          </div>
          ${a.quarantine_box ? `
          <div class="info-item" style="grid-column:1/-1">
            <div class="info-label">Box karantény</div>
            <div class="info-value">${a.quarantine_box}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- QR kód -->
      <div class="qr-area">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(editUrl)}&bgcolor=ffffff&color=2C1810&margin=2"
          width="70" height="70"
          alt="QR kód"
          style="border-radius:6px"
        />
        <div class="qr-label">Skenuj pro<br>editaci</div>
      </div>
    </div>

    <!-- Patička -->
    <div class="footer">
      <div class="footer-inst">${institution.name} · ${institution.city ?? ''}</div>
      <div class="footer-date">Vytisknuto: ${today}</div>
    </div>
  </div>

  <!-- Tlačítka (schovaná při tisku) -->
  <div class="print-btn">
    <button class="btn btn-print" onclick="window.print()">🖨️ Tisknout</button>
    <a class="btn btn-edit" href="/admin/animals/${id}">✏️ Upravit</a>
    <button class="btn btn-cancel" onclick="window.close()">Zavřít</button>
  </div>

  <p style="text-align:center;font-size:11px;color:#8B7355;margin-top:10px">
    QR kód otevře editaci zvířete · ${BASE}
  </p>
</div>

</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
