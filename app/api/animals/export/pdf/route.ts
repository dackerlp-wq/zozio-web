import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

const STATUS_LABELS: Record<string, string> = {
  available:      'K adopci',
  reserved:       'Rezervováno',
  adopted:        'Adoptováno',
  foster:         'Pěstounská péče',
  intake:         'V příjmu',
  treatment:      'Léčba',
  rehabilitation: 'Rehabilitace',
  released:       'Propuštěno',
  deceased:       'Uhynulo',
}

const SEX_LABELS: Record<string, string> = {
  male: 'samec', female: 'samice', unknown: 'neznámé',
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('cs-CZ')
}

export async function GET(req: NextRequest) {
  const params   = new URL(req.url).searchParams
  const status   = params.get('status') ?? ''
  const yearStr  = params.get('year') ?? ''
  const monthStr = params.get('month') ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return new NextResponse('Forbidden', { status: 403 })

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()
  if (!institution) return new NextResponse('Not found', { status: 404 })

  const isShelter   = institution.type === 'shelter'
  const table       = isShelter ? 'animals' : 'rescue_cases'
  const statusField = isShelter ? 'adoption_status' : 'status'

  const selectFields = isShelter
    ? 'id, name, breed, sex, birth_year, chip_number, adoption_status, intake_date, created_at, species:animal_species(name_cs)'
    : 'id, name, case_number, status, intake_date, created_at, estimated_age, species:animal_species(name_cs)'

  let query = service
    .from(table)
    .select(selectFields)
    .eq('institution_id', institution.id) as any

  if (status) query = query.eq(statusField, status)

  if (yearStr) {
    const year = Number(yearStr)
    const from = new Date(year, monthStr ? Number(monthStr) - 1 : 0, 1).toISOString()
    const to   = monthStr
      ? new Date(year, Number(monthStr), 0, 23, 59, 59).toISOString()
      : new Date(year, 12, 0, 23, 59, 59).toISOString()
    query = query.gte('intake_date', from).lte('intake_date', to)
  }

  const { data: animals } = await query.order('intake_date', { ascending: true })
  const items = (animals ?? []) as any[]

  const filterParts: string[] = []
  if (status)   filterParts.push(`Status: ${STATUS_LABELS[status] ?? status}`)
  if (yearStr)  filterParts.push(`Rok příjmu: ${yearStr}`)
  if (monthStr) filterParts.push(`Měsíc příjmu: ${monthStr}`)
  const filterDesc = filterParts.length ? filterParts.join(', ') : 'bez filtru (vše)'

  const exportedAt = new Date().toLocaleString('cs-CZ')

  const counts: Record<string, number> = {}
  for (const item of items) {
    const s = isShelter ? item.adoption_status : item.status
    counts[s] = (counts[s] ?? 0) + 1
  }

  const summaryRows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `<tr><td>${STATUS_LABELS[s] ?? s}</td><td class="num">${n}</td></tr>`)
    .join('')

  const dataRows = isShelter
    ? items.map((a, i) => `
        <tr class="${i % 2 === 1 ? 'even' : ''}">
          <td class="num">${i + 1}</td>
          <td>${a.name ?? '—'}</td>
          <td>${a.species?.name_cs ?? '—'}</td>
          <td>${a.breed ?? '—'}</td>
          <td>${SEX_LABELS[a.sex] ?? a.sex ?? '—'}</td>
          <td class="num">${a.birth_year ?? '—'}</td>
          <td>${a.chip_number ?? '—'}</td>
          <td>${STATUS_LABELS[a.adoption_status] ?? a.adoption_status ?? '—'}</td>
          <td>${formatDate(a.intake_date ?? a.created_at)}</td>
        </tr>`).join('')
    : items.map((a, i) => `
        <tr class="${i % 2 === 1 ? 'even' : ''}">
          <td class="num">${i + 1}</td>
          <td>${a.name ?? '—'}</td>
          <td>${a.case_number ?? '—'}</td>
          <td>${a.species?.name_cs ?? '—'}</td>
          <td>${a.estimated_age ?? '—'}</td>
          <td>${STATUS_LABELS[a.status] ?? a.status ?? '—'}</td>
          <td>${formatDate(a.intake_date ?? a.created_at)}</td>
        </tr>`).join('')

  const shelterHead = `<tr>
    <th class="num">#</th><th>Jméno</th><th>Druh</th><th>Plemeno</th>
    <th>Pohlaví</th><th class="num">Rok nar.</th><th>Číslo čipu</th>
    <th>Status</th><th>Datum příjmu</th>
  </tr>`

  const rescueHead = `<tr>
    <th class="num">#</th><th>Jméno</th><th>Číslo případu</th><th>Druh</th>
    <th>Věk</th><th>Status</th><th>Datum příjmu</th>
  </tr>`

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Export zvířat — ${institution.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; padding: 20mm 15mm; }
    .header { margin-bottom: 8mm; }
    .header h1 { font-size: 14pt; font-weight: bold; margin-bottom: 2mm; }
    .header .meta { font-size: 9pt; color: #555; line-height: 1.6; }
    .header .filter { display: inline-block; margin-top: 2mm; font-size: 9pt; background: #f5f5f5; padding: 1mm 3mm; border-radius: 2px; }
    .section-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #444; margin: 6mm 0 2mm; border-bottom: 0.5pt solid #ccc; padding-bottom: 1mm; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #2C1810; color: white; font-size: 8.5pt; font-weight: bold; padding: 2mm 2.5mm; text-align: left; }
    td { font-size: 8.5pt; padding: 1.8mm 2.5mm; border-bottom: 0.3pt solid #e0e0e0; vertical-align: top; }
    tr.even td { background: #fafafa; }
    .num { text-align: center; }
    .summary-table { width: auto; min-width: 120mm; }
    .summary-table td { font-size: 9pt; padding: 1.5mm 3mm; }
    .summary-table td:last-child { font-weight: bold; text-align: right; min-width: 20mm; }
    .total-row td { background: #f0ede8; font-weight: bold; }
    .footer { margin-top: 8mm; font-size: 8pt; color: #888; text-align: center; border-top: 0.3pt solid #ccc; padding-top: 3mm; }
    @media print {
      body { padding: 10mm; }
      @page { margin: 10mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Přehled evidence zvířat</h1>
    <div class="meta">
      <strong>Instituce:</strong> ${institution.name}<br>
      <strong>Datum exportu:</strong> ${exportedAt}
    </div>
    <div class="filter">Filtr: ${filterDesc}</div>
  </div>

  <div class="section-title">Seznam zvířat (celkem ${items.length})</div>
  <table>
    <thead>${isShelter ? shelterHead : rescueHead}</thead>
    <tbody>${dataRows}</tbody>
  </table>

  <div class="section-title">Souhrn podle stavu</div>
  <table class="summary-table">
    <tbody>
      ${summaryRows}
      <tr class="total-row"><td>Celkem</td><td class="num">${items.length}</td></tr>
    </tbody>
  </table>

  <div class="footer">
    Dokument vygenerován systémem Zozio &nbsp;·&nbsp; ${exportedAt} &nbsp;·&nbsp; ${institution.name}
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
