import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from './SearchInput'

export const metadata: Metadata = {
  title: 'Vyhledávání | Zozio',
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const [animals, institutions] = query.length >= 2
    ? await Promise.all([searchAnimals(query), searchInstitutions(query)])
    : [[], []]

  const total = animals.length + institutions.length

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6">

        {/* Hledací pole */}
        <div className="max-w-[620px] mx-auto mb-10 md:mb-12">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso text-center mb-6">
            Vyhledávání
          </h1>
          <SearchInput defaultValue={query} />
        </div>

        {/* Výsledky */}
        {query.length >= 2 ? (
          <>
            {total === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-display font-bold text-xl text-espresso mb-2">
                  Nic nenalezeno pro „{query}"
                </h3>
                <p className="text-gray text-sm">Zkus jiný výraz nebo prohlédni celý katalog.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Link href="/adopt" className="text-coral font-bold hover:text-coral-dark transition-colors">
                    → Zvířata k adopci
                  </Link>
                  <Link href="/institutions" className="text-coral font-bold hover:text-coral-dark transition-colors">
                    → Adresář útulků
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray mb-8 font-semibold">
                  Nalezeno {total} výsledků pro „{query}"
                </p>

                {/* Zvířata */}
                {animals.length > 0 && (
                  <section className="mb-10">
                    <h2 className="font-display font-extrabold text-2xl text-espresso mb-5">
                      🐾 Zvířata ({animals.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {animals.map((animal: any) => (
                        <Link key={animal.id} href={`/animals/${animal.id}`} className="no-underline">
                          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-pale hover:-translate-y-1 hover:shadow-md transition-all">
                            <div className="relative h-40 bg-gradient-to-br from-sand to-coral-light">
                              {animal.primary_photo ? (
                                <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">
                                  {animal.species?.icon ?? '🐾'}
                                </div>
                              )}
                              {animal.urgent && <Badge variant="urgent" className="absolute top-2 left-2" />}
                            </div>
                            <div className="p-3">
                              <div className="font-display font-bold text-base text-espresso">{animal.name}</div>
                              <div className="text-xs text-gray">
                                {animal.species?.name_cs} · {animal.institution?.city}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Instituce */}
                {institutions.length > 0 && (
                  <section>
                    <h2 className="font-display font-extrabold text-2xl text-espresso mb-5">
                      🏠 Instituce ({institutions.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {institutions.map((inst: any) => (
                        <Link key={inst.id} href={`/institutions/${inst.slug}`} className="no-underline">
                          <div className="bg-white rounded-lg p-5 border border-gray-pale hover:-translate-y-1 hover:shadow-md transition-all">
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[10px] font-bold mb-3
                              ${inst.type === 'shelter' ? 'bg-shelter-bg text-shelter-dark' : 'bg-rescue-bg text-rescue-dark'}`}>
                              {inst.type === 'shelter' ? '🏠 Útulok' : '🚑 Záchranná st.'}
                            </div>
                            <div className="font-display font-bold text-lg text-espresso mb-1">{inst.name}</div>
                            <div className="text-xs text-gray">📍 {inst.city}</div>
                            {inst.short_description && (
                              <div className="text-sm text-brown-mid mt-2 line-clamp-2">{inst.short_description}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        ) : (
          /* Prázdný stav — nápověda */
          <div className="max-w-[500px] mx-auto text-center">
            <p className="text-gray mb-8 font-semibold">Zadej alespoň 2 znaky pro vyhledávání</p>
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { href: '/adopt?urgent=true', icon: '🆘', label: 'Urgentní adopce' },
                { href: '/adopt',             icon: '🐕', label: 'Psi k adopci' },
                { href: '/rescue',            icon: '🦉', label: 'Záchranné stanice' },
                { href: '/fundraisers',       icon: '💛', label: 'Aktivní sbírky' },
              ].map(({ href, icon, label }) => (
                <Link key={label} href={href} className="no-underline">
                  <div className="bg-white rounded-lg p-4 border border-gray-pale hover:border-coral hover:-translate-y-0.5 transition-all flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-display font-bold text-sm text-espresso">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

async function searchAnimals(q: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animals')
    .select('id, name, primary_photo, urgent, adoption_status, species:animal_species(name_cs,icon), institution:institutions(name,city,slug)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .or(`name.ilike.%${q}%,breed.ilike.%${q}%,color.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(12)
  return data ?? []
}

async function searchInstitutions(q: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('institutions')
    .select('id, name, slug, type, city, short_description')
    .eq('approval_status', 'approved')
    .or(`name.ilike.%${q}%,city.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(9)
  return data ?? []
}
