import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NearbyInstitutions } from '@/components/public/NearbyInstitutions'
import type { InstitutionType, ApprovalStatus } from '@/types/database'

/* ── Query-specific types ── */
interface InstitutionListItem {
  id: string
  name: string
  slug: string
  type: InstitutionType
  city: string
  lat: number | null
  lng: number | null
  logo_url: string | null
  cover_url: string | null
  approval_status: ApprovalStatus
}

export const metadata: Metadata = {
  title: 'Útulky a záchranné stanice | Zozio',
  description: 'Adresář útulků a záchranných stanic v ČR a SR. Najdi instituci ve svém okolí.',
}

const PAGE_SIZE = 24

interface PageProps {
  searchParams: Promise<{
    type?: string
    city?: string
    q?:   string
    lat?: string
    lng?: string
    page?: string
  }>
}

export default async function InstitutionsPage({ searchParams }: PageProps) {
  const params  = await searchParams
  const page    = Math.max(1, parseInt(params.page ?? '1'))
  const type    = params.type ?? 'all'
  const hasLoc  = !!(params.lat && params.lng)

  // ── 4 paralelní dotazy ──────────────────────────────────────────────────────
  // allLite: lehká data všech institucí → cities + typeCounts + search suggestions
  // animalCounts: počty dostupných zvířat per institution_id
  // caseCounts:   počty záchranných případů per institution_id
  // paginated:    stránkovaný výsledek pro aktuální filtry
  const [{ institutions, total }, allLite, animalCounts, caseCounts] = await Promise.all([
    getInstitutions(params, page),
    getAllInstitutionsLite(),
    getAllAnimalCounts(),
    getAllCaseCounts(),
  ])
  // ────────────────────────────────────────────────────────────────────────────

  const shelters = institutions.filter((i: InstitutionListItem) => i.type === 'shelter')
  const rescues  = institutions.filter((i: InstitutionListItem) => i.type === 'rescue_station')

  const tabs = [
    { id: 'all',            label: 'Všechny',           count: typeCounts.all },
    { id: 'shelter',        label: 'Útulky',            count: typeCounts.shelter },
    { id: 'rescue_station', label: 'Záchranné stanice', count: typeCounts.rescue },
  ]

  const withGeo = institutions.filter((i: InstitutionListItem) => i.lat && i.lng).length

  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-coral">Adresář</p>
          <h1 className="font-display font-extrabold text-text-primary mb-3"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Útulky a záchranné stanice
          </h1>

          {/* Search */}
          <form method="GET" action="/institutions" className="flex gap-2 max-w-[480px]">
            {type !== 'all' && <input type="hidden" name="type" value={type} />}
            <input
              type="search" name="q"
              defaultValue={params.q ?? ''}
              placeholder="Hledat název, město..."
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E0DDD8', background: 'white', color: 'var(--text-primary)' }}
            />
            <button type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 bg-coral">
              Hledat
            </button>
            {params.q && (
              <Link href={`/institutions${type !== 'all' ? `?type=${type}` : ''}`}
                className="px-3 py-2.5 rounded-xl font-bold text-sm border no-underline hover:opacity-80"
                style={{ borderColor: '#E0DDD8', color: 'var(--text-body)', background: 'white' }}>
                ✕
              </Link>
            )}
          </div>
        </div>

        {/* Taby */}
        <div className="flex gap-0 border-b border-border mb-6 overflow-x-auto"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
          {tabs.map(tab => (
            <Link key={tab.id}
              href={buildUrl({ type: tab.id, page: undefined })}
              aria-current={type === tab.id ? 'page' : undefined}
              className="no-underline flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all"
              style={type === tab.id
                ? { color: 'var(--coral)', borderBottomColor: 'var(--coral)' }
                : { color: 'var(--text-muted)', borderBottomColor: 'transparent' }
              }>
              {tab.label}
              <span aria-hidden="true"
                className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full text-[10px] font-bold"
                style={type === tab.id
                  ? { background: 'var(--coral)', color: 'white' }
                  : { background: 'var(--border)', color: 'var(--text-muted)' }
                }>
                {tab.count}
              </span>
            </Link>
          ))}
        </nav>

        {/* Stats row + GPS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
            {hasLoc
              ? `📍 Seřazeno podle vzdálenosti · ${total} institucí`
              : total === 0 ? 'Žádné výsledky'
              : `${total} institucí${totalPages > 1 ? ` · strana ${page} z ${totalPages}` : ''}`
            }
          </p>
          <InstitutionGpsButton
            params={params}
            hasLoc={hasLoc}
            cancelUrl={buildUrl({ lat: undefined, lng: undefined, page: undefined })}
          />
        </div>

        {/* Filtry měst */}
        {cities.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <Link href={`/institutions?type=${type}${params.q ? `&q=${params.q}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold no-underline border transition-all
                ${!params.city ? 'border-coral text-coral-tag-text bg-coral-tag-bg' : 'border-border text-text-body bg-white hover:border-coral/40'}`}>
              Celá ČR/SR
            </Link>
            {cities.map(city => (
              <Link key={city}
                href={`/institutions?type=${type}&city=${city}${params.q ? `&q=${params.q}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold no-underline border transition-all
                  ${params.city === city ? 'border-coral text-coral-tag-text bg-coral-tag-bg' : 'border-border text-text-body bg-white hover:border-coral/40'}`}>
                {city}
              </Link>
            ))}
          </div>
        )}

        {/* Hint pokud žádná instituce nemá souřadnice */}
        {withGeo === 0 && institutions.length > 0 && (
          <div className="mb-5 p-3 rounded-xl flex items-center gap-3"
            style={{ background: 'var(--border)', border: '1px solid #E0DDD8' }}>
            <span className="text-sm text-text-muted">
              💡 Tip: Aby fungovalo řazení podle vzdálenosti, musí mít útulky vyplněné GPS souřadnice v nastavení.
            </span>
          </div>
        )}

        {/* Výsledky s geolokací */}
        <NearbyInstitutions institutions={institutions as InstitutionListItem[]} />
      </div>
    </main>
  )
}

