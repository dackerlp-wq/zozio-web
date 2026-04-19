import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { InstitutionGpsButton } from '@/components/public/InstitutionGpsButton'
import { InstitutionSearch } from '@/components/public/InstitutionSearch'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Útulky | Zozio',
  description: 'Adresář útulků v ČR a SR. Najdi útulek ve svém okolí.',
}

const PAGE_SIZE = 24

interface PageProps {
  searchParams: Promise<{
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
  const hasLoc  = !!(params.lat && params.lng)

  const [{ institutions, total }, allLite, animalCounts] = await Promise.all([
    getInstitutions(params, page),
    getAllInstitutionsLite(),
    getAllAnimalCounts(),
  ])

  // Odvodit z allLite (bez dalších dotazů)
  const filtered = allLite.filter(i =>
    (!params.q   || i.name.toLowerCase().includes(params.q.toLowerCase()) || i.city.toLowerCase().includes(params.q.toLowerCase())) &&
    (!params.city || i.city === params.city)
  )
  const cities = [...new Set(allLite.map(i => i.city).filter(Boolean))].sort()

  // Připojit stats ke stránkovaným institucím
  const institutionsWithStats = institutions.map((inst: any) => ({
    ...inst,
    _animalCount: animalCounts[inst.id] ?? 0,
  }))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const next = { ...params, ...overrides }
    const qs   = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v) })
    const str = qs.toString()
    return `/institutions${str ? `?${str}` : ''}`
  }

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8634A' }}>Adresář</p>
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Útulky
          </h1>

          <div className="flex flex-wrap gap-2 max-w-[700px]">
            <InstitutionSearch
              suggestions={allLite}
              cities={cities}
              params={params}
              defaultQ={params.q}
            />
            {(params.q || params.city) && (
              <Link href={buildUrl({ q: undefined, city: undefined, page: undefined })}
                aria-label="Zrušit filtry"
                className="px-3 py-2.5 rounded-lg font-bold text-sm border no-underline hover:opacity-80 flex items-center flex-shrink-0"
                style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>
                ✕ Zrušit
              </Link>
            )}
          </div>
        </div>

        {/* Stats row + GPS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
            {hasLoc
              ? `📍 Seřazeno podle vzdálenosti · ${total} útulků`
              : total === 0 ? 'Žádné výsledky'
              : `${total} útulků${totalPages > 1 ? ` · strana ${page} z ${totalPages}` : ''}`
            }
          </p>
          <InstitutionGpsButton
            params={params}
            hasLoc={hasLoc}
            cancelUrl={buildUrl({ lat: undefined, lng: undefined, page: undefined })}
          />
        </div>

        {/* Grid */}
        {institutionsWithStats.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-5">🏠</div>
            <p className="font-bold text-xl text-[#1A0F0A] mb-2">Žádné útulky nenalezeny</p>
            <p className="text-sm mb-6" style={{ color: '#8B6550' }}>Zkus jiné hledání nebo zrušit filtry.</p>
            <Link href="/institutions"
              className="inline-flex px-5 py-2.5 rounded-lg font-bold text-sm text-white no-underline"
              style={{ background: '#E8634A' }}>
              Zrušit filtry
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {institutionsWithStats.map((inst: any) => (
              <InstitutionCard key={inst.id} inst={inst} />
            ))}
          </div>
        )}

        {/* Stránkování */}
        {totalPages > 1 && (
          <Pagination current={page} total={totalPages} buildUrl={buildUrl} />
        )}

        {/* CTA */}
        <div className="mt-14 p-6 md:p-8 rounded-xl text-center"
          style={{ background: 'white', border: '1.5px dashed #E0DDD8' }}>
          <div className="text-3xl mb-3">🏠</div>
          <p className="font-bold text-lg text-[#1A0F0A] mb-1">Chybí zde váš útulek?</p>
          <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
            Registrace je zdarma a trvá 5 minut.
          </p>
          <Link href="/auth/register?type=shelter"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-bold text-sm text-white no-underline hover:opacity-90 transition-all"
            style={{ background: '#E8634A' }}>
            Registrovat útulek →
          </Link>
        </div>
      </div>
    </main>
  )
}

/* ── Karta instituce ── */
function InstitutionCard({ inst }: { inst: any }) {
  return (
    <Link href={`/institutions/${inst.slug}`} className="no-underline group">
      <div className="bg-white rounded-xl overflow-hidden border border-[#F0EDE8] group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-200 h-full flex flex-col">

        {/* Cover */}
        <div className="relative h-24 sm:h-32 overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FAECE7 0%, white 100%)' }}>
          {inst.cover_url && (
            <Image src={inst.cover_url} alt="" fill
              sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
              className="object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300" />
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: '#FAECE7', color: '#993C1D' }}>
            🏠 Útulek
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
            style={{ background: '#FAECE7' }}>
            {inst.logo_url
              ? <Image src={inst.logo_url} alt={inst.name} width={48} height={48} className="object-cover" />
              : <span className="text-lg">🏠</span>
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
          {inst._animalCount > 0 && (
            <div className="mt-2.5 pt-2.5 border-t flex items-center gap-3 flex-wrap" style={{ borderColor: '#F0EDE8' }}>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-extrabold" style={{ color: '#E8634A' }}>
                  {inst._animalCount}
                </span>
                <span className="text-[10px] sm:text-xs" style={{ color: '#8B6550' }}>
                  {inst._animalCount === 1 ? 'zvíře' : inst._animalCount < 5 ? 'zvířata' : 'zvířat'}
                </span>
              </div>
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
      .eq('type', 'shelter')
      .gte('lat', uLat - 2.0).lte('lat', uLat + 2.0)
      .gte('lng', uLng - 3.0).lte('lng', uLng + 3.0)
      .not('lat', 'is', null).not('lng', 'is', null)

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
    .eq('type', 'shelter')
    .order('name', { ascending: true })

  if (params.city) query = query.eq('city', params.city)
  if (params.q)    query = query.or(`name.ilike.%${params.q}%,city.ilike.%${params.q}%`)

  query = query.range(offset, offset + PAGE_SIZE - 1)
  const { data, count } = await query
  return {
    institutions: (data ?? []).map((i: any) => ({ ...i, _distance: null })),
    total: count ?? 0,
  }
}

/** Lehká data všech institucí — slouží pro cities i search suggestions */
async function getAllInstitutionsLite() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('institutions')
    .select('name, slug, type, city')
    .eq('approval_status', 'approved')
    .eq('type', 'shelter')
    .order('name', { ascending: true })
  return (data ?? []) as { name: string; slug: string; type: string; city: string }[]
}

/** Počty dostupných zvířat per institution_id */
async function getAllAnimalCounts(): Promise<Record<string, number>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('animals')
    .select('institution_id')
    .eq('published', true)
    .eq('adoption_status', 'available')
  const counts: Record<string, number> = {}
  for (const a of data ?? []) counts[a.institution_id] = (counts[a.institution_id] ?? 0) + 1
  return counts
}
