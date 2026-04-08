import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = {
  title: 'Archiv adoptovaných zvířat | Zozio',
  description: 'Přehled zvířat, která již našla nový domov nebo odešla.',
}

const PAGE_SIZE = 24

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  adopted:  { label: 'Adoptováno',  bg: '#EAF3DE', color: '#3B6D11' },
  deceased: { label: 'Uhynulo',     bg: '#F0EDE8', color: '#8B6550' },
}

interface PageProps {
  searchParams: Promise<{
    q?:       string
    species?: string
    page?:    string
  }>
}

export default async function AdoptArchivPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page   = Math.max(1, parseInt(params.page ?? '1'))

  const [animals, total, species] = await Promise.all([
    getAnimals(params, page),
    getTotal(params),
    getSpecies(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10 flex items-end gap-4 flex-wrap justify-between">
          <div>
            <Link href="/adopt" className="text-xs font-semibold no-underline mb-2 inline-flex items-center gap-1"
              style={{ color: '#8B6550' }}>
              ← Zpět na adopce
            </Link>
            <h1 className="font-display font-extrabold text-[#1A0F0A] mb-1"
              style={{ fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
              Archiv zvířat
            </h1>
            <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
              {total === 0 ? 'Žádné záznamy' : `${total} zvířat v archivu`}
            </p>
          </div>
        </div>

        {/* Filtry */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Vyhledávání */}
          <form method="get" action="/adopt/archiv" className="flex-1 max-w-xs">
            {params.species && <input type="hidden" name="species" value={params.species} />}
            <div className="flex items-center border rounded-lg overflow-hidden"
              style={{ borderColor: '#E0DDD8', background: 'white' }}>
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Hledat podle jména..."
                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                style={{ color: '#1A0F0A', minWidth: 0 }}
              />
              <button type="submit"
                className="px-3 py-2 text-white text-sm border-none cursor-pointer hover:opacity-90"
                style={{ background: '#E8634A' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </form>

          {/* Druhy */}
          <div className="flex flex-wrap gap-1.5">
            <SpeciesChip label="Všechna" href={buildUrl(params, { species: undefined, page: undefined })} active={!params.species} />
            {species.map(s => (
              <SpeciesChip key={s.id}
                label={`${s.icon ?? ''} ${s.name_cs}`}
                href={buildUrl(params, { species: s.id, page: undefined })}
                active={params.species === s.id}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        {animals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="font-bold text-lg text-[#1A0F0A] mb-2">Žádné záznamy v archivu</h3>
            <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
              {(params.q || params.species) ? 'Zkus upravit filtry.' : 'Archiv je prázdný.'}
            </p>
            {(params.q || params.species) && (
              <Link href="/adopt/archiv" className="inline-flex px-5 py-2.5 rounded-lg font-bold text-sm text-white no-underline"
                style={{ background: '#E8634A' }}>
                Zrušit filtry
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {animals.map((animal: any) => (
              <ArchiveCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}

        {/* Stránkování */}
        {totalPages > 1 && (
          <nav aria-label="Stránkování" className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
            {page > 1 && (
              <Link href={buildUrl(params, { page: String(page - 1) })}
                className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm border no-underline"
                style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>←</Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <Link key={p} href={buildUrl(params, { page: String(p) })}
                className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm font-medium border no-underline"
                style={p === page
                  ? { background: '#E8634A', color: 'white', borderColor: '#E8634A' }
                  : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }
                }>{p}</Link>
            ))}
            {page < totalPages && (
              <Link href={buildUrl(params, { page: String(page + 1) })}
                className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm border no-underline"
                style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>→</Link>
            )}
          </nav>
        )}
      </div>
    </main>
  )
}

/* ── Components ── */

function SpeciesChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border no-underline transition-all"
      style={active
        ? { background: '#FAECE7', borderColor: '#E8634A', color: '#993C1D' }
        : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }
      }>
      {label}
    </Link>
  )
}

function ArchiveCard({ animal }: { animal: any }) {
  const sp     = animal.species     as any
  const inst   = animal.institution as any
  const status = STATUS_LABELS[animal.adoption_status] ?? { label: animal.adoption_status, bg: '#F0EDE8', color: '#8B6550' }

  return (
    <Link href={`/animals/${animal.id}`} className="no-underline block group">
      <div className="bg-white rounded-lg overflow-hidden border border-[#F0EDE8] group-hover:border-[#E8634A]/40 transition-all duration-200">
        <div className="relative h-28 overflow-hidden" style={{ background: '#F5F2EE' }}>
          {animal.primary_photo
            ? <Image src={animal.primary_photo} alt={animal.name ?? ''} fill sizes="180px" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            : <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">{sp?.icon ?? '🐾'}</div>
          }
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-1.5 left-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>
        <div className="p-2">
          <div className="font-bold text-xs text-[#1A0F0A] truncate">{animal.name ?? '—'}</div>
          <div className="text-[10px] truncate mt-0.5" style={{ color: '#8B6550' }}>
            {[sp?.name_cs, animal.breed].filter(Boolean).join(' · ') || '—'}
          </div>
          {inst?.city && (
            <div className="text-[10px] mt-0.5" style={{ color: '#B89880' }}>📍 {inst.city}</div>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── Helpers ── */

function buildUrl(params: any, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/adopt/archiv${str ? `?${str}` : ''}`
}

/* ── Data ── */

async function getAnimals(params: any, page: number) {
  const supabase = createServiceClient()
  const offset   = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('animals')
    .select('id, name, breed, primary_photo, adoption_status, species:animal_species(name_cs,icon), institution:institutions(city)')
    .eq('published', true)
    .in('adoption_status', ['adopted', 'deceased'])
    .order('updated_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1) as any

  if (params.species) query = query.eq('species_id', params.species)
  if (params.q)       query = query.ilike('name', `%${params.q}%`)

  const { data } = await query
  return (data ?? []) as any[]
}

async function getTotal(params: any) {
  const supabase = createServiceClient()
  let query = supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('published', true)
    .in('adoption_status', ['adopted', 'deceased']) as any

  if (params.species) query = query.eq('species_id', params.species)
  if (params.q)       query = query.ilike('name', `%${params.q}%`)

  const { count } = await query
  return count ?? 0
}

async function getSpecies() {
  const supabase = createServiceClient()
  const { data: animals } = await supabase
    .from('animals')
    .select('species_id')
    .eq('published', true)
    .in('adoption_status', ['adopted', 'deceased'])

  const ids = [...new Set((animals ?? []).map((a: any) => a.species_id).filter(Boolean))]
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('animal_species')
    .select('id, name_cs, icon')
    .in('id', ids)
    .order('name_cs')

  return data ?? []
}