/* ── Karta instituce ── */
function InstitutionCard({ inst }: { inst: any }) {
  const isShelter  = inst.type === 'shelter'
  const accent     = isShelter ? '#E8634A' : '#2E9E8F'
  const accentBg   = isShelter ? '#FAECE7' : '#E1F5EE'
  const accentText = isShelter ? '#993C1D' : '#0F6E56'

  const hasAnimalStat  = isShelter && inst._animalCount > 0
  const hasActiveStat  = !isShelter && inst._activeCount > 0
  const hasReleasedStat = !isShelter && inst._releasedCount > 0

  return (
    <Link href={`/institutions/${inst.slug}`} className="no-underline group">
      <div className="bg-white rounded-xl overflow-hidden border border-[#F0EDE8] group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-200 h-full flex flex-col">

        {/* Cover */}
        <div className="relative h-24 sm:h-32 overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${accentBg} 0%, white 100%)` }}>
          {inst.cover_url && (
            <Image src={inst.cover_url} alt="" fill
              sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
              className="object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300" />
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: accentBg, color: accentText }}>
            {isShelter ? '🏠 Útulek' : '🚑 Stanice'}
          </div>

          {/* Vzdálenost */}
          {inst._distance != null && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: '#1A0F0A', color: 'white' }}>
              {inst._distance < 1 ? '< 1' : inst._distance} km
            </div>
          )}

          {/* Logo */}
          <div className="absolute bottom-2 left-2 w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-white shadow flex items-center justify-center overflow-hidden"
            style={{ background: accentBg }}>
            {inst.logo_url
              ? <Image src={inst.logo_url} alt={inst.name} width={48} height={48} className="object-cover" />
              : <span className="text-lg">{isShelter ? '🏠' : '🚑'}</span>
            }
          </div>
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <div className="font-bold text-[#1A0F0A] text-sm sm:text-base leading-snug mb-1 line-clamp-2 group-hover:opacity-80 transition-opacity">
            {inst.name}
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#8B6550' }}>
            <span>📍</span>
            <span className="truncate">{inst.city}</span>
            {inst.approval_status === 'approved' && (
              <span className="ml-auto font-semibold flex-shrink-0" style={{ color: '#3B6D11' }}>✓</span>
            )}
          </div>

          {/* Stats */}
          {(hasAnimalStat || hasActiveStat || hasReleasedStat) && (
            <div className="mt-2.5 pt-2.5 border-t flex items-center gap-3 flex-wrap" style={{ borderColor: '#F0EDE8' }}>
              {hasAnimalStat && (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-extrabold" style={{ color: accent }}>
                    {inst._animalCount}
                  </span>
                  <span className="text-[10px] sm:text-xs" style={{ color: '#8B6550' }}>
                    {inst._animalCount === 1 ? 'zvíře' : inst._animalCount < 5 ? 'zvířata' : 'zvířat'}
                  </span>
                </div>
              )}
              {hasActiveStat && (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-extrabold" style={{ color: accent }}>
                    {inst._activeCount}
                  </span>
                  <span className="text-[10px] sm:text-xs" style={{ color: '#8B6550' }}>v léčbě</span>
                </div>
              )}
              {hasReleasedStat && (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-extrabold" style={{ color: '#3B6D11' }}>
                    {inst._releasedCount}
                  </span>
                  <span className="text-[10px] sm:text-xs" style={{ color: '#8B6550' }}>propuštěno</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── Stránkování ── */
function Pagination({ current, total, buildUrl }: {
  current:  number
  total:    number
  buildUrl: (o: Record<string, string | undefined>) => string
}) {
  const pages = getPaginationRange(current, total)
  return (
    <nav aria-label="Stránkování" className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      {current > 1 && (
        <Link href={buildUrl({ page: String(current - 1) })}
          aria-label="Předchozí stránka"
          className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm border no-underline transition-all hover:opacity-80"
          style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>←</Link>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} className="min-w-[44px] h-11 flex items-center justify-center text-sm"
            style={{ color: '#8B6550' }}>…</span>
        ) : (
          <Link key={p} href={buildUrl({ page: String(p) })}
            aria-current={p === current ? 'page' : undefined}
            className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm font-medium border no-underline transition-all"
            style={p === current
              ? { background: '#E8634A', color: 'white', borderColor: '#E8634A' }
              : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }
            }>{p}</Link>
        )
      )}
      {current < total && (
        <Link href={buildUrl({ page: String(current + 1) })}
          aria-label="Další stránka"
          className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm border no-underline transition-all hover:opacity-80"
          style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>→</Link>
      )}
    </nav>
  )
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

/* ── Geo helper ── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ── Data ── */

async function getInstitutions(params: any, page: number) {
  const supabase = createServiceClient()
  const hasLoc   = !!(params.lat && params.lng)

  if (hasLoc) {
    const uLat = parseFloat(params.lat)
    const uLng = parseFloat(params.lng)

    let query = supabase
      .from('institutions')
      .select('id, name, slug, type, city, lat, lng, logo_url, cover_url, approval_status', { count: 'exact' })
      .eq('approval_status', 'approved')
      .gte('lat', uLat - 2.0).lte('lat', uLat + 2.0)
      .gte('lng', uLng - 3.0).lte('lng', uLng + 3.0)
      .not('lat', 'is', null).not('lng', 'is', null)

    if (params.type && params.type !== 'all') query = query.eq('type', params.type)
    if (params.city) query = query.eq('city', params.city)
    if (params.q)    query = query.or(`name.ilike.%${params.q}%,city.ilike.%${params.q}%`)

    const { data, count } = await query
    let institutions = (data ?? []) as any[]
    institutions = institutions
      .map(i => ({ ...i, _distance: Math.round(haversineKm(uLat, uLng, Number(i.lat), Number(i.lng))) }))
      .sort((a, b) => a._distance - b._distance)

    const start = (page - 1) * PAGE_SIZE
    return { institutions: institutions.slice(start, start + PAGE_SIZE), total: count ?? institutions.length }
  }

  const offset = (page - 1) * PAGE_SIZE
  let query = supabase
    .from('institutions')
    .select('id, name, slug, type, city, lat, lng, logo_url, cover_url, approval_status', { count: 'exact' })
    .eq('approval_status', 'approved')
    .order('name', { ascending: true })

  if (params.type && params.type !== 'all') query = query.eq('type', params.type)
  if (params.city) query = query.eq('city', params.city)
  if (params.q)    query = query.or(`name.ilike.%${params.q}%,city.ilike.%${params.q}%`)

  query = query.range(offset, offset + PAGE_SIZE - 1)
  const { data, count } = await query
  return {
    institutions: (data ?? []).map((i: any) => ({ ...i, _distance: null })),
    total: count ?? 0,
  }
}

/** Lehká data všech institucí — slouží pro cities, typeCounts i search suggestions (1 dotaz místo 3) */
async function getAllInstitutionsLite() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('institutions')
    .select('name, slug, type, city')
    .eq('approval_status', 'approved')
  return [...new Set((data ?? []).map((d: { city: string }) => d.city).filter(Boolean))].sort() as string[]
}
