import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AnimalCard } from '@/components/public/AnimalCard'
import { AnimalFilter } from '@/components/public/AnimalFilter'
import type { Animal } from '@/types/database'

export const metadata: Metadata = {
  title: 'Adoptovat zvíře | Zozio',
  description: 'Najdi svého nového přítele v útulcích po celé ČR a SR.',
}

interface PageProps {
  searchParams: Promise<{
    species?: string
    city?: string
    size?: string
    urgent?: string
    page?: string
  }>
}

export default async function AdoptPage({ searchParams }: PageProps) {
  const params = await searchParams
  const animals = await getAnimals(params)
  const species = await getSpecies()
  const cities = await getCities()

  return (
    <main className="min-h-screen bg-warm pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Hlavička */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
            🏠 Opuštěná zvířata
          </span>
          <h1 className="font-display font-extrabold text-5xl text-espresso mb-3">
            Zachraňme opuštěná zvířata
          </h1>
          <p className="text-lg text-brown-mid max-w-[520px] mx-auto leading-relaxed">
            Psi, kočky, králíci a další — čekají na domov v útulcích po celé ČR a SR.
          </p>
        </div>

        {/* Filtr */}
        <AnimalFilter species={species} cities={cities} params={params} />

        {/* Výsledky */}
        {animals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="font-display font-bold text-2xl text-espresso mb-2">
              Žádná zvířata nenalezena
            </h3>
            <p className="text-gray">Zkus změnit filtry nebo se podívej jindy.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray mb-6 font-semibold">
              Nalezeno {animals.length} zvířat
            </p>
            <div className="grid grid-cols-3 gap-5">
              {animals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

async function getAnimals(params: {
  species?: string
  city?: string
  size?: string
  urgent?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('animals')
    .select(`
      *,
      institution:institutions(id, name, city, type, slug),
      species:animal_species(id, name_cs, icon)
    `)
    .eq('published', true)
    .eq('adoption_status', 'available')
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })

  if (params.species) query = query.eq('species_id', params.species)
  if (params.size)    query = query.eq('size', params.size)
  if (params.urgent === 'true') query = query.eq('urgent', true)

  const { data, error } = await query

  if (error) {
    console.error('getAnimals error:', error)
    return []
  }

  // City filter — filtrujeme přes instituci
  let animals = (data as Animal[]) ?? []
  if (params.city) {
    animals = animals.filter(a => a.institution?.city === params.city)
  }

  return animals
}

async function getSpecies() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animal_species')
    .select('id, name_cs, icon')
    .eq('category', 'domestic')
    .order('name_cs')
  return data ?? []
}

async function getCities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('institutions')
    .select('city')
    .eq('type', 'shelter')
    .eq('approval_status', 'approved')
  const cities = [...new Set((data ?? []).map(d => d.city))].sort()
  return cities
}
