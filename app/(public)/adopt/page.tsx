import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AnimalFilter } from '@/components/public/AnimalFilter'
import { FavoriteButtonWrapper } from '@/components/public/FavoriteButtonWrapper'

export const metadata: Metadata = {
  title: 'Zvířata k adopci | Zozio',
  description: 'Najdi psa, kočku nebo jiné zvíře k adopci v útulcích po celé ČR a SR.',
}

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{
    q?:             string
    species?:       string
    breed?:         string
    city?:          string
    lat?:           string
    lng?:           string
    size?:          string
    urgent?:        string
    sort?:          string
    page?:          string
    housing?:       string
    kids?:          string
    other_animals?: string
    activity?:      string
    difficulty?:    string
  }>
}

export default async function AdoptPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page   = Math.max(1, parseInt(params.page ?? '1'))

  const [animals, total, species, breeds] = await Promise.all([
    getAnimals(params, page),
    getTotal(params),
    getActiveSpecies(),
    getBreeds(params.species),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasUrgent  = animals.some((a: any) => a.urgent)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-extrabold text-[#1A0F0A] mb-1"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
              Zvířata k adopci
            </h1>
            <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
              {total === 0 ? 'Žádné výsledky' : `${total} zvířat čeká na domov`}
            </p>
          </div>
          <Link href="/adopt/archiv"
            className="text-xs font-semibold px-3 py-2 rounded-lg border no-underline transition-all hover:opacity-80"
            style={{ borderColor: '#E0DDD8', color: '#8B6550', background: 'white' }}>
            Archiv adoptovaných →
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* Filtry */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <AnimalFilter
              species={species}
              breeds={breeds}
              cityList={Object.entries(CITY_COORDS).map(([name, [lat, lng]]) => ({ name, lat, lng })).sort((a, b) => a.name.localeCompare(b.name, 'cs'))}
              params={params}
              total={total}
            />
          </aside>

          {/* Výsledky */}
          <div className="flex-1 min-w-0">

            {/* Location sort banner */}
            {params.city && params.lat && (
              <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-lg gap-3"
                style={{ background: '#F0EDE8', border: '1px solid #E0DDD8' }}>
                <span className="text-sm font-semibold" style={{ color: '#1A0F0A' }}>
                  📍 Seřazeno od nejbližšího k: <strong>{params.city}</strong>
                </span>
                <Link href={buildFilterUrl(params, { city: undefined, lat: undefined, lng: undefined, page: undefined })}
                  className="text-xs font-bold no-underline flex-shrink-0"
                  style={{ color: '#8B6550' }}>
                  × Zrušit
                </Link>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
                {total > 0 && totalPages > 1 && `Strana ${page} z ${totalPages}`}
              </p>
              {!(params.city && params.lat) && <SortSelect current={params.sort} params={params} />}
            </div>

            {/* Urgentní banner */}
            {hasUrgent && !params.urgent && (
              <div role="status" aria-live="polite"
                className="mb-5 p-3 rounded-lg flex items-center gap-3"
                style={{ background: 'rgba(232,99,74,0.07)', border: '1px solid rgba(232,99,74,0.18)' }}>
                <span aria-hidden="true" className="text-lg">🆘</span>
                <p className="text-sm font-semibold flex-1" style={{ color: '#993C1D' }}>
                  Některá zvířata potřebují urgentní adopci
                </p>
                <Link
                  href={buildFilterUrl(params, { urgent: 'true', page: undefined })}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white no-underline"
                  style={{ background: '#E8634A' }}>
                  Zobrazit urgentní
                </Link>
              </div>
            )}

            {/* Grid */}
            {animals.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters(params)} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {animals.map((animal: any) => (
                  <AnimalCard key={animal.id} animal={animal} />
                ))}
              </div>
            )}

            {/* Stránkování */}
            {totalPages > 1 && (
              <Pagination current={page} total={totalPages} params={params} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Helpers ── */

function buildFilterUrl(params: any, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/adopt${str ? `?${str}` : ''}`
}

function hasActiveFilters(params: any) {
  return !!(params.q || params.species || params.breed || params.city || params.size ||
    params.urgent || params.housing || params.kids || params.other_animals ||
    params.activity || params.difficulty)
}

/* ── Sort ── */
function SortSelect({ current, params }: { current?: string; params: any }) {
  const options = [
    { value: 'newest', label: 'Nejnovější' },
    { value: 'urgent', label: 'Urgentní' },
    { value: 'name',   label: 'Jméno A–Z' },
  ]
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium" style={{ color: '#8B6550' }}>Řadit:</span>
      <div className="flex gap-1.5">
        {options.map(o => (
          <Link key={o.value}
            href={buildFilterUrl(params, { sort: o.value, page: undefined })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all no-underline"
            style={(current ?? 'newest') === o.value
              ? { background: '#1A0F0A', color: 'white' }
              : { background: '#F0EDE8', color: '#6B4030' }
            }>
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Animal card ── */
function AnimalCard({ animal }: { animal: any }) {
  const species     = animal.species     as any
  const institution = animal.institution as any
  const age         = animal.birth_year
    ? `${new Date().getFullYear() - animal.birth_year} let`
    : null

  const activityLabel: Record<string, { label: string; color: string; bg: string }> = {
    low:       { label: '😴 Nízká',       color: '#3B6D11', bg: '#EAF3DE' },
    medium:    { label: '🚶 Střední',      color: '#854F0B', bg: '#FAEEDA' },
    high:      { label: '🏃 Vysoká',       color: '#993C1D', bg: '#FAECE7' },
    very_high: { label: '⚡ Velmi vysoká', color: '#993C1D', bg: '#FAECE7' },
  }
  const activity = animal.activity_level ? activityLabel[animal.activity_level] : null

  return (
    <div className="relative group">
      <Link href={`/animals/${animal.id}`} className="no-underline block">
        <div className="bg-white rounded-lg overflow-hidden border border-[#F0EDE8] group-hover:border-[#E8634A]/40 group-hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
          <div className="relative h-40 sm:h-44 overflow-hidden flex-shrink-0" style={{ background: '#FAECE7' }}>
            {animal.primary_photo
              ? <Image src={animal.primary_photo} alt={`${animal.name}${species?.name_cs ? `, ${species.name_cs}` : ''}${animal.breed ? `, ${animal.breed}` : ''}`} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div aria-hidden="true" className="w-full h-full flex items-center justify-center text-5xl">{species?.icon ?? '🐾'}</div>
            }
            {animal.urgent && (
              <div className="absolute top-2.5 left-2.5 bg-[#E8634A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Urgentní
              </div>
            )}
            {animal.suitable_for_flat && !animal.suitable_for_house && (
              <div className="absolute top-2.5 right-2.5 bg-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#1A0F0A' }}>
                🏢 Byt
              </div>
            )}
            {institution?.city && (
              <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className="text-[10px] font-bold text-[#1A0F0A]">
                  {institution.city}
                  {animal._distance != null && ` · ${animal._distance < 1 ? '< 1' : animal._distance} km`}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 flex flex-col flex-1">
            <div className="font-bold text-[#1A0F0A] text-sm sm:text-base mb-0.5 truncate">{animal.name}</div>
            <div className="text-xs mb-2 truncate" style={{ color: '#6B4030' }}>
              {[species?.name_cs, animal.breed, age].filter(Boolean).join(' · ')}
            </div>
            <div className="flex flex-wrap gap-1 mt-auto">
              {animal.vaccinated     && <Pill label="Očkovaný"   bg="#EAF3DE" color="#3B6D11" />}
              {animal.neutered       && <Pill label="Kastrovaný" bg="#EAF3DE" color="#3B6D11" />}
              {animal.good_with_kids && <Pill label="S dětmi"    bg="#FAEEDA" color="#854F0B" />}
              {activity              && <Pill label={activity.label} bg={activity.bg} color={activity.color} />}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute top-2.5 right-2.5 z-10">
        <FavoriteButtonWrapper type="animal" id={animal.id} size="sm" />
      </div>
    </div>
  )
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: bg, color }}>
      {label}
    </span>
  )
}

/* ── Empty state ── */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-5">🔍</div>
      <h3 className="font-bold text-xl text-[#1A0F0A] mb-2">
        {hasFilters ? 'Žádná zvířata nenalezena' : 'Zatím žádná zvířata'}
      </h3>
      <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
        {hasFilters ? 'Zkus upravit nebo zrušit filtry.' : 'Brzy tu budou zvířata hledající domov.'}
      </p>
      {hasFilters && (
        <Link href="/adopt" className="inline-flex px-5 py-2.5 rounded-lg font-bold text-sm text-white no-underline"
          style={{ background: '#E8634A' }}>
          Zrušit všechny filtry
        </Link>
      )}
    </div>
  )
}

/* ── Stránkování ── */
function Pagination({ current, total, params }: { current: number; total: number; params: any }) {
  const pages = getPaginationRange(current, total)
  return (
    <nav aria-label="Stránkování" className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      {current > 1 && (
        <Link href={buildFilterUrl(params, { page: String(current - 1) })}
          aria-label="Předchozí stránka"
          className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm border no-underline transition-all hover:opacity-80"
          style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>←</Link>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} aria-hidden="true"
            className="min-w-[44px] h-11 flex items-center justify-center text-sm" style={{ color: '#8B6550' }}>…</span>
        ) : (
          <Link key={p} href={buildFilterUrl(params, { page: String(p) })}
            aria-label={`Stránka ${p}`}
            aria-current={p === current ? 'page' : undefined}
            className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm font-medium border no-underline transition-all"
            style={p === current
              ? { background: '#E8634A', color: 'white', borderColor: '#E8634A' }
              : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }
            }>{p}</Link>
        )
      )}
      {current < total && (
        <Link href={buildFilterUrl(params, { page: String(current + 1) })}
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

/* ── Geo helpers ── */

const CITY_COORDS: Record<string, [number, number]> = {
  'Praha': [50.0755, 14.4378], 'Brno': [49.1951, 16.6068], 'Ostrava': [49.8209, 18.2625],
  'Plzeň': [49.7471, 13.3776], 'Liberec': [50.7671, 15.0563], 'Olomouc': [49.5938, 17.2509],
  'České Budějovice': [48.9745, 14.4747], 'Hradec Králové': [50.2092, 15.8328],
  'Pardubice': [50.0343, 15.7812], 'Ústí nad Labem': [50.6607, 14.0422],
  'Zlín': [49.2248, 17.6669], 'Havířov': [49.7777, 18.4290], 'Kladno': [50.1475, 14.1053],
  'Most': [50.5027, 13.6362], 'Opava': [49.9381, 17.9044], 'Frýdek-Místek': [49.6814, 18.3608],
  'Karviná': [49.8561, 18.5461], 'Jihlava': [49.3961, 15.5907], 'Teplice': [50.6404, 13.8244],
  'Děčín': [50.7727, 14.2129], 'Chomutov': [50.4604, 13.4166], 'Jablonec nad Nisou': [50.7244, 15.1701],
  'Mladá Boleslav': [50.4132, 14.9035], 'Prostějov': [49.4736, 17.1105], 'Přerov': [49.4555, 17.4535],
  'Česká Lípa': [50.6862, 14.5375], 'Třebíč': [49.2161, 15.8797], 'Znojmo': [48.8553, 16.0483],
  'Kroměříž': [49.2981, 17.3976], 'Vsetín': [49.3387, 17.9962], 'Šumperk': [49.9755, 16.9717],
  'Uherské Hradiště': [49.0699, 17.4603], 'Strakonice': [49.2608, 13.9027],
  'Kolín': [50.0257, 15.2000], 'Nový Jičín': [49.5940, 18.0138], 'Cheb': [50.0800, 12.3711],
  'Sokolov': [50.1793, 12.6356], 'Klatovy': [49.3956, 13.2956], 'Trutnov': [50.5607, 15.9076],
  'Náchod': [50.4157, 16.1643], 'Písek': [49.3085, 14.1475], 'Tábor': [49.3706, 14.6729],
  'Příbram': [49.6942, 14.0085], 'Benešov': [49.7819, 14.6879], 'Rakovník': [50.1063, 13.7393],
  'Litoměřice': [50.5370, 14.1302], 'Louny': [50.3557, 13.7990], 'Chrudim': [49.9483, 15.7953],
  'Svitavy': [49.7558, 16.4681],
  // SK
  'Bratislava': [48.1486, 17.1077], 'Košice': [48.7164, 21.2611], 'Prešov': [49.0021, 21.2391],
  'Žilina': [49.2231, 18.7410], 'Banská Bystrica': [48.7414, 19.1499], 'Nitra': [48.3069, 18.0869],
  'Trnava': [48.3775, 17.5878], 'Martin': [49.0644, 18.9277], 'Trenčín': [48.8944, 18.0441],
  'Poprad': [49.0603, 20.2976], 'Zvolen': [48.5773, 19.1268], 'Michalovce': [48.7543, 21.9185],
  'Liptovský Mikuláš': [49.0840, 19.6114], 'Spišská Nová Ves': [48.9490, 20.5665],
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

/* ── Data ── */

async function getAnimals(params: any, page: number) {
  const supabase = createServiceClient()
  const hasLoc   = !!(params.lat && params.lng)
  const offset   = hasLoc ? 0 : (page - 1) * PAGE_SIZE
  const limit    = hasLoc ? 500 : PAGE_SIZE

  let query = supabase
    .from('animals')
    .select('id, name, breed, birth_year, primary_photo, urgent, adoption_status, vaccinated, neutered, good_with_kids, good_with_dogs, good_with_cats, good_with_other_animals, suitable_for_flat, suitable_for_house, activity_level, care_difficulty, species:animal_species(name_cs,icon), institution:institutions(name,city,type)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .or('in_quarantine.is.null,in_quarantine.eq.false')

  if (params.species)  query = query.eq('species_id', params.species)
  if (params.breed)    query = query.eq('breed', params.breed)
  if (params.size)     query = query.eq('size', params.size)
  if (params.urgent === 'true') query = query.eq('urgent', true)
  if (params.q)        query = query.or(`name.ilike.%${params.q}%,breed.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  if (params.housing === 'flat')  query = query.eq('suitable_for_flat', true)
  if (params.housing === 'house') query = query.eq('suitable_for_house', true)
  if (params.kids === 'yes')      query = query.eq('good_with_kids', true)
  if (params.kids === 'no')       query = query.eq('good_with_kids', false)
  if (params.other_animals === 'yes') query = query.or('good_with_dogs.eq.true,good_with_cats.eq.true,good_with_other_animals.eq.true')
  if (params.other_animals === 'no')  query = query.eq('good_with_dogs', false).eq('good_with_cats', false)
  if (params.activity)    query = query.eq('activity_level', params.activity)
  if (params.difficulty)  query = query.eq('care_difficulty', params.difficulty)

  if (!hasLoc) {
    query = params.sort === 'name'
      ? query.order('name', { ascending: true })
      : query.order('urgent', { ascending: false }).order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data } = await query
  let animals = (data ?? []) as any[]

  if (hasLoc) {
    const uLat = parseFloat(params.lat)
    const uLng = parseFloat(params.lng)
    animals = animals
      .map(a => {
        const city   = (a.institution as any)?.city as string | undefined
        const coords = city ? CITY_COORDS[city] : null
        const dist   = coords ? Math.round(haversineKm(uLat, uLng, coords[0], coords[1])) : null
        return { ...a, _distance: dist }
      })
      .sort((a, b) => {
        if (a._distance === null && b._distance === null) return 0
        if (a._distance === null) return 1
        if (b._distance === null) return -1
        return a._distance - b._distance
      })
    const start = (page - 1) * PAGE_SIZE
    animals = animals.slice(start, start + PAGE_SIZE)
  }

  return animals
}

async function getTotal(params: any) {
  const supabase = createServiceClient()
  let query = supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('published', true)
    .eq('adoption_status', 'available')
    .or('in_quarantine.is.null,in_quarantine.eq.false')

  if (params.species)  query = query.eq('species_id', params.species)
  if (params.breed)    query = query.eq('breed', params.breed)
  if (params.size)     query = query.eq('size', params.size)
  if (params.urgent === 'true') query = query.eq('urgent', true)
  if (params.q)        query = query.or(`name.ilike.%${params.q}%,breed.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  if (params.housing === 'flat')  query = query.eq('suitable_for_flat', true)
  if (params.housing === 'house') query = query.eq('suitable_for_house', true)
  if (params.kids === 'yes') query = query.eq('good_with_kids', true)
  if (params.kids === 'no')  query = query.eq('good_with_kids', false)
  if (params.activity)   query = query.eq('activity_level', params.activity)
  if (params.difficulty) query = query.eq('care_difficulty', params.difficulty)

  const { count } = await query
  return count ?? 0
}

async function getActiveSpecies() {
  const service = createServiceClient()
  const { data } = await service
    .from('animal_species')
    .select('id, name_cs, icon')
    .eq('category', 'domestic')
    .order('name_cs')
  return data ?? []
}

async function getBreeds(speciesId?: string) {
  const supabase = createServiceClient()
  let query = supabase
    .from('animals')
    .select('breed')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .or('in_quarantine.is.null,in_quarantine.eq.false')
    .not('breed', 'is', null) as any

  if (speciesId) query = query.eq('species_id', speciesId)

  const { data } = await query
  return [...new Set((data ?? []).map((d: any) => d.breed).filter(Boolean))].sort() as string[]
}
