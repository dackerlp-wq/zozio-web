import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AnimalFilter } from '@/components/public/AnimalFilter'
import { FavoriteButtonWrapper } from '@/components/public/FavoriteButtonWrapper'
import { CITIES_SORTED } from '@/lib/cities-cz-sk'
import { formatBreed } from '@/lib/breed-label'

export const revalidate = 300 // 5 minut — fallback, primárně invaliduje revalidatePath v API

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

  const [{ animals, total }, species, breeds] = await Promise.all([
    getAnimals(params, page),
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
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* Filtry — desktop sidebar + mobilní floating button/sheet */}
          <aside className="lg:w-64 flex-shrink-0">
            <AnimalFilter
              species={species}
              breeds={breeds}
              cityList={CITIES_SORTED}
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

            {/* Archiv */}
            <div className="mt-8 text-center">
              <Link href="/adopt/archiv"
                className="text-xs font-semibold px-3 py-2 rounded-lg border no-underline transition-all hover:opacity-80 inline-block"
                style={{ borderColor: '#E0DDD8', color: '#8B6550', background: 'white' }}>
                Archiv adoptovaných →
              </Link>
            </div>
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
  const isFemale    = animal.sex === 'female'
  const age         = animal.birth_year
    ? `${new Date().getFullYear() - animal.birth_year} let`
    : null

  // Aktivita — inflektováno podle pohlaví
  const activityTag: Record<string, { label: string; bg: string; color: string }> = {
    low:       { label: isFemale ? '😴 Klidná'         : '😴 Klidný',         bg: '#EAF3DE', color: '#3B6D11' },
    medium:    { label: '🚶 Středně aktivní',                                   bg: '#FAEEDA', color: '#854F0B' },
    high:      { label: isFemale ? '🏃 Aktivní'        : '🏃 Aktivní',         bg: '#FAECE7', color: '#993C1D' },
    very_high: { label: '⚡ Velmi aktivní',                                     bg: '#FAECE7', color: '#993C1D' },
  }

  // Náročnost — inflektováno podle pohlaví
  const difficultyTag: Record<string, { label: string; bg: string; color: string }> = {
    easy:      { label: isFemale ? '⭐ Nenáročná'      : '⭐ Nenáročný',       bg: '#EAF3DE', color: '#3B6D11' },
    medium:    { label: isFemale ? '⭐⭐ Středně náročná' : '⭐⭐ Středně náročný', bg: '#FAEEDA', color: '#854F0B' },
    demanding: { label: isFemale ? '⭐⭐⭐ Náročná'     : '⭐⭐⭐ Náročný',     bg: '#FFF5E6', color: '#7A4F00' },
    expert:    { label: '⭐⭐⭐⭐ Pro odborníky',                               bg: '#FFF0E6', color: '#993C1D' },
  }

  const tags: { label: string; bg: string; color: string }[] = []

  // 1. Děti
  if (animal.good_with_kids === true)
    tags.push({ label: isFemale ? '👶 Vhodná k dětem' : '👶 Vhodný k dětem', bg: '#EAF3DE', color: '#1D6A42' })
  else if (animal.good_with_kids === false)
    tags.push({ label: isFemale ? '👶 Nevhodná k dětem' : '👶 Nevhodný k dětem', bg: '#FFF5F2', color: '#993C1D' })

  // 2. Aktivita
  if (animal.activity_level && activityTag[animal.activity_level])
    tags.push(activityTag[animal.activity_level])

  // 3. Náročnost
  if (animal.care_difficulty && difficultyTag[animal.care_difficulty])
    tags.push(difficultyTag[animal.care_difficulty])

  // 4. Jiná zvířata
  if (animal.good_with_dogs || animal.good_with_cats || animal.good_with_other_animals)
    tags.push({ label: '🐾 Vychází se zvířaty', bg: '#E8F4FD', color: '#1A5C8A' })

  // 5. Typ bydlení
  if (animal.suitable_for_flat && !animal.suitable_for_house)
    tags.push({ label: '🏢 Do bytu', bg: '#F0EDE8', color: '#6B4030' })
  else if (animal.suitable_for_house && !animal.suitable_for_flat)
    tags.push({ label: '🏡 Do domu', bg: '#F0EDE8', color: '#6B4030' })

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
            <div className="text-xs mb-0.5 truncate" style={{ color: '#6B4030' }}>
              {[species?.name_cs, formatBreed(animal.breed, animal.is_crossbreed, animal.breed2), age].filter(Boolean).join(' · ')}
            </div>
            {institution?.name && (
              <div className="text-[11px] mb-2 truncate font-medium" style={{ color: '#8B6550' }}>
                📍 {institution.name}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-auto">
              {tags.slice(0, 4).map(t => (
                <Pill key={t.label} label={t.label} bg={t.bg} color={t.color} />
              ))}
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

  // GPS mode: pre-filter institutions by bounding box, then fetch only nearby animals
  if (hasLoc) {
    const uLat = parseFloat(params.lat)
    const uLng = parseFloat(params.lng)

    // Bounding box: ~220 km lat, ~280 km lng (at CZ/SK latitudes)
    const LAT_DELTA = 2.0
    const LNG_DELTA = 3.0

    // Step 1: get institutions within bounding box (only id, lat, lng)
    const { data: nearbyInstitutions } = await supabase
      .from('institutions')
      .select('id, lat, lng')
      .gte('lat', uLat - LAT_DELTA)
      .lte('lat', uLat + LAT_DELTA)
      .gte('lng', uLng - LNG_DELTA)
      .lte('lng', uLng + LNG_DELTA)
      .not('lat', 'is', null)
      .not('lng', 'is', null)

    if (!nearbyInstitutions || nearbyInstitutions.length === 0) {
      return { animals: [], total: 0 }
    }

    // Sort institutions by distance so animals can be ordered accordingly
    const institutionsByDistance = nearbyInstitutions
      .map(inst => ({
        id: inst.id,
        distance: Math.round(haversineKm(uLat, uLng, Number(inst.lat), Number(inst.lng))),
      }))
      .sort((a, b) => a.distance - b.distance)

    const institutionIds = institutionsByDistance.map(i => i.id)
    const distanceMap    = new Map(institutionsByDistance.map(i => [i.id, i.distance]))

    // Step 2: fetch all matching animals from those institutions (no artificial 500 limit)
    let query = supabase
      .from('animals')
      .select('id, name, sex, breed, is_crossbreed, breed2, birth_year, primary_photo, urgent, adoption_status, good_with_kids, good_with_dogs, good_with_cats, good_with_other_animals, suitable_for_flat, suitable_for_house, activity_level, care_difficulty, institution_id, species:animal_species(name_cs,icon), institution:institutions(name,city,type,lat,lng)', { count: 'exact' })
      .eq('published', true)
      .eq('adoption_status', 'available')
      .or('in_quarantine.is.null,in_quarantine.eq.false')
      .in('institution_id', institutionIds)

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

    const { data, count } = await query
    let animals = (data ?? []) as any[]

    // Attach distance and sort by it
    animals = animals
      .map(a => ({ ...a, _distance: distanceMap.get(a.institution_id) ?? null }))
      .sort((a, b) => {
        if (a._distance === null && b._distance === null) return 0
        if (a._distance === null) return 1
        if (b._distance === null) return -1
        return a._distance - b._distance
      })

    const total = count ?? animals.length
    const start = (page - 1) * PAGE_SIZE
    return { animals: animals.slice(start, start + PAGE_SIZE), total }
  }

  // Normal (non-GPS) mode
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('animals')
    .select('id, name, sex, breed, birth_year, primary_photo, urgent, adoption_status, good_with_kids, good_with_dogs, good_with_cats, good_with_other_animals, suitable_for_flat, suitable_for_house, activity_level, care_difficulty, species:animal_species(name_cs,icon), institution:institutions(name,city,type,lat,lng)', { count: 'exact' })
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

  query = params.sort === 'name'
    ? query.order('name', { ascending: true })
    : query.order('urgent', { ascending: false }).order('created_at', { ascending: false })

  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data, count } = await query
  return { animals: (data ?? []) as any[], total: count ?? 0 }
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
