import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { WorkflowBar } from '@/components/admin/AnimalWorkflowCard'
import type { Animal } from '@/components/admin/AnimalWorkflowCard'
import { AdminAnimalSearch } from '@/components/admin/AdminAnimalSearch'

/* ─── Types ─────────────────────────────────────────────── */
interface AnimalRow extends Animal {
  vaccine_expiring_in?: number | null
}

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

/* ─── Constants ──────────────────────────────────────────── */
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  intake:         { bg: '#E6F1FB', text: '#185FA5', label: 'V příjmu' },
  available:      { bg: '#FDEAE6', text: '#993C1D', label: 'K adopci' },
  reserved:       { bg: '#FFF3D6', text: '#7a5800', label: 'Rezervováno' },
  adopted:        { bg: '#EAF3DE', text: '#1a5e2e', label: 'Adoptováno' },
  foster:         { bg: '#E6F1FB', text: '#185FA5', label: 'Dočasná péče' },
  treatment:      { bg: '#FCEBEB', text: '#D83030', label: 'V léčbě' },
  rehabilitation: { bg: '#FFF3D6', text: '#7a5800', label: 'Rehabilitace' },
  released:       { bg: '#EAF3DE', text: '#1a5e2e', label: 'Vypuštěn' },
  deceased:       { bg: '#F0EDE8', text: '#8B6550', label: 'Uhynul' },
  escaped:        { bg: '#FCEBEB', text: '#D83030', label: 'Uprchlý' },
}

const SPECIES_ICON: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', other: '🐾',
}

/* ─── Helpers ────────────────────────────────────────────── */
function getDays(a: Animal): number {
  if (!a.intake_date) return 0
  if (a.exit_date) {
    return Math.floor((new Date(String(a.exit_date)).getTime() - new Date(String(a.intake_date)).getTime()) / 86400000)
  }
  return Math.floor((Date.now() - new Date(String(a.intake_date)).getTime()) / 86400000)
}

function getSexLabel(sex: unknown): string {
  if (sex === 'female' || sex === 'f') return 'Samice'
  if (sex === 'male'   || sex === 'm') return 'Samec'
  return String(sex ?? '')
}

function ageLabel(a: Animal): string {
  const y = Number(a.age_years)
  if (!a.age_years && a.age_years !== 0) return ''
  return `${y} ${y === 1 ? 'rok' : y < 5 ? 'roky' : 'let'}`
}

type PhaseDot = 'done' | 'active' | 'err' | 'future'

function getPhaseDots(a: Animal): PhaseDot[] {
  const s = String(a.adoption_status ?? 'intake')
  const isExited = Boolean(a.exit_type)
  const days = getDays(a)

  const dots: PhaseDot[] = [
    'done',
    a.chip_number ? 'done' : (s === 'intake' ? 'active' : 'future'),
    a.quarantine_end || (a.in_quarantine === false && a.quarantine_start)
      ? 'done'
      : a.chip_number ? 'active' : 'future',
    a.health_status && a.health_status !== 'unknown' ? 'done' : 'future',
    ['available','reserved','adopted','foster','treatment','rehabilitation'].includes(s) ? (isExited ? 'done' : 'active') : 'future',
    isExited ? 'done' : 'future',
  ]

  if (days > 30 && !a.quarantine_end && !a.quarantine_start) dots[2] = 'err'
  return dots
}

function filterAnimals(animals: AnimalRow[], q: string, status: string): AnimalRow[] {
  let result = animals
  if (status) {
    result = result.filter(a => String(a.adoption_status ?? '') === status)
  }
  if (q.trim()) {
    const lower = q.toLowerCase().trim()
    result = result.filter(a =>
      String(a.name ?? '').toLowerCase().includes(lower) ||
      String(a.breed ?? '').toLowerCase().includes(lower) ||
      String(a.evidence_number ?? '').toLowerCase().includes(lower) ||
      String(a.chip_number ?? '').toLowerCase().includes(lower)
    )
  }
  return result
}

