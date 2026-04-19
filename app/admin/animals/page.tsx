import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdminAnimalSearch } from '@/components/admin/AdminAnimalSearch'
import { QuarantineChip } from '@/components/admin/QuarantineChip'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; species?: string; page?: string }>
}

const PAGE_SIZE = 20

/** Vrátí efektivní zobrazovací status — 'quarantine' pokud je aktivní karanténa */
type BadgeVariant = 'intake' | 'quarantine' | 'available' | 'reserved' | 'adopted' | 'foster' | 'treatment' | 'deceased' | 'not_for_adoption' | 'conditional' | 'released' | 'transferred' | 'healthy' | 'sick' | 'injured' | 'recovering' | 'chronic' | 'urgent'

function effectiveStatus(adoptionStatus: string, _inQuarantine: boolean | null, qEnd: string | null): BadgeVariant {
  if (qEnd && new Date(qEnd) > new Date()) return 'quarantine'
  return adoptionStatus as BadgeVariant
}

/** Vrátí počet zbývajících dní karantény (záporné = skončila, null = nemá karanténu) */
function computeQuarantineDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const endDate = new Date(end)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  return Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

/** ISO datum o N dní od dnes */
function isoDatePlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function computeAge(birthYear: number | null, birthMonth: number | null): string | null {
  if (!birthYear) return null
  const now = new Date()
  const age = now.getFullYear() - birthYear
  if (age <= 0) {
    const months = (now.getFullYear() - birthYear) * 12 + (now.getMonth() - (birthMonth ?? 0))
    return months <= 1 ? '< 1 m.' : `${months} m.`
  }
  return age === 1 ? '1 r.' : `${age} r.`
}

