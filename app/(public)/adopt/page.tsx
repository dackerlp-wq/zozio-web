import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
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
    city?:          string
    size?:          string
    urgent?:        string
    sort?:          string
    page?:          string
    housing?:       string   // 'flat' | 'house'
    kids?:          string   // 'yes' | 'no' | 'any'
    other_animals?: string   // 'yes' | 'no' | 'any'
    activity?:      string   // 'very_high' | 'high' | 'medium' | 'low'
    difficulty?:    string   // 'easy' | 'medium' | 'demanding' | 'expert'
  }>
}

export default async function AdoptPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page   = Math.max(1, parseInt(params.page ?? '1'))

  const [animals, total, species, cities] = await Promise.all([
    getAnimals(params, page),
    getTotal(params),
    getSpecies(),
    getCities(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasUrgent  = animals.some((a: any) => a.urgent)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-1"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Zvířata k adopci
          </h1>
          <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
            {total === 0 ? 'Žádné výsledky' : `${total} zvířat čeká na domov`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* Filtry */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <AnimalFilter species={species} cities={cities} params={params} total={total} />
          </aside>

          {/* Výsledky */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
                {total > 0 && totalPages > 1 && `Strana ${page} z ${totalPages}`}
              </p>
              <SortSelect current={params.sort} params={params} />
            </div>

            {/* Urgentní banner */}
            {hasUrgent && !params.urgent && (
              <div className="mb-5 p-3 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(232,99,74,0.07)', border: '1px solid rgba(232,99,74,0.18)' }}>
                <span className="text-lg">🆘</span>
                <p className="text-sm font-semibold flex-1" style={{ color: '#993C1D' }}>
                  Některá zvířata potřebují urgentní adopci
                </p>
                <Link
                  href={buildFilterUrl(params, { urgent: 'true', page: undefined })}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white no-underline"
                  style={{ background: '#E8634A' }}>
                  Zobrazit
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
  return !!(params.q || params.species || params.city || params.size || params.urgent ||
    params.housing || params.kids || params.other_animals || params.activity || params.difficulty)
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

  // Aktivita badge
  const activityLabel: Record<string, { label: string; color: string; bg: string }> = {
    low:       { label: '😴 Nízká',       color: '#3B6D11', bg: '#EAF3DE' },
    medium:    { label: '🚶 Střední',      color: '#854F0B', bg: '#FAEEDA' },
    high:      { label: '🏃 Vysoká',       color: '#993C1D', bg: '#FAECE7' },
    very_high: { label: '⚡ Velmi vysoká', color: '#993C1D', bg: '#FAECE7' },
  }
  const activity = animal.activity_level ? activityLabel[animal.activity_level] : null

  return (
    <Link href={`/animals/${animal.id}`} className="no-underline group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
        <div className="relative h-40 sm:h-44 overflow-hidden flex-shrink-0" style={{ background: '#FAECE7' }}>
          {animal.primary_photo
            ? <Image src={animal.primary_photo} alt={animal.name} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-5xl">{species?.icon ?? '🐾'}</div>
          }
          {animal.urgent && (
            <div className="absolute top-2.5 left-2.5 bg-[#E8634A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Urgentní
            </div>
          )}
          <FavoriteButtonWrapper type="animal" id={animal.id} size="sm" className="absolute top-2.5 right-2.5" />
          {/* Housing badge */}
          {animal.suitable_for_flat && !animal.suitable_for_house && (
            <div className="absolute top-2.5 right-2.5 bg-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#1A0F0A' }}>
              🏢 Byt
            </div>
          )}
          {institution?.city && (
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
              <span className="text-[10px] font-bold text-[#1A0F0A]">{institution.city}</span>
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <div className="font-bold text-[#1A0F0A] text-sm sm:text-base mb-0.5 truncate">{animal.name}</div>
          <div className="text-xs mb-2 truncate" style={{ color: '#8B6550' }}>
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
        <Link href="/adopt" className="inline-flex px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline"
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

/* ── Data ── */

async function getAnimals(params: any, page: number) {
  const supabase = await createClient()
  const offset   = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('animals')
    .select('id, name, breed, birth_year, primary_photo, urgent, adoption_status, vaccinated, neutered, good_with_kids, good_with_dogs, good_with_cats, good_with_other_animals, suitable_for_flat, suitable_for_house, activity_level, care_difficulty, species:animal_species(name_cs,icon), institution:institutions(name,city,type)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .or('in_quarantine.is.null,in_quarantine.eq.false')

  // Filtry
  if (params.species)  query = query.eq('species_id', params.species)
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

  // Řazení
  query = params.sort === 'name'
    ? query.order('name', { ascending: true })
    : query.order('urgent', { ascending: false }).order('created_at', { ascending: false })

  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data } = await query
  let animals = (data ?? []) as any[]

  // City — post-process
  if (params.city) animals = animals.filter(a => (a.institution as any)?.city === params.city)

  return animals
}

async function getTotal(params: any) {
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
  return [...new Set((data ?? []).map((d: any) => d.city).filter(Boolean))].sort() as string[]
}
