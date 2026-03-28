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
    city?:    string
    size?:    string
    urgent?:  string
    q?:       string
  }>
}

export default async function AdoptPage({ searchParams }: PageProps) {
  const params  = await searchParams
  const animals = await getAnimals(params)
  const species = await getSpecies()
  const cities  = await getCities()

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">

        <div className="text-center mb-8 md:mb-10">
          <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-3">
            🏠 Opuštěná zvířata
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-espresso mb-3">
            Zachraňme opuštěná zvířata
          </h1>
          <p className="text-base md:text-lg text-brown-mid max-w-[520px] mx-auto leading-relaxed">
            Psi, kočky, králíci a další — čekají na domov v útulcích po celé ČR a SR.
          </p>
        </div>

        <AnimalFilter species={species} cities={cities} params={params} />

        {animals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🐾</div>
            <h3 className="font-display font-bold text-xl text-espresso mb-2">
              Žádná zvířata nenalezena
            </h3>
            <p className="text-gray text-sm">Zkus změnit filtry nebo se podívej jindy.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray mb-5 font-semibold">
              Nalezeno {animals.length} zvířat
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {animals.map(animal => (
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
  city?:    string
  size?:    string
  urgent?:  string
  q?:       string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('animals')
    .select('*, institution:institutions(id,name,city,type,slug), species:animal_species(id,name_cs,icon)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    // ── FIX 6: Skryj zvířata v karanténě ────────────────────────────────
    .neq('in_quarantine', true)
    .order('urgent',     { ascending: false })
    .order('created_at', { ascending: false })

  if (params.species) query = query.eq('species_id', params.species)
  if (params.size)    query = query.eq('size', params.size)
  if (params.urgent === 'true') query = query.eq('urgent', true)

  // ── FIX 7: Vyhledávání podle jména ──────────────────────────────────
  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,breed.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }

  const { data, error } = await query
  if (error) { console.error('getAnimals error:', error); return [] }

  let animals = (data as Animal[]) ?? []
  if (params.city) {
    animals = animals.filter(a => (a.institution as any)?.city === params.city)
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
  return [...new Set((data ?? []).map(d => d.city))].sort()
}
