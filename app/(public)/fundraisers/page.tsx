import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sbírky | Zozio',
  description: 'Podpoř zvířata v útulcích a záchranných stanicích. Aktivní sbírky pro konkrétní zvířata.',
}

export default async function FundraisersPage() {
  const supabase = await createClient()

  const { data: fundraisers } = await supabase
    .from('fundraisers')
    .select(`
      *,
      institution:institutions(name, type, city, slug),
      animal:animals(name, species:animal_species(icon)),
      rescue_case:rescue_cases(name, case_number, species:animal_species(icon))
    `)
    .eq('active', true)
    .order('created_at', { ascending: false })

  const items = fundraisers ?? []

  return (
    <main className="min-h-screen bg-warm pt-24 pb-20">
      <div className="max-w-[1100px] mx-auto px-6">

        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
            💛 Sbírky
          </span>
          <h1 className="font-display font-extrabold text-5xl text-espresso mb-3">
            Pomoz konkrétním zvířatům
          </h1>
          <p className="text-lg text-brown-mid max-w-[480px] mx-auto leading-relaxed">
            Každý příspěvek jde přímo na léčbu, péči nebo vybavení pro konkrétní zvíře nebo instituci.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💛</div>
            <p className="font-display font-bold text-xl text-gray">Zatím žádné aktivní sbírky</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {items.map((f: any) => {
              const percent = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
              const isShelter = f.institution?.type === 'shelter'
              const animal = f.animal ?? f.rescue_case
              const icon = (animal?.species?.icon) ?? '🐾'
              const animalName = animal?.name ?? animal?.case_number ?? null

              return (
                <div key={f.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className={`h-32 flex items-center justify-center text-6xl
                    ${isShelter ? 'bg-gradient-to-br from-sand to-coral-light' : 'bg-gradient-to-br from-rescue-bg to-rescue-light/40'}`}>
                    {icon}
                  </div>
                  <div className="p-5">
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5
                      ${isShelter ? 'text-coral' : 'text-rescue'}`}>
                      {isShelter ? '🏠' : '🚑'} {f.institution?.name} · {f.institution?.city}
                    </div>
                    <h3 className="font-display font-extrabold text-lg text-espresso mb-1">
                      {f.title}
                    </h3>
                    {animalName && (
                      <p className="text-xs text-gray mb-2 font-semibold">Pro: {animalName}</p>
                    )}
                    {f.description && (
                      <p className="text-sm text-brown-mid leading-relaxed mb-4 line-clamp-2">
                        {f.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-espresso">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                        <span className="text-gray">z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-pale rounded-pill overflow-hidden">
                        <div
                          className={`h-full rounded-pill ${isShelter ? 'bg-coral' : 'bg-rescue'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className={`text-xs font-bold mt-1 ${isShelter ? 'text-coral' : 'text-rescue'}`}>
                        {percent}% vybráno
                      </div>
                    </div>

                    <button className={`w-full py-3 rounded-pill font-display font-bold text-sm text-white transition-all hover:-translate-y-0.5 cursor-pointer border-none
                      ${isShelter ? 'bg-coral hover:bg-coral-dark' : 'bg-rescue hover:bg-rescue-dark'}`}>
                      💛 Přispět
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
