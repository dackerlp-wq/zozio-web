import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sbírky | Zozio',
  description: 'Podpoř zvířata v útulcích a záchranných stanicích.',
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

  const items = (fundraisers ?? []) as any[]

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6">

        <div className="text-center mb-10 md:mb-12">
          <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
            💛 Sbírky
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-espresso mb-3 leading-tight">
            Pomoz konkrétním zvířatům
          </h1>
          <p className="text-base md:text-lg text-brown-mid max-w-[480px] mx-auto leading-relaxed">
            Každý příspěvek jde přímo na léčbu nebo péči pro konkrétní zvíře.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💛</div>
            <p className="font-display font-bold text-xl text-gray">Zatím žádné aktivní sbírky</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {items.map((f: any) => {
              const percent = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
              const isShelter = f.institution?.type === 'shelter'
              const animal = f.animal ?? f.rescue_case
              const icon = animal?.species?.icon ?? '🐾'
              const animalName = animal?.name ?? animal?.case_number ?? null

              return (
                <div key={f.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className={`h-28 md:h-32 flex items-center justify-center text-5xl md:text-6xl
                    ${isShelter
                      ? 'bg-gradient-to-br from-sand to-coral-light'
                      : 'bg-gradient-to-br from-rescue-bg to-rescue-light/40'
                    }`}>
                    {icon}
                  </div>
                  <div className="p-4 md:p-5">
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5
                      ${isShelter ? 'text-coral' : 'text-rescue'}`}>
                      {isShelter ? '🏠' : '🚑'} {f.institution?.name} · {f.institution?.city}
                    </div>
                    <h3 className="font-display font-extrabold text-base md:text-lg text-espresso mb-1 leading-tight">
                      {f.title}
                    </h3>
                    {animalName && (
                      <p className="text-xs text-gray mb-2 font-semibold">Pro: {animalName}</p>
                    )}
                    {f.description && (
                      <p className="text-sm text-brown-mid leading-relaxed mb-4 line-clamp-2">{f.description}</p>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-espresso">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                        <span className="text-gray text-xs">z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-pale rounded-pill overflow-hidden">
                        <div
                          className={`h-full rounded-pill transition-all ${isShelter ? 'bg-coral' : 'bg-rescue'}`}
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