/* ══════════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════ */
export default async function AnimalsListPage({ searchParams }: PageProps) {
  const { q = '', status = '' } = await searchParams

  /* ── Auth ── */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const { data: rawAnimals } = await service
    .from('animals')
    .select('*')
    .eq('institution_id', institution.id)
    .order('intake_date', { ascending: false })

  const allAnimals = (rawAnimals ?? []) as AnimalRow[]
  const animals    = filterAnimals(allAnimals, q, status)

  const activeAnimals  = allAnimals.filter(a => !['adopted','deceased','escaped','released'].includes(String(a.adoption_status ?? '')))
  const attentionCount = allAnimals.filter(a => {
    const days = getDays(a)
    return days > 60 || (a.vaccine_expiring_in != null && (a.vaccine_expiring_in as number) < 14)
  }).length

  const redAlerts  = allAnimals.filter(a => getDays(a) > 60 && !a.exit_type)
  const warnAlerts = allAnimals.filter(a => a.vaccine_expiring_in != null && (a.vaccine_expiring_in as number) < 14 && !a.exit_type)

  const isFiltered = Boolean(q.trim() || status)

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F7F4F0' }}>
      <div className="max-w-[900px] mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 className="font-black" style={{ fontSize: '22px', color: '#2C1810' }}>Zvířata v útulku</h1>
            <div className="text-sm mt-0.5" style={{ color: '#8B6550' }}>
              {activeAnimals.length} aktivních · {attentionCount} vyžadují pozornost
            </div>
          </div>
          <Link
            href="/admin/animals/new"
            className="inline-flex items-center gap-1.5 font-black rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ padding: '10px 20px', background: '#E8634A', fontSize: '13px', textDecoration: 'none' }}
          >
            + Přijmout nové zvíře
          </Link>
        </div>

        {/* Alert strips — skrýt při filtrování */}
        {!isFiltered && redAlerts.map(a => (
          <div key={String(a.id)} className="flex items-center gap-2 rounded-lg mb-2 font-black" style={{ padding: '12px 14px', background: '#FCEBEB', borderLeft: '3px solid #D83030', color: '#D83030', fontSize: '12px' }}>
            <span>🚨</span>
            <span><strong>{String(a.name)}</strong> — pobyt {getDays(a)} dní, chybí záznamy karantény (zákonná povinnost)</span>
            <Link href={`/admin/animals/${String(a.id)}/edit?tab=quarantine`} className="rounded font-black text-white ml-auto" style={{ padding: '4px 10px', background: '#D83030', fontSize: '11px', borderRadius: '5px', textDecoration: 'none' }}>
              Doplnit
            </Link>
          </div>
        ))}
        {!isFiltered && warnAlerts.map(a => (
          <div key={`warn-${String(a.id)}`} className="flex items-center gap-2 rounded-lg mb-2 font-black" style={{ padding: '12px 14px', background: '#FFF3D6', borderLeft: '3px solid #f0a500', color: '#7a5800', fontSize: '12px' }}>
            <span>⚠️</span>
            <span><strong>{String(a.name)}</strong> — vakcína expiruje za {a.vaccine_expiring_in} dní</span>
            <Link href={`/admin/animals/${String(a.id)}/edit?tab=health`} className="rounded font-black text-white ml-auto" style={{ padding: '4px 10px', background: '#f0a500', fontSize: '11px', borderRadius: '5px', textDecoration: 'none' }}>
              Naplánovat
            </Link>
          </div>
        ))}

        {/* Search */}
        <div className="mb-4">
          <AdminAnimalSearch
            currentQ={q}
            currentStatus={status}
            isShelter={institution.type === 'shelter'}
            institutionName={String(institution.name)}
          />
        </div>

        {/* Result count when filtered */}
        {isFiltered && (
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-black" style={{ color: '#8B6550' }}>
              {animals.length === 0
                ? 'Žádné výsledky'
                : `${animals.length} ${animals.length === 1 ? 'výsledek' : animals.length < 5 ? 'výsledky' : 'výsledků'}`}
            </div>
            <Link href="/admin/animals" className="text-xs font-black hover:underline" style={{ color: '#E8634A', textDecoration: 'none' }}>
              Zrušit filtr ✕
            </Link>
          </div>
        )}

        {/* Animal rows */}
        {animals.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: 'white', border: '1px solid #F0EDE8', color: '#8B6550' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🐾</div>
            <div className="font-black text-sm">
              {isFiltered ? 'Žádná zvířata neodpovídají filtru' : 'Žádná zvířata v útulku'}
            </div>
            {!isFiltered && (
              <div className="text-xs mt-1" style={{ color: '#A09890' }}>Přijměte první zvíře pomocí tlačítka výše.</div>
            )}
          </div>
        ) : (
          animals.map(a => <AnimalRowEl key={String(a.id)} animal={a} />)
        )}

        {/* Legend */}
        {!isFiltered && animals.length > 0 && (
          <div className="mt-4 rounded-lg" style={{ padding: '14px', background: 'white', border: '1px solid #F0EDE8' }}>
            <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.06em' }}>Legenda průběhu pobytu (6 fází)</div>
            <div className="flex gap-4 flex-wrap text-xs mb-2">
              <LegendDot variant="done"   label="Dokončeno" />
              <LegendDot variant="active" label="Aktuální fáze" />
              <LegendDot variant="err"    label="Chybí zákonné záznamy" />
              <LegendDot variant="future" label="Budoucí" />
            </div>
            <div className="flex gap-2 flex-wrap text-xs" style={{ color: '#8B6550' }}>
              {['① 📥 Příjem','② 🔖 Identifikace','③ 🔒 Karanténa','④ 💊 Zdraví','⑤ 🏠 K adopci','⑥ ✅ Odchod'].map(l => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <WorkflowBar active="list" />
    </div>
  )
}

/* ─── AnimalRow ──────────────────────────────────────────── */
function AnimalRowEl({ animal: a }: { animal: AnimalRow }) {
  const days       = getDays(a)
  const statusKey  = String(a.adoption_status ?? 'intake')
  const statusInfo = STATUS_COLORS[statusKey] ?? STATUS_COLORS.intake
  const dots       = getPhaseDots(a)
  const isExited   = Boolean(a.exit_type)
  const isLong     = days > 30
  const icon       = SPECIES_ICON[String(a.species ?? 'dog')] ?? '🐾'

  const meta = [
    a.breed ? String(a.breed) : null,
    getSexLabel(a.sex) || null,
    ageLabel(a) || null,
    a.weight_kg != null ? `${a.weight_kg} kg` : null,
  ].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/admin/animals/${String(a.id)}`}
      className="flex items-center gap-3 rounded-lg mb-2 transition-all hover:border-[#E8634A]"
      style={{ padding: '12px 14px', border: '2px solid #F0EDE8', background: 'white', opacity: isExited ? .7 : 1, textDecoration: 'none' }}
    >
      {/* Ikona druhu */}
      <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: '40px', height: '40px', background: '#F0EDE8', fontSize: '20px' }}>
        {icon}
      </div>

      {/* Střed — jméno + meta */}
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm truncate" style={{ color: '#2C1810' }}>
          {String(a.name ?? '—')}
        </div>
        {meta && (
          <div className="text-xs mt-0.5 truncate" style={{ color: '#8B6550' }}>{meta}</div>
        )}
      </div>

      {/* Pravý sloupec — badge + fáze + dny */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {/* Status badge + evidence number */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span
            className="inline-flex items-center rounded-full font-black px-2 py-0.5"
            style={{ fontSize: '11px', background: statusInfo.bg, color: statusInfo.text }}
          >
            {statusInfo.label}
          </span>
          {a.evidence_number && (
            <span className="font-black" style={{ fontSize: '10px', fontFamily: 'monospace', color: '#A09890' }}>
              {String(a.evidence_number)}
            </span>
          )}
          {a.vaccine_expiring_in != null && (a.vaccine_expiring_in as number) < 14 && (
            <span className="inline-flex items-center rounded-full font-black px-1.5 py-0.5" style={{ fontSize: '10px', background: '#FCEBEB', color: '#D83030' }}>⚠</span>
          )}
        </div>
        {/* Fázové tečky + day badge */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 items-center">
            {dots.map((d, i) => <PhaseDotEl key={i} variant={d} />)}
          </div>
          <DayBadgeSmall days={days} isExited={isExited} exitDate={String(a.exit_date ?? '')} isLong={isLong} />
        </div>
      </div>
    </Link>
  )
}

function PhaseDotEl({ variant }: { variant: PhaseDot }) {
  const colors = { done: '#2D8A4E', active: '#E8634A', err: '#D83030', future: '#E8E4E0' }
  return <div className="rounded-full" style={{ width: '9px', height: '9px', background: colors[variant] }} />
}

function LegendDot({ variant, label }: { variant: PhaseDot; label: string }) {
  const colors = { done: '#2D8A4E', active: '#E8634A', err: '#D83030', future: '#E8E4E0' }
  return (
    <div className="flex items-center gap-1">
      <div className="rounded-full" style={{ width: '9px', height: '9px', background: colors[variant] }} />
      <span>{label}</span>
    </div>
  )
}

function DayBadgeSmall({ days, isExited, exitDate, isLong }: { days: number; isExited: boolean; exitDate: string; isLong: boolean }) {
  if (isExited) {
    return (
      <div className="inline-flex flex-col items-center rounded-md" style={{ padding: '3px 7px', background: '#EAF3DE' }}>
        <div className="font-black leading-none" style={{ fontSize: '13px', color: '#2D8A4E' }}>✓</div>
        <div className="font-black uppercase tracking-wider" style={{ fontSize: '8px', color: '#2D8A4E' }}>
          {exitDate ? exitDate.slice(5).replace('-', '.') + '.' : 'Exit'}
        </div>
      </div>
    )
  }
  const bg   = isLong ? '#FCEBEB' : '#FDEAE6'
  const text = isLong ? '#D83030' : '#E8634A'
  return (
    <div className="inline-flex flex-col items-center rounded-md" style={{ padding: '3px 7px', background: bg }}>
      <div className="font-black leading-none" style={{ fontSize: '16px', color: text }}>{days}</div>
      <div className="font-black uppercase tracking-wider" style={{ fontSize: '8px', color: text }}>dní</div>
    </div>
  )
}