export default async function AdminAnimalsPage({ searchParams }: PageProps) {
  const { q, status: filterStatus, species: filterSpecies, page: pageParam } = await searchParams
  const page = Number(pageParam ?? 1)
  const offset = (page - 1) * PAGE_SIZE

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

  const activeColor = '#E8634A'

  // Archivní stavy (nezobrazovat v hlavním výpisu)
  const archiveStatuses = ['adopted', 'deceased']
  const isArchive = filterStatus === 'archive'

  // Počty pro záložky
  const tabStatuses = ['available', 'reserved', 'foster'] as const

  const [activeResult, archiveResult, ...tabCountResults] = await Promise.all([
    service.from('animals').select('id', { count: 'exact', head: true })
      .eq('institution_id', institution.id)
      .not('adoption_status', 'in', `(${archiveStatuses.join(',')})`),
    service.from('animals').select('id', { count: 'exact', head: true })
      .eq('institution_id', institution.id)
      .in('adoption_status', archiveStatuses),
    ...tabStatuses.map(s =>
      service.from('animals').select('id', { count: 'exact', head: true })
        .eq('institution_id', institution.id)
        .eq('adoption_status', s)
    ),
  ])

  const activeCount  = activeResult.count ?? 0
  const archiveCount = archiveResult.count ?? 0
  const tabCounts    = tabCountResults.map(r => r.count ?? 0)

  // Main query
  const selectFields = 'id, name, breed, birth_year, birth_month, urgent, adoption_status, health_status, in_quarantine, in_foster, quarantine_start, quarantine_end, origin, photos, published, chip_number, vaccinated, species:animal_species(id, name_cs, icon), intake_date, created_at'

  let animalsQuery = service
    .from('animals')
    .select(selectFields, { count: 'exact' })
    .eq('institution_id', institution.id) as any

  if (isArchive) {
    animalsQuery = animalsQuery.in('adoption_status', archiveStatuses)
  } else if (filterStatus) {
    animalsQuery = animalsQuery.eq('adoption_status', filterStatus)
  } else {
    animalsQuery = animalsQuery.not('adoption_status', 'in', `(${archiveStatuses.join(',')})`)
  }

  if (filterSpecies) animalsQuery = animalsQuery.eq('species_id', filterSpecies)
  if (q) animalsQuery = animalsQuery.or(`name.ilike.%${q}%,breed.ilike.%${q}%,chip_number.ilike.%${q}%`)

  const { data: animals, count } = await animalsQuery
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const items = (animals ?? []) as any[]
  const filteredCount = count ?? 0
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE)

  // Tab definitions
  const tabs = [
    { value: '',          label: 'Aktivní',     count: activeCount },
    { value: 'available', label: 'K adopci',    count: tabCounts[0] },
    { value: 'reserved',  label: 'Rezervovaná', count: tabCounts[1] },
    { value: 'foster',    label: 'Pěstounská',  count: tabCounts[2] },
    { value: 'archive',   label: 'Archiv',      count: archiveCount, muted: true },
  ]

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { status: filterStatus, q, species: filterSpecies, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    const qs = params.toString()
    return `/admin/animals${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 mb-4 md:mb-5">
        <h1 className="font-display font-extrabold text-xl md:text-3xl text-espresso truncate">
          🐾 Všechna zvířata
        </h1>
        <Link href="/admin/animals/new" className="shrink-0">
          {/* Mobile: ikonové tlačítko */}
          <span
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-xl shadow-sm"
            style={{ backgroundColor: activeColor }}
            aria-label="Přidat zvíře"
          >
            +
          </span>
          {/* Desktop: plné tlačítko */}
          <span className="hidden md:inline-block">
            <Button variant="primary" size="sm">
              + Přidat
            </Button>
          </span>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 border-b border-[#F0EDE8] mb-4 md:mb-5 overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 no-scrollbar">
        {tabs.map((tab: any) => {
          const isActive = (filterStatus ?? '') === tab.value
          const isMuted  = tab.muted && !isActive
          return (
            <Link
              key={tab.value}
              href={buildUrl({ status: tab.value || undefined, page: undefined })}
              className="flex items-center gap-1.5 px-3 md:px-4 py-3 md:py-2.5 font-bold text-sm whitespace-nowrap border-b-2 transition-colors no-underline shrink-0"
              style={{
                borderColor: isActive ? (tab.muted ? '#8B6550' : activeColor) : 'transparent',
                color: isActive ? (tab.muted ? '#8B6550' : activeColor) : (isMuted ? '#A09890' : '#8B6550'),
              }}
            >
              {tab.label}
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: isActive ? (tab.muted ? '#8B6550' : activeColor) : '#F5E6D3',
                  color: isActive ? 'white' : '#8B6550',
                }}
              >
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Search + species filter */}
      <AdminAnimalSearch
        currentQ={q ?? ''}
        currentStatus={filterStatus ?? ''}
        institutionName={institution.name}
      />

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#F0EDE8]">
          <div className="text-5xl mb-4">🐾</div>
          <h3 className="font-display font-bold text-xl text-espresso mb-2">
            {q || filterStatus ? 'Žádné výsledky' : 'Zatím žádné záznamy'}
          </h3>
          {!q && !filterStatus && (
            <Link href="/admin/animals/new" className="mt-4 inline-block">
              <Button variant="primary">+ Přidat první záznam</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-2.5">
            {items.map((item: any) => {
              const statusVal = effectiveStatus(item.adoption_status, item.in_quarantine, item.quarantine_end ?? null)
              const age = computeAge(item.birth_year, item.birth_month)
              const primaryPhoto = Array.isArray(item.photos) && item.photos.length > 0
                ? (typeof item.photos[0] === 'string' ? item.photos[0] : item.photos[0]?.url)
                : null
              const metaParts = [item.species?.name_cs, age, item.breed].filter(Boolean)
              const qDays = computeQuarantineDays(item.quarantine_start ?? null, item.quarantine_end ?? null)
              const hasPhoto = Array.isArray(item.photos) && item.photos.length > 0
              const warnings: string[] = []
              if (!hasPhoto) warnings.push('Bez fotky')
              if (!item.chip_number) warnings.push('Bez čipu')
              return (
                <Link
                  key={item.id}
                  href={`/admin/animals/${item.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-[#F0EDE8] shadow-sm active:bg-[#FFFCF8] active:scale-[0.99] transition-all p-3 no-underline"
                >
                  {/* Foto nebo ikona */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#F5E6D3] flex items-center justify-center text-2xl">
                    {primaryPhoto
                      ? <img src={primaryPhoto} alt={item.name ?? ''} className="w-full h-full object-cover" />
                      : (item.species?.icon ?? '🐾')
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.urgent && <span aria-label="Urgentní" title="Urgentní">🆘</span>}
                      {item.in_foster && <span aria-label="Foster" title="Foster">🏠</span>}
                      {item.published === true && (
                        <span title="Viditelné na webu" className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                      {item.published === false && (
                        <span title="Skryté (draft)" className="inline-block w-2 h-2 rounded-full bg-[#D5CFC8] flex-shrink-0" />
                      )}
                      <span className="font-display font-bold text-[15px] text-espresso truncate">
                        {item.name ?? '—'}
                      </span>
                    </div>
                    <div className="text-xs text-[#8B6550] font-semibold truncate mb-1.5">
                      {metaParts.join(' · ') || '—'}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={statusVal} size="sm" />
                      {qDays !== null && (
                        <QuarantineChip
                          animalId={item.id}
                          daysRemaining={qDays}
                          defaultExtendDate={isoDatePlusDays(14)}
                          origin={item.origin ?? null}
                          intakeDate={item.intake_date ?? null}
                        />
                      )}
                    </div>
                    {warnings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {warnings.map(w => (
                          <span key={w} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                            ⚠ {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Akce */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <span className="text-[#C4B8A8] text-lg" aria-hidden="true">›</span>
                    {!isArchive && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#F5E6D3', color: '#6B4030' }}
                      >
                        ✏️
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EDE8] bg-[#FDFAF7]">
                  <th className="text-left px-5 py-3 font-body text-[11px] font-bold text-[#8B6550] uppercase tracking-wider">
                    Zvíře
                  </th>
                  <th className="text-left px-5 py-3 font-body text-[11px] font-bold text-[#8B6550] uppercase tracking-wider">
                    Druh / Věk
                  </th>
                  <th className="text-left px-5 py-3 font-body text-[11px] font-bold text-[#8B6550] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-body text-[11px] font-bold text-[#8B6550] uppercase tracking-wider">
                    Přidáno
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const statusVal = effectiveStatus(item.adoption_status, item.in_quarantine, item.quarantine_end ?? null)
                  const age = computeAge(item.birth_year, item.birth_month)
                  const primaryPhotoDesk = Array.isArray(item.photos) && item.photos.length > 0
                    ? (typeof item.photos[0] === 'string' ? item.photos[0] : item.photos[0]?.url)
                    : null
                  const qDaysDesk = computeQuarantineDays(item.quarantine_start ?? null, item.quarantine_end ?? null)
                  const hasPhotoDesk = Array.isArray(item.photos) && item.photos.length > 0
                  const warningsDesk: string[] = []
                  if (!hasPhotoDesk) warningsDesk.push('Bez fotky')
                  if (!item.chip_number) warningsDesk.push('Bez čipu')
                  return (
                    <tr
                      key={item.id}
                      className="group border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors"
                    >
                      {/* ZVÍŘE */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#F5E6D3] flex items-center justify-center text-lg">
                            {primaryPhotoDesk
                              ? <img src={primaryPhotoDesk} alt={item.name ?? ''} className="w-full h-full object-cover" />
                              : (item.species?.icon ?? '🐾')
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {item.urgent      && <span className="text-xs">🆘</span>}
                              {item.in_quarantine && <span className="text-xs" title="Karanténa">🚧</span>}
                              {item.in_foster    && <span className="text-xs" title="Foster">🏠</span>}
                              {item.published === true && (
                                <span title="Viditelné na webu" className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                              )}
                              {item.published === false && (
                                <span title="Skryté (draft)" className="inline-block w-2 h-2 rounded-full bg-[#D5CFC8] flex-shrink-0" />
                              )}
                              <span className="font-display font-bold text-sm text-[#2C1810]">
                                {item.name ?? '—'}
                              </span>
                            </div>
                            {item.breed && (
                              <div className="text-xs text-[#8B6550] mt-0.5">{item.breed}</div>
                            )}
                            {warningsDesk.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {warningsDesk.map(w => (
                                  <span key={w} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                                    ⚠ {w}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* DRUH / VĚK */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-[#2C1810] font-semibold">
                          {item.species?.name_cs ?? '—'}
                        </span>
                        {age && (
                          <span className="text-sm text-[#8B6550]"> · {age}</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge variant={statusVal} size="sm" />
                          {qDaysDesk !== null && (
                            <QuarantineChip
                              animalId={item.id}
                              daysRemaining={qDaysDesk}
                              defaultExtendDate={isoDatePlusDays(14)}
                              origin={item.origin ?? null}
                              intakeDate={item.intake_date ?? null}
                            />
                          )}
                        </div>
                      </td>

                      {/* PŘIDÁNO */}
                      <td className="px-5 py-3.5 text-sm text-[#8B6550] font-semibold whitespace-nowrap">
                        {new Date(item.intake_date ?? item.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                      </td>

                      {/* AKCE — zobrazí se na hover */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/animals/${item.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold text-[#6B4030] bg-[#F5E6D3] hover:bg-[#EDD8C0] transition-colors no-underline whitespace-nowrap"
                          >
                            {isArchive ? 'Zobrazit' : '📋 Otevřít'}
                          </Link>
                          <a
                            href={`/admin/animals/${item.id}/qr`}
                            target="_blank"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold text-[#6B4030] bg-[#F5E6D3] hover:bg-[#EDD8C0] transition-colors no-underline whitespace-nowrap"
                          >
                            ▣ QR kód
                          </a>
                          <a
                            href={`/admin/animals/${item.id}/pdf`}
                            target="_blank"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold text-[#6B4030] bg-[#F5E6D3] hover:bg-[#EDD8C0] transition-colors no-underline whitespace-nowrap"
                          >
                            📄 PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[#F0EDE8]">
                <span className="text-xs font-semibold text-[#8B6550]">
                  Zobrazeno {offset + 1}–{Math.min(offset + PAGE_SIZE, filteredCount)} z {filteredCount} zvířat
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={buildUrl({ page: page > 1 ? String(page - 1) : undefined })}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border border-[#F0EDE8] transition-colors no-underline ${page <= 1 ? 'opacity-30 pointer-events-none' : 'text-[#2C1810] hover:bg-[#F5E6D3]'}`}
                    aria-disabled={page <= 1}
                  >
                    ‹
                  </Link>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    const isCurrentPage = pageNum === page
                    return (
                      <Link
                        key={pageNum}
                        href={buildUrl({ page: String(pageNum) })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold no-underline transition-colors"
                        style={isCurrentPage
                          ? { backgroundColor: activeColor, color: 'white' }
                          : { border: '1px solid #F0EDE8', color: '#2C1810' }
                        }
                      >
                        {pageNum}
                      </Link>
                    )
                  })}

                  {totalPages > 5 && page < totalPages - 2 && (
                    <span className="w-8 h-8 flex items-center justify-center text-xs text-[#8B6550]">…</span>
                  )}

                  {totalPages > 5 && page < totalPages - 2 && (
                    <Link
                      href={buildUrl({ page: String(totalPages) })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border border-[#F0EDE8] text-[#2C1810] hover:bg-[#F5E6D3] no-underline transition-colors"
                    >
                      {totalPages}
                    </Link>
                  )}

                  <Link
                    href={buildUrl({ page: page < totalPages ? String(page + 1) : undefined })}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border border-[#F0EDE8] transition-colors no-underline ${page >= totalPages ? 'opacity-30 pointer-events-none' : 'text-[#2C1810] hover:bg-[#F5E6D3]'}`}
                    aria-disabled={page >= totalPages}
                  >
                    ›
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile pagination */}
          {totalPages > 1 && (
            <div className="md:hidden flex items-center justify-between py-4">
              <span className="text-xs font-semibold text-[#8B6550]">
                {offset + 1}–{Math.min(offset + PAGE_SIZE, filteredCount)} z {filteredCount}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#F0EDE8] text-[#2C1810] hover:bg-[#F5E6D3] no-underline"
                  >
                    ← Předchozí
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#F0EDE8] text-[#2C1810] hover:bg-[#F5E6D3] no-underline"
                  >
                    Další →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
