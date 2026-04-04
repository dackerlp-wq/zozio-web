import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdminAnimalSearch } from '@/components/admin/AdminAnimalSearch'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; species?: string; page?: string }>
}

const PAGE_SIZE = 20

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

  const isShelter = institution.type === 'shelter'

  // Species list for filter dropdown
  const { data: speciesList } = await service
    .from('animal_species')
    .select('id, name_cs, icon')
    .order('name_cs')

  // Status counts for tabs (parallel)
  const shelterTabStatuses = ['available', 'reserved', 'foster', 'adopted'] as const
  const rescueTabStatuses  = ['intake', 'treatment', 'rehabilitation', 'released'] as const
  const tabStatuses = isShelter ? shelterTabStatuses : rescueTabStatuses

  const statusField = isShelter ? 'adoption_status' : 'status'
  const table       = isShelter ? 'animals' : 'rescue_cases'

  const [totalResult, ...tabCountResults] = await Promise.all([
    service.from(table).select('id', { count: 'exact', head: true }).eq('institution_id', institution.id),
    ...tabStatuses.map(s =>
      service.from(table).select('id', { count: 'exact', head: true })
        .eq('institution_id', institution.id)
        .eq(statusField, s)
    ),
  ])

  const totalCount = totalResult.count ?? 0
  const tabCounts  = tabCountResults.map(r => r.count ?? 0)

  // Main query
  const selectFields = isShelter
    ? 'id, name, breed, birth_year, birth_month, urgent, adoption_status, health_status, in_quarantine, in_foster, species:animal_species(id, name_cs, icon), intake_date, created_at'
    : 'id, name, case_number, estimated_age, status, health_status, species:animal_species(id, name_cs, icon), intake_date, created_at'

  let animalsQuery = service
    .from(table)
    .select(selectFields, { count: 'exact' })
    .eq('institution_id', institution.id) as any

  if (filterStatus)  animalsQuery = animalsQuery.eq(statusField, filterStatus)
  if (filterSpecies) animalsQuery = animalsQuery.eq('species_id', filterSpecies)
  if (q)             animalsQuery = isShelter
    ? animalsQuery.ilike('name', `%${q}%`)
    : animalsQuery.or(`name.ilike.%${q}%,case_number.ilike.%${q}%`)

  const { data: animals, count } = isShelter
    ? await animalsQuery.order('urgent', { ascending: false }).order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1)
    : await animalsQuery.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1)

  const items = (animals ?? []) as any[]
  const filteredCount = count ?? 0
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE)

  // Tab definitions
  const shelterTabs = [
    { value: '',          label: 'Všechna',    count: totalCount },
    { value: 'available', label: 'K adopci',   count: tabCounts[0] },
    { value: 'reserved',  label: 'Rezervovaná',count: tabCounts[1] },
    { value: 'foster',    label: 'Pěstounská', count: tabCounts[2] },
    { value: 'adopted',   label: 'Adoptovaná', count: tabCounts[3] },
  ]
  const rescueTabs = [
    { value: '',               label: 'Všichni',      count: totalCount },
    { value: 'intake',         label: 'Příjem',        count: tabCounts[0] },
    { value: 'treatment',      label: 'Léčba',         count: tabCounts[1] },
    { value: 'rehabilitation', label: 'Rehabilitace',  count: tabCounts[2] },
    { value: 'released',       label: 'Propuštěno',    count: tabCounts[3] },
  ]
  const tabs = isShelter ? shelterTabs : rescueTabs
  const activeColor = isShelter ? '#E8634A' : '#2E9E8F'

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
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso">
          {isShelter ? '🐾 Všechna zvířata' : '🦉 Všichni pacienti'}
        </h1>
        <Link href="/admin/animals/new">
          <Button variant={isShelter ? 'primary' : 'rescue'} size="sm">
            + {isShelter ? 'Přidat' : 'Nový pacient'}
          </Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 border-b border-[#F0EDE8] mb-5 overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
        {tabs.map(tab => {
          const isActive = (filterStatus ?? '') === tab.value
          return (
            <Link
              key={tab.value}
              href={buildUrl({ status: tab.value || undefined, page: undefined })}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2.5 font-bold text-sm whitespace-nowrap border-b-2 transition-colors no-underline shrink-0`}
              style={{
                borderColor: isActive ? activeColor : 'transparent',
                color: isActive ? activeColor : '#8B6550',
              }}
            >
              {tab.label}
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: isActive ? activeColor : '#F5E6D3',
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
        currentSpecies={filterSpecies ?? ''}
        speciesList={speciesList ?? []}
        isShelter={isShelter}
      />

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#F0EDE8]">
          <div className="text-5xl mb-4">{isShelter ? '🐾' : '🦉'}</div>
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
          <div className="md:hidden space-y-3">
            {items.map((item: any) => {
              const statusVal = isShelter ? item.adoption_status : item.status
              const age = isShelter
                ? computeAge(item.birth_year, item.birth_month)
                : item.estimated_age ?? null
              return (
                <div key={item.id} className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: '#F5E6D3' }}
                    >
                      {item.species?.icon ?? (isShelter ? '🐾' : '🦉')}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isShelter && item.urgent && <span className="text-xs">🆘</span>}
                        {item.in_quarantine          && <span className="text-xs" title="Karanténa">🚧</span>}
                        {isShelter && item.in_foster  && <span className="text-xs" title="Foster">🏠</span>}
                        <span className="font-display font-bold text-sm text-espresso truncate">
                          {item.name ?? item.case_number ?? '—'}
                        </span>
                      </div>
                      <div className="text-xs text-[#8B6550] font-semibold">
                        {item.species?.name_cs ?? '—'}
                        {age ? ` · ${age}` : ''}
                        {isShelter && item.breed ? ` · ${item.breed}` : ''}
                      </div>
                    </div>
                    {/* Status badge */}
                    <Badge variant={statusVal} size="sm" />
                  </div>
                  {/* Actions bar */}
                  <div className="flex border-t border-[#F0EDE8]">
                    <Link
                      href={`/admin/animals/${item.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-[#8B6550] hover:text-espresso hover:bg-[#FFFCF8] transition-colors no-underline border-r border-[#F0EDE8]"
                    >
                      ✏️ Upravit
                    </Link>
                    <a
                      href={`/admin/animals/${item.id}/qr`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#8B6550] hover:text-espresso hover:bg-[#FFFCF8] transition-colors no-underline"
                    >
                      ▣ QR
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EDE8] bg-[#FDFAF7]">
                  <th className="text-left px-5 py-3 font-body text-[11px] font-bold text-[#8B6550] uppercase tracking-wider">
                    {isShelter ? 'Zvíře' : 'Pacient'}
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
                  const statusVal = isShelter ? item.adoption_status : item.status
                  const age = isShelter
                    ? computeAge(item.birth_year, item.birth_month)
                    : item.estimated_age ?? null
                  return (
                    <tr
                      key={item.id}
                      className="group border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors"
                    >
                      {/* ZVÍŘE */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ backgroundColor: '#F5E6D3' }}
                          >
                            {item.species?.icon ?? (isShelter ? '🐾' : '🦉')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {isShelter && item.urgent   && <span className="text-xs">🆘</span>}
                              {item.in_quarantine          && <span className="text-xs" title="Karanténa">🚧</span>}
                              {isShelter && item.in_foster && <span className="text-xs" title="Foster">🏠</span>}
                              <span className="font-display font-bold text-sm text-[#2C1810]">
                                {item.name ?? item.case_number ?? '—'}
                              </span>
                            </div>
                            {isShelter && item.breed && (
                              <div className="text-xs text-[#8B6550] mt-0.5">{item.breed}</div>
                            )}
                            {!isShelter && item.name && item.case_number && (
                              <div className="text-xs text-[#8B6550] mt-0.5">{item.case_number}</div>
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
                        <Badge variant={statusVal} size="sm" />
                      </td>

                      {/* PŘIDÁNO */}
                      <td className="px-5 py-3.5 text-sm text-[#8B6550] font-semibold whitespace-nowrap">
                        {new Date(item.intake_date ?? item.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                      </td>

                      {/* AKCE — appear on row hover */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`/admin/animals/${item.id}/qr`}
                            target="_blank"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-[#8B6550] hover:bg-[#F5E6D3] hover:text-espresso transition-colors no-underline"
                            title="QR karta"
                          >
                            ▣
                          </a>
                          <Link
                            href={`/admin/animals/${item.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-[#8B6550] hover:bg-[#F5E6D3] hover:text-espresso transition-colors no-underline"
                            title="Upravit"
                          >
                            ✏️
                          </Link>
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
                  Zobrazeno {offset + 1}–{Math.min(offset + PAGE_SIZE, filteredCount)} z {filteredCount} {isShelter ? 'zvířat' : 'případů'}
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
