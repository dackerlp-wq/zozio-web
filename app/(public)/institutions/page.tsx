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

  const shelters = institutions.filter((i: InstitutionListItem) => i.type === 'shelter')
  const rescues  = institutions.filter((i: InstitutionListItem) => i.type === 'rescue_station')

  const tabs = [
    { id: 'all',            label: 'Všechny',           count: institutions.length },
    { id: 'shelter',        label: 'Útulky',            count: shelters.length },
    { id: 'rescue_station', label: 'Záchranné stanice', count: rescues.length },
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
          </form>
        </div>

        {/* Taby */}
        <div className="flex gap-0 border-b border-border mb-6 overflow-x-auto"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
          {tabs.map(tab => (
            <Link key={tab.id}
              href={`/institutions?type=${tab.id}${params.q ? `&q=${params.q}` : ''}${params.city ? `&city=${params.city}` : ''}`}
              className="no-underline flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all"
              style={type === tab.id
                ? { color: 'var(--coral)', borderBottomColor: 'var(--coral)' }
                : { color: 'var(--text-muted)', borderBottomColor: 'transparent' }
              }>
              {tab.label}
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                style={type === tab.id
                  ? { background: 'var(--coral)', color: 'white' }
                  : { background: 'var(--border)', color: 'var(--text-muted)' }
                }>
                {tab.count}
              </span>
            </Link>
          ))}
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
  return [...new Set((data ?? []).map((d: { city: string }) => d.city).filter(Boolean))].sort() as string[]
}
