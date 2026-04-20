import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { breedSlug } from '@/lib/breed-slug'
import { BreedSearch } from '@/components/public/BreedSearch'
import type { BreedSearchItem } from '@/components/public/BreedSearch'
import { CatalogBrowser, type CatalogSpecies } from '@/components/public/CatalogBrowser'

export const metadata: Metadata = {
  title: 'Katalog plemen psů a koček | Zozio',
  description: 'Přehled plemen psů a koček k adopci na Zozio. Najdi svého nového mazlíčka a zjisti vše o jeho povaze, velikosti a potřebách.',
}

export const revalidate = 3600

const DOG_NAMES = ['pes', 'psi', 'psy']
const CAT_NAMES = ['kočka', 'kočky', 'kocka']

export default async function KatalogPage() {
  const { species } = await getData()
  const total = species.reduce((s, sp) => s + sp.animalCount, 0)

  const searchBreeds: BreedSearchItem[] = species.flatMap(sp =>
    sp.breeds.map(b => ({
      name: b.name,
      slug: b.slug,
      speciesIcon: sp.icon ?? '🐾',
      speciesName: sp.name_cs,
      count: b.count,
    }))
  ).sort((a, b) => a.name.localeCompare(b.name, 'cs'))

  const browserSpecies: CatalogSpecies[] = species.map(sp => ({
    id: sp.id,
    name_cs: sp.name_cs,
    icon: sp.icon,
    animalCount: sp.animalCount,
    breeds: sp.breeds.map(b => ({
      name: b.name,
      slug: b.slug,
      count: b.count,
      fciGroup: b.fciGroup,
      originalName: b.originalName,
      officialAbbreviation: b.officialAbbreviation,
    })),
  }))

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="py-8 md:py-10 border-b border-[#F0EDE8] mb-8">
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-2"
            style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            Katalog plemen psů a koček
          </h1>
          <p className="text-sm md:text-base mb-4" style={{ color: '#6B4030' }}>
            Přehled plemen hledajících domov na Zozio — roztříděno dle FCI skupin. Filtruj a prohlédni si povahu, velikost a potřeby každého plemene.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Stat label="druhů" value={species.filter(s => s.animalCount > 0).length} />
            <Stat label="plemen v databázi" value={species.reduce((n, s) => n + s.breeds.length, 0)} />
            <Stat label="zvířat k adopci" value={total} color="#E8634A" />
          </div>
          <BreedSearch breeds={searchBreeds} />
        </div>

        <CatalogBrowser species={browserSpecies} />

        {/* CTA */}
        <div className="mt-16 p-8 rounded-lg text-center" style={{ background: '#FBF0EC' }}>
          <p className="font-display font-extrabold text-[#1A0F0A] text-lg md:text-xl mb-2">
            Hledáš konkrétní zvíře?
          </p>
          <p className="text-sm mb-5" style={{ color: '#6B4030' }}>
            Použij pokročilé filtry — pohlaví, velikost, vhodnost do bytu a mnoho dalšího.
          </p>
          <Link href="/adopt"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white no-underline hover:opacity-90 transition-opacity"
            style={{ background: '#E8634A' }}>
            Prohlédnout všechna zvířata →
          </Link>
        </div>

      </div>
    </main>
  )
}

function Stat({ label, value, color = '#1A0F0A' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#F0EDE8]">
      <span className="font-extrabold text-lg" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: '#8B6550' }}>{label}</span>
    </div>
  )
}

interface BreedRow {
  name: string
  slug: string
  count: number
  fciGroup: string | null
  originalName: string | null
  officialAbbreviation: string | null
}

interface SpeciesWithBreeds {
  id: string
  name_cs: string
  icon: string | null
  animalCount: number
  breeds: BreedRow[]
}

async function getData(): Promise<{ species: SpeciesWithBreeds[] }> {
  const supabase = createServiceClient()

  const { data: speciesData } = await supabase
    .from('animal_species')
    .select('id, name_cs, icon')
    .order('name_cs')

  const filtered = (speciesData ?? []).filter(sp => {
    const n = sp.name_cs.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return DOG_NAMES.some(d => n.includes(d.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) ||
      CAT_NAMES.some(c => n.includes(c.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
  })

  if (filtered.length === 0) {
    return { species: [] }
  }

  const speciesIds = filtered.map(s => s.id)

  const { data: animals } = await supabase
    .from('animals')
    .select('species_id, breed')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .in('species_id', speciesIds)

  // Try to select FCI metadata; fall back gracefully if columns don't exist yet.
  let breedsData: Array<{
    species_id: string | null
    name_cs: string
    fci_group?: string | null
    original_name?: string | null
    official_abbreviation?: string | null
  }> | null = null

  const withFci = await supabase
    .from('animal_breeds')
    .select('species_id, name_cs, fci_group, original_name, official_abbreviation')
    .in('species_id', speciesIds)
    .order('name_cs')

  if (withFci.error) {
    const fallback = await supabase
      .from('animal_breeds')
      .select('species_id, name_cs')
      .in('species_id', speciesIds)
      .order('name_cs')
    breedsData = fallback.data as typeof breedsData
  } else {
    breedsData = withFci.data as typeof breedsData
  }

  const animalList = animals ?? []

  const speciesCount: Record<string, number> = {}
  for (const a of animalList) {
    if (a.species_id) speciesCount[a.species_id] = (speciesCount[a.species_id] ?? 0) + 1
  }

  const breedCount: Record<string, number> = {}
  for (const a of animalList) {
    if (a.species_id && a.breed) {
      breedCount[`${a.species_id}::${a.breed}`] = (breedCount[`${a.species_id}::${a.breed}`] ?? 0) + 1
    }
  }

  const breedsBySpecies: Record<string, BreedRow[]> = {}
  for (const b of (breedsData ?? [])) {
    if (!b.species_id) continue
    if (!breedsBySpecies[b.species_id]) breedsBySpecies[b.species_id] = []
    const slug = breedSlug(b.name_cs)
    const existing = breedsBySpecies[b.species_id].find(x => x.slug === slug)
    if (existing) {
      if (!existing.fciGroup && b.fci_group) existing.fciGroup = b.fci_group
      if (!existing.originalName && b.original_name) existing.originalName = b.original_name
      if (!existing.officialAbbreviation && b.official_abbreviation) existing.officialAbbreviation = b.official_abbreviation
      continue
    }
    const count = breedCount[`${b.species_id}::${b.name_cs}`] ?? 0
    breedsBySpecies[b.species_id].push({
      name: b.name_cs,
      slug,
      count,
      fciGroup: (b.fci_group ?? null) as string | null,
      originalName: (b.original_name ?? null) as string | null,
      officialAbbreviation: (b.official_abbreviation ?? null) as string | null,
    })
  }
  for (const sid of Object.keys(breedsBySpecies)) {
    breedsBySpecies[sid].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'cs'))
  }

  const species: SpeciesWithBreeds[] = filtered.map(sp => ({
    ...sp,
    animalCount: speciesCount[sp.id] ?? 0,
    breeds: breedsBySpecies[sp.id] ?? [],
  }))
  species.sort((a, b) => b.animalCount - a.animalCount)

  return { species }
}
