import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = {
  title: 'Katalog ras a druhů zvířat | Zozio',
  description: 'Přehled všech druhů a ras zvířat k adopci na Zozio — psi, kočky, exotická zvířata a další. Najdi svého nového mazlíčka.',
}

export const revalidate = 3600

interface SpeciesWithBreeds {
  id: string
  name_cs: string
  icon: string | null
  animalCount: number
  breeds: { name: string; count: number }[]
}

export default async function KatalogPage() {
  const { species, breedsBySpecies } = await getData()

  const total = species.reduce((s, sp) => s + sp.animalCount, 0)

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="py-8 md:py-10 border-b border-[#F0EDE8] mb-10">
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-2"
            style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            Katalog ras a druhů zvířat
          </h1>
          <p className="text-sm md:text-base mb-4" style={{ color: '#6B4030' }}>
            Přehled všech druhů a ras zvířat hledajících domov na Zozio
          </p>
          <div className="flex flex-wrap gap-3">
            <Stat label="druhů zvířat" value={species.filter(s => s.animalCount > 0).length} />
            <Stat label="ras v databázi" value={species.reduce((n, s) => n + s.breeds.length, 0)} />
            <Stat label="zvířat k adopci" value={total} color="#E8634A" />
          </div>
        </div>

        {/* Species sections */}
        <div className="space-y-12">
          {species.map(sp => (
            <section key={sp.id}>
              {/* Species header */}
              <div className="flex items-center gap-3 mb-5">
                {sp.icon && <span className="text-3xl">{sp.icon}</span>}
                <div className="flex-1">
                  <h2 className="font-display font-extrabold text-[#1A0F0A] text-xl md:text-2xl">
                    {sp.name_cs}
                  </h2>
                </div>
                {sp.animalCount > 0 && (
                  <Link
                    href={`/adopt?species=${sp.id}`}
                    className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold text-white no-underline hover:opacity-90 transition-opacity"
                    style={{ background: '#E8634A' }}>
                    {sp.animalCount} k adopci →
                  </Link>
                )}
              </div>

              {/* Breeds grid */}
              {sp.breeds.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {sp.breeds.map(breed => (
                    <Link
                      key={breed.name}
                      href={`/adopt?species=${sp.id}&breed=${encodeURIComponent(breed.name)}`}
                      className="group flex items-center justify-between gap-2 px-3.5 py-3 rounded-lg border border-[#F0EDE8] bg-white hover:border-[#E8634A] hover:shadow-sm transition-all no-underline">
                      <span className="text-sm font-semibold text-[#1A0F0A] group-hover:text-[#E8634A] transition-colors leading-snug">
                        {breed.name}
                      </span>
                      {breed.count > 0 && (
                        <span className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#FBF0EC', color: '#E8634A' }}>
                          {breed.count}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: '#A08070' }}>
                  Pro tento druh zatím nejsou evidovány žádné rasy.
                </p>
              )}

              {/* No animals notice */}
              {sp.animalCount === 0 && (
                <p className="text-xs mt-3" style={{ color: '#A08070' }}>
                  Momentálně žádná zvířata tohoto druhu nečekají na adopci.
                </p>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-xl text-center" style={{ background: '#FBF0EC' }}>
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

async function getData(): Promise<{ species: SpeciesWithBreeds[]; breedsBySpecies: Record<string, { name: string; count: number }[]> }> {
  const supabase = createServiceClient()

  // Fetch all species
  const { data: speciesData } = await supabase
    .from('animal_species')
    .select('id, name_cs, icon')
    .order('name_cs')

  // Fetch available animals with species_id and breed
  const { data: animals } = await supabase
    .from('animals')
    .select('species_id, breed')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .not('species_id', 'is', null)

  // Fetch all breeds from animal_breeds table
  const { data: breedsData } = await supabase
    .from('animal_breeds')
    .select('species_id, name_cs')
    .order('name_cs')

  const animalList = animals ?? []

  // Count animals per species
  const speciesCount: Record<string, number> = {}
  for (const a of animalList) {
    if (a.species_id) speciesCount[a.species_id] = (speciesCount[a.species_id] ?? 0) + 1
  }

  // Count animals per breed (per species)
  type BreedKey = string // "speciesId::breedName"
  const breedCount: Record<BreedKey, number> = {}
  for (const a of animalList) {
    if (a.species_id && a.breed) {
      const key = `${a.species_id}::${a.breed}`
      breedCount[key] = (breedCount[key] ?? 0) + 1
    }
  }

  // Build breed sets per species from animal_breeds table
  // then enrich with counts from actual animals
  const breedsBySpecies: Record<string, { name: string; count: number }[]> = {}
  for (const b of (breedsData ?? [])) {
    if (!b.species_id) continue
    if (!breedsBySpecies[b.species_id]) breedsBySpecies[b.species_id] = []
    const count = breedCount[`${b.species_id}::${b.name_cs}`] ?? 0
    breedsBySpecies[b.species_id].push({ name: b.name_cs, count })
  }
  // Also add breeds that appear in animals but not in animal_breeds table
  for (const a of animalList) {
    if (!a.species_id || !a.breed) continue
    const list = breedsBySpecies[a.species_id] ?? []
    if (!list.find(b => b.name === a.breed)) {
      list.push({ name: a.breed, count: breedCount[`${a.species_id}::${a.breed}`] ?? 1 })
      breedsBySpecies[a.species_id] = list
    }
  }
  // Sort breeds by count desc, then alpha
  for (const sid of Object.keys(breedsBySpecies)) {
    breedsBySpecies[sid].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'cs'))
  }

  const species: SpeciesWithBreeds[] = (speciesData ?? []).map(sp => ({
    ...sp,
    animalCount: speciesCount[sp.id] ?? 0,
    breeds: breedsBySpecies[sp.id] ?? [],
  }))
  // Sort: species with animals first
  species.sort((a, b) => b.animalCount - a.animalCount)

  return { species, breedsBySpecies }
}
