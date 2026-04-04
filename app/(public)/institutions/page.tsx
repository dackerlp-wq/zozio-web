import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NearbyInstitutions } from '@/components/public/NearbyInstitutions'

export const metadata: Metadata = {
  title: 'Útulky a záchranné stanice | Zozio',
  description: 'Adresář útulků a záchranných stanic v ČR a SR. Najdi instituci ve svém okolí.',
}

interface PageProps {
  searchParams: Promise<{ type?: string; city?: string; q?: string }>
}

export default async function InstitutionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const type   = params.type ?? 'all'

  const [institutions, cities] = await Promise.all([
    getInstitutions(params),
    getCities(),
  ])

  const shelters = institutions.filter((i: any) => i.type === 'shelter')
  const rescues  = institutions.filter((i: any) => i.type === 'rescue_station')

  const tabs = [
    { id: 'all',            label: 'Všechny',           count: institutions.length },
    { id: 'shelter',        label: 'Útulky',            count: shelters.length },
    { id: 'rescue_station', label: 'Záchranné stanice', count: rescues.length },
  ]

  const withGeo = institutions.filter((i: any) => i.lat && i.lng).length

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8634A' }}>Adresář</p>
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-3"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Útulky a záchranné stanice
          </h1>

          {/* Search */}
          <form method="GET" action="/institutions" className="flex gap-2 max-w-[480px]" role="search">
            {type !== 'all' && <input type="hidden" name="type" value={type} />}
            <label htmlFor="institutions-search" className="sr-only">Hledat útulky a záchranné stanice</label>
            <input
              id="institutions-search"
              type="search" name="q"
              defaultValue={params.q ?? ''}
              placeholder="Hledat název, město..."
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E0DDD8', background: 'white', color: '#1A0F0A' }}
            />
            <button type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90"
              style={{ background: '#E8634A' }}>
              Hledat
            </button>
            {params.q && (
              <Link href={`/institutions${type !== 'all' ? `?type=${type}` : ''}`}
                aria-label="Zrušit hledání"
                className="px-3 py-2.5 rounded-xl font-bold text-sm border no-underline hover:opacity-80"
                style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>
                ✕
              </Link>
            )}
          </form>
        </div>

        {/* Filtrovací navigace */}
        <nav aria-label="Filtr typu instituce"
          className="flex gap-0 border-b border-[#F0EDE8] mb-6 overflow-x-auto"
          style={{ scrollbarWidth: 'none' } as any}>
          {tabs.map(tab => (
            <Link key={tab.id}
              href={`/institutions?type=${tab.id}${params.q ? `&q=${params.q}` : ''}${params.city ? `&city=${params.city}` : ''}`}
              aria-current={type === tab.id ? 'page' : undefined}
              className="no-underline flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all"
              style={type === tab.id
                ? { color: '#E8634A', borderBottomColor: '#E8634A' }
                : { color: '#6B4030', borderBottomColor: 'transparent' }
              }>
              {tab.label}
              <span aria-hidden="true"
                className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full text-[10px] font-bold"
                style={type === tab.id
                  ? { background: '#E8634A', color: 'white' }
                  : { background: '#F0EDE8', color: '#6B4030' }
                }>
                {tab.count}
              </span>
            </Link>
          ))}
        </nav>

        {/* Filtry měst */}
        {cities.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <Link href={`/institutions?type=${type}${params.q ? `&q=${params.q}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold no-underline border transition-all
                ${!params.city ? 'border-[#E8634A] text-[#993C1D] bg-[#FAECE7]' : 'border-[#F0EDE8] text-[#6B4030] bg-white hover:border-[#E8634A]/40'}`}>
              Celá ČR/SR
            </Link>
            {cities.map(city => (
              <Link key={city}
                href={`/institutions?type=${type}&city=${city}${params.q ? `&q=${params.q}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold no-underline border transition-all
                  ${params.city === city ? 'border-[#E8634A] text-[#993C1D] bg-[#FAECE7]' : 'border-[#F0EDE8] text-[#6B4030] bg-white hover:border-[#E8634A]/40'}`}>
                {city}
              </Link>
            ))}
          </div>
        )}

        {/* Hint pokud žádná instituce nemá souřadnice */}
        {withGeo === 0 && institutions.length > 0 && (
          <div className="mb-5 p-3 rounded-xl flex items-center gap-3"
            style={{ background: '#F0EDE8', border: '1px solid #E0DDD8' }}>
            <span className="text-sm" style={{ color: '#8B6550' }}>
              💡 Tip: Aby fungovalo řazení podle vzdálenosti, musí mít útulky vyplněné GPS souřadnice v nastavení.
            </span>
          </div>
        )}

        {/* Výsledky s geolokací */}
        <NearbyInstitutions institutions={institutions as any} />
      </div>
    </main>
  )
}

/* ── Data ── */
async function getInstitutions(params: { type?: string; city?: string; q?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('institutions')
    .select('id, name, slug, type, city, lat, lng, logo_url, cover_url, approval_status')
    .eq('approval_status', 'approved')
    .order('name', { ascending: true })

  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type)
  }
  if (params.city) {
    query = query.eq('city', params.city)
  }
  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,city.ilike.%${params.q}%`)
  }

  const { data } = await query
  return data ?? []
}

async function getCities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('institutions')
    .select('city')
    .eq('approval_status', 'approved')
  return [...new Set((data ?? []).map((d: any) => d.city).filter(Boolean))].sort() as string[]
}
