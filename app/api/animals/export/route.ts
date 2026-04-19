import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { hasFeature } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

const STATUS_LABELS: Record<string, string> = {
  available:      'K adopci',
  reserved:       'Rezervováno',
  adopted:        'Adoptováno',
  foster:         'Dočasná péče',
  intake:         'V příjmu',
  treatment:      'Léčba',
  rehabilitation: 'Rehabilitace',
  released:       'Propuštěno',
  deceased:       'Uhynulo',
}

const SEX_LABELS: Record<string, string> = {
  male: 'samec', female: 'samice', unknown: 'neznámé',
}

function esc(v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  const s = String(v).replace(/"/g, '""')
  return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s
}

function row(...cells: unknown[]): string {
  return cells.map(esc).join(',')
}

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
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
    .select('id, name, plan, plan_expires_at')
    .eq('id', membership.institution_id)
    .single()
  if (!institution) return new NextResponse('Not found', { status: 404 })

  // Plan gate — export CSV je Standard+
  if (!hasFeature(
    (institution as any).plan as SubscriptionPlan ?? 'free',
    (institution as any).plan_expires_at ?? null,
    'export_csv'
  )) {
    return new NextResponse('Export CSV vyžaduje plán Standard nebo Pro.', { status: 403 })
  }

  const selectFields = 'id, name, breed, sex, birth_year, birth_month, chip_number, adoption_status, intake_date, created_at, color, weight_kg, species:animal_species(name_cs)'

  let query = service
    .from('animals')
    .select(selectFields)
    .eq('institution_id', institution.id) as any

  if (status)   query = query.eq('adoption_status', status)

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

  // ── Popis filtru ──────────────────────────────────────────────────────────
  const filterParts: string[] = []
  if (status)   filterParts.push(`Status: ${STATUS_LABELS[status] ?? status}`)
  if (yearStr)  filterParts.push(`Rok příjmu: ${yearStr}`)
  if (monthStr) filterParts.push(`Měsíc příjmu: ${monthStr}`)
  const filterDesc = filterParts.length ? filterParts.join(', ') : 'bez filtru (vše)'

  const exportedAt = new Date().toLocaleString('cs-CZ')

  // ── Počty stavů ───────────────────────────────────────────────────────────
  const counts: Record<string, number> = {}
  for (const item of items) {
    const s = item.adoption_status
    counts[s] = (counts[s] ?? 0) + 1
  }

  // ── Sestavení CSV ─────────────────────────────────────────────────────────
  const lines: string[] = []

  // Hlavička pro úřady
  lines.push(row('PŘEHLED EVIDENCE ZVÍŘAT'))
  lines.push(row('Instituce:', institution.name))

  lines.push(row('Datum exportu:', exportedAt))
  lines.push(row('Filtr:', filterDesc))
  lines.push(row('Celkový počet záznamů:', items.length))
  lines.push('')

  // Záhlaví tabulky
  lines.push(row('Jméno', 'Druh', 'Plemeno', 'Pohlaví', 'Rok nar.', 'Číslo čipu', 'Status', 'Datum příjmu', 'Barva', 'Hmotnost (kg)'))
  for (const a of items) {
    lines.push(row(
      a.name,
      a.species?.name_cs,
      a.breed,
      SEX_LABELS[a.sex] ?? a.sex,
      a.birth_year,
      a.chip_number,
      STATUS_LABELS[a.adoption_status] ?? a.adoption_status,
      formatDate(a.intake_date ?? a.created_at),
      a.color,
      a.weight_kg,
    ))
  }

  // Souhrnná část
  lines.push('')
  lines.push(row('SOUHRN'))
  lines.push(row('Celkem zvířat:', items.length))
  for (const [s, cnt] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    lines.push(row(STATUS_LABELS[s] ?? s, cnt))
  }

  // BOM pro správné zobrazení v Excelu
  const bom  = '\uFEFF'
  const csv  = bom + lines.join('\r\n')
  const safe = institution.name.replace(/[^a-zA-Z0-9]/g, '-')
  const date = new Date().toISOString().slice(0, 10)
  const filename = `export-${safe}-${date}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
