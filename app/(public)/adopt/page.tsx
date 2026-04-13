import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AnimalFilter } from '@/components/public/AnimalFilter'
import { FavoriteButtonWrapper } from '@/components/public/FavoriteButtonWrapper'
import type { InstitutionType } from '@/types/database'

/* ── Query-specific types ── */
interface AdoptAnimal {
  id: string
  name: string
  breed: string | null
  birth_year: number | null
  primary_photo: string | null
  urgent: boolean
  adoption_status: string
  vaccinated: boolean
  neutered: boolean
  good_with_kids: boolean | null
  good_with_dogs: boolean | null
  good_with_cats: boolean | null
  good_with_other_animals: boolean | null
  suitable_for_flat: boolean | null
  suitable_for_house: boolean | null
  activity_level: string | null
  care_difficulty: string | null
  species: { name_cs: string; icon: string | null } | null
  institution: { name: string; city: string; type: InstitutionType } | null
}

interface FilterParams {
  q?:             string
  species?:       string
  city?:          string
  size?:          string
  urgent?:        string
  sort?:          string
  page?:          string
  housing?:       string
  kids?:          string
  other_animals?: string
  activity?:      string
  difficulty?:    string
}

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
  const hasUrgent  = animals.some((a: AdoptAnimal) => a.urgent)

  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <h1 className="font-display font-extrabold text-text-primary mb-1"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Zvířata k adopci
          </h1>
          <p className="text-sm font-medium text-text-muted">
            {total === 0 ? 'Žádné výsledky' : `${total} zvířat čeká na domov`}
          </p>
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
              <p className="text-sm font-medium text-text-muted">
                {total > 0 && totalPages > 1 && `Strana ${page} z ${totalPages}`}
              </p>
              {!(params.city && params.lat) && <SortSelect current={params.sort} params={params} />}
            </div>

            {/* Urgentní banner */}
            {hasUrgent && !params.urgent && (
              <div role="status" aria-live="polite"
                className="mb-5 p-3 rounded-lg flex items-center gap-3"
                style={{ background: 'rgba(232,99,74,0.07)', border: '1px solid rgba(232,99,74,0.18)' }}>
                <span className="text-lg">🆘</span>
                <p className="text-sm font-semibold flex-1 text-coral-tag-text">
                  Některá zvířata potřebují urgentní adopci
                </p>
                <Link
                  href={buildFilterUrl(params, { urgent: 'true', page: undefined })}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white no-underline bg-coral">
                  Zobrazit
                </Link>
              </div>
            )}

            {/* Grid */}
            {animals.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters(params)} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {animals.map((animal: AdoptAnimal) => (
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

function buildFilterUrl(params: FilterParams, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/adopt${str ? `?${str}` : ''}`
}

function hasActiveFilters(params: FilterParams) {
  return !!(params.q || params.species || params.city || params.size || params.urgent ||
    params.housing || params.kids || params.other_animals || params.activity || params.difficulty)
}

/* ── Sort ── */
function SortSelect({ current, params }: { current?: string; params: FilterParams }) {
  const options = [
    { value: 'newest', label: 'Nejnovější' },
    { value: 'urgent', label: 'Urgentní' },
    { value: 'name',   label: 'Jméno A–Z' },
  ]
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-text-muted">Řadit:</span>
      <div className="flex gap-1.5">
        {options.map(o => (
          <Link key={o.value}
            href={buildFilterUrl(params, { sort: o.value, page: undefined })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all no-underline"
            style={(current ?? 'newest') === o.value
              ? { background: 'var(--text-primary)', color: 'white' }
              : { background: 'var(--border)', color: 'var(--text-body)' }
            }>
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Animal card ── */
function AnimalCard({ animal }: { animal: AdoptAnimal }) {
  const species     = animal.species
  const institution = animal.institution
  const age         = animal.birth_year
    ? `${new Date().getFullYear() - animal.birth_year} let`
    : null

  // Aktivita badge
  const activityLabel: Record<string, { label: string; color: string; bg: string }> = {
    low:       { label: '😴 Nízká',       color: 'var(--success-tag-text)', bg: 'var(--success-tag-bg)' },
    medium:    { label: '🚶 Střední',      color: 'var(--warning-tag-text)', bg: 'var(--warning-tag-bg)' },
    high:      { label: '🏃 Vysoká',       color: 'var(--coral-tag-text)', bg: 'var(--coral-tag-bg)' },
    very_high: { label: '⚡ Velmi vysoká', color: 'var(--coral-tag-text)', bg: 'var(--coral-tag-bg)' },
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
    <Link href={`/animals/${animal.id}`} className="no-underline group">
      <div className="bg-white rounded-2xl overflow-hidden border border-border hover:border-coral/40 hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
        <div className="relative h-40 sm:h-44 overflow-hidden flex-shrink-0 bg-coral-tag-bg">
          {animal.primary_photo
            ? <Image src={animal.primary_photo} alt={animal.name} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-5xl">{species?.icon ?? '🐾'}</div>
          }
          {animal.urgent && (
            <div className="absolute top-2.5 left-2.5 bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Urgentní
            </div>
          )}
          <FavoriteButtonWrapper type="animal" id={animal.id} size="sm" className="absolute top-2.5 right-2.5" />
          {/* Housing badge */}
          {animal.suitable_for_flat && !animal.suitable_for_house && (
            <div className="absolute top-2.5 right-2.5 bg-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full text-text-primary">
              🏢 Byt
            </div>
          )}
          {institution?.city && (
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
              <span className="text-[10px] font-bold text-text-primary">{institution.city}</span>
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <div className="font-bold text-text-primary text-sm sm:text-base mb-0.5 truncate">{animal.name}</div>
          <div className="text-xs mb-2 truncate text-text-muted">
            {[species?.name_cs, animal.breed, age].filter(Boolean).join(' · ')}
          </div>
          <div className="flex flex-wrap gap-1 mt-auto">
            {animal.vaccinated     && <Pill label="Očkovaný"   bg="var(--success-tag-bg)" color="var(--success-tag-text)" />}
            {animal.neutered       && <Pill label="Kastrovaný" bg="var(--success-tag-bg)" color="var(--success-tag-text)" />}
            {animal.good_with_kids && <Pill label="S dětmi"    bg="var(--warning-tag-bg)" color="var(--warning-tag-text)" />}
            {activity              && <Pill label={activity.label} bg={activity.bg} color={activity.color} />}
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
      <h3 className="font-bold text-xl text-text-primary mb-2">
        {hasFilters ? 'Žádná zvířata nenalezena' : 'Zatím žádná zvířata'}
      </h3>
      <p className="text-sm mb-6 text-text-muted">
        {hasFilters ? 'Zkus upravit nebo zrušit filtry.' : 'Brzy tu budou zvířata hledající domov.'}
      </p>
      {hasFilters && (
        <Link href="/adopt" className="inline-flex px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline bg-coral">
          Zrušit všechny filtry
        </Link>
      )}
    </div>
  )
}

/* ── Stránkování ── */
function Pagination({ current, total, params }: { current: number; total: number; params: FilterParams }) {
  const pages = getPaginationRange(current, total)
  return (
    <nav aria-label="Stránkování" className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      {current > 1 && (
        <Link href={buildFilterUrl(params, { page: String(current - 1) })}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm border no-underline transition-all hover:opacity-80"
          style={{ borderColor: '#E0DDD8', color: 'var(--text-body)', background: 'white' }}>←</Link>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-text-muted">…</span>
        ) : (
          <Link key={p} href={buildFilterUrl(params, { page: String(p) })}
            aria-label={`Stránka ${p}`}
            aria-current={p === current ? 'page' : undefined}
            className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm font-medium border no-underline transition-all"
            style={p === current
              ? { background: 'var(--coral)', color: 'white', borderColor: 'var(--coral)' }
              : { background: 'white', color: 'var(--text-body)', borderColor: '#E0DDD8' }
            }>{p}</Link>
        )
      )}
      {current < total && (
        <Link href={buildFilterUrl(params, { page: String(current + 1) })}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm border no-underline transition-all hover:opacity-80"
          style={{ borderColor: '#E0DDD8', color: 'var(--text-body)', background: 'white' }}>→</Link>
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

async function getAnimals(params: FilterParams, page: number) {
  const supabase = await createClient()
  const offset   = (page - 1) * PAGE_SIZE

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

  const { data } = await query
  let animals = (data ?? []) as unknown as AdoptAnimal[]

  // City — post-process
  if (params.city) animals = animals.filter(a => a.institution?.city === params.city)

  return animals
}

async function getTotal(params: FilterParams) {
  const supabase = await createClient()
  let query = supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('published', true)
    .eq('adoption_status', 'available')
    .or('in_quarantine.is.null,in_quarantine.eq.false')

  if (params.species)  query = query.eq('species_id', params.species)
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

async function getSpecies() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animal_species').select('id, name_cs, icon').eq('category', 'domestic').order('name_cs')
  return data ?? []
}

async function getCities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('institutions').select('city').eq('type', 'shelter').eq('approval_status', 'approved')
  return [...new Set((data ?? []).map((d: { city: string }) => d.city).filter(Boolean))].sort() as string[]
}
