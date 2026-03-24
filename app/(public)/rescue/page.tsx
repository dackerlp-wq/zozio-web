import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { RescueCard } from '@/components/public/RescueCard'
import { RescueFilter } from '@/components/public/RescueFilter'
import type { RescueCase } from '@/types/database'

export const metadata: Metadata = {
  title: 'Záchranné stanice | Zozio',
  description: 'Zachraňme ohrožená volně žijící zvířata. Podpoř záchranné stanice po celé ČR a SR.',
}

interface PageProps {
  searchParams: Promise<{ species?: string; status?: string; city?: string }>
}

export default async function RescuePage({ searchParams }: PageProps) {
  const params = await searchParams
  const cases = await getRescueCases(params)
  const species = await getWildSpecies()
  const cities = await getRescueCities()

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">

        <div className="text-center mb-8 md:mb-10">
          <span className="inline-flex items-center gap-1.5 bg-rescue-bg text-rescue-dark font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-3">
            🚑 Ohrožená zvířata
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-espresso mb-3">
            Zachraňme ohrožená zvířata
          </h1>
          <p className="text-base md:text-lg text-brown-mid max-w-[520px] mx-auto leading-relaxed">
            Sovy, lišky, vydry a další volně žijící zvířata potřebují léčbu a tvoji pomoc.
          </p>
        </div>

        <RescueFilter species={species} cities={cities} params={params} />

        {cases.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🦉</div>
            <h3 className="font-display font-bold text-xl text-espresso mb-2">Žádné případy nenalezeny</h3>
            <p className="text-gray">Zkus změnit filtry.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray mb-5 font-semibold">Nalezeno {cases.length} případů</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {cases.map(c => <RescueCard key={c.id} rescueCase={c} />)}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

async function getRescueCases(params: { species?: string; status?: string; city?: string }) {
  const supabase = await createClient()
  let query = supabase
    .from('rescue_cases')
    .select('*, institution:institutions(id,name,city,type,slug), species:animal_species(id,name_cs,icon)')
    .eq('published', true)
    .not('status', 'in', '("deceased")')
    .order('created_at', { ascending: false })

  if (params.species) query = query.eq('species_id', params.species)
  if (params.status)  query = query.eq('status', params.status)

  const { data, error } = await query
  if (error) return []
  let cases = (data as RescueCase[]) ?? []
  if (params.city) cases = cases.filter(c => (c.institution as any)?.city === params.city)
  return cases
}

async function getWildSpecies() {
  const supabase = await createClient()
  const { data } = await supabase.from('animal_species').select('id,name_cs,icon').eq('category','wild').order('name_cs')
  return data ?? []
}

async function getRescueCities() {
  const supabase = await createClient()
  const { data } = await supabase.from('institutions').select('city').eq('type','rescue_station').eq('approval_status','approved')
  return [...new Set((data ?? []).map(d => d.city))].sort()
}
