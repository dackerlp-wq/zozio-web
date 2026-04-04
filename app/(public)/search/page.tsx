import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { SearchInput } from '@/components/public/SearchInput'

export const metadata: Metadata = {
  title: 'Vyhledávání | Zozio',
  description: 'Hledej zvířata k adopci, záchranné případy, útulky a příběhy.',
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query  = q?.trim() ?? ''

  const results = query.length >= 2 ? await search(query) : null

  const totalCount = results
    ? results.animals.length + results.rescueCases.length + results.institutions.length + results.articles.length
    : 0

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[800px] mx-auto px-5 md:px-10 pb-16">

        {/* Searchbar */}
        <div className="py-8 md:py-12">
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-6"
            style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            {query ? `Výsledky pro „${query}"` : 'Vyhledávání'}
          </h1>
          <SearchInput initialValue={query} />
          {query.length >= 2 && (
            <p className="text-sm mt-3" style={{ color: '#8B6550' }}>
              {totalCount === 0
                ? 'Žádné výsledky'
                : `Nalezeno ${totalCount} výsledků`}
            </p>
          )}
        </div>

        {/* Prázdný stav */}
        {!query && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-base font-semibold text-[#1A0F0A] mb-2">Co hledáš?</p>
            <p className="text-sm" style={{ color: '#8B6550' }}>
              Zadej jméno zvířete, útulku, města nebo druh.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Labrador', 'Praha', 'Výr velký', 'Sova', 'Lišák', 'Kočka'].map(s => (
                <Link key={s} href={`/search?q=${encodeURIComponent(s)}`}
                  className="px-4 py-2 rounded-full text-sm font-semibold no-underline border hover:opacity-80 transition-all"
                  style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>
                  {s}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Krátký dotaz */}
        {query && query.length < 2 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#8B6550' }}>Zadej alespoň 2 znaky.</p>
          </div>
        )}

        {/* Výsledky */}
        {results && totalCount === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">😔</div>
            <p className="font-bold text-xl text-[#1A0F0A] mb-2">Nic jsme nenašli</p>
            <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
              Zkus jiné slovo nebo se podívej na celý katalog.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/adopt" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline"
                style={{ background: '#E8634A' }}>
                Zvířata k adopci
              </Link>
              <Link href="/rescue" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline"
                style={{ background: '#2E9E8F' }}>
                Záchranné stanice
              </Link>
            </div>
          </div>
        )}

        {results && totalCount > 0 && (
          <div className="space-y-10">

            {/* ── Zvířata k adopci ── */}
            {results.animals.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-[#1A0F0A] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: '#FAECE7' }}>🐾</span>
                    Zvířata k adopci
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#FAECE7', color: '#993C1D' }}>
                      {results.animals.length}
                    </span>
                  </h2>
                  <Link href={`/adopt?q=${encodeURIComponent(query)}`}
                    className="text-xs font-bold no-underline hover:opacity-70"
                    style={{ color: '#E8634A' }}>
                    Zobrazit vše →
                  </Link>
                </div>
                <div className="space-y-2">
                  {results.animals.map((a: any) => (
                    <Link key={a.id} href={`/animals/${a.id}`} className="no-underline group">
                      <div className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-0.5 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative"
                          style={{ background: '#FAECE7' }}>
                          {a.primary_photo
                            ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">
                                {a.species?.icon ?? '🐾'}
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#1A0F0A] truncate">{a.name}</div>
                          <div className="text-xs mt-0.5 truncate" style={{ color: '#8B6550' }}>
                            {[a.species?.name_cs, a.breed, a.institution?.city].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        {a.urgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: '#E8634A', color: 'white' }}>Urgentní</span>
                        )}
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}>
                          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Záchranné případy ── */}
            {results.rescueCases.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-[#1A0F0A] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: '#E1F5EE' }}>🦉</span>
                    Záchranné případy
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                      {results.rescueCases.length}
                    </span>
                  </h2>
                  <Link href={`/rescue`} className="text-xs font-bold no-underline hover:opacity-70"
                    style={{ color: '#2E9E8F' }}>
                    Záchranné stanice →
                  </Link>
                </div>
                <div className="space-y-2">
                  {results.rescueCases.map((c: any) => {
                    const statusLabel: Record<string, string> = {
                      intake: 'Příjem', treatment: 'Léčba',
                      rehabilitation: 'Rehabilitace', released: 'Propuštěno',
                    }
                    return (
                      <Link key={c.id} href={`/rescue/${c.id}`} className="no-underline group">
                        <div className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-[#F0EDE8] hover:border-[#2E9E8F]/40 hover:-translate-y-0.5 transition-all">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative"
                            style={{ background: '#E1F5EE' }}>
                            {c.primary_photo
                              ? <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl">
                                  {c.species?.icon ?? '🐾'}
                                </div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#1A0F0A] truncate">{c.name ?? c.case_number}</div>
                            <div className="text-xs mt-0.5 truncate" style={{ color: '#8B6550' }}>
                              {[c.species?.name_cs, c.institution?.name].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          {c.status && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                              {statusLabel[c.status] ?? c.status}
                            </span>
                          )}
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}>
                            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Útulky a stanice ── */}
            {results.institutions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-[#1A0F0A] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: '#F1EFE8' }}>🏠</span>
                    Útulky a záchranné stanice
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#F1EFE8', color: '#5F5E5A' }}>
                      {results.institutions.length}
                    </span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {results.institutions.map((i: any) => (
                    <Link key={i.id} href={`/institutions/${i.slug}`} className="no-underline group">
                      <div className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-0.5 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl"
                          style={{ background: i.type === 'shelter' ? '#FAECE7' : '#E1F5EE' }}>
                          {i.logo_url
                            ? <Image src={i.logo_url} alt={i.name} width={56} height={56} className="object-cover" />
                            : i.type === 'shelter' ? '🏠' : '🚑'
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#1A0F0A] truncate">{i.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>
                            📍 {i.city} · {i.type === 'shelter' ? 'Útulek' : 'Záchranná stanice'}
                          </div>
                        </div>
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}>
                          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Příběhy ── */}
            {results.articles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-[#1A0F0A] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: '#FAEEDA' }}>📖</span>
                    Příběhy
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#FAEEDA', color: '#854F0B' }}>
                      {results.articles.length}
                    </span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {results.articles.map((a: any) => (
                    <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                      <div className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-0.5 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center"
                          style={{ background: '#FAEEDA' }}>
                          {a.cover_url
                            ? <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                            : <span className="text-2xl">📖</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#1A0F0A] truncate">{a.title}</div>
                          {a.perex && (
                            <div className="text-xs mt-0.5 line-clamp-1" style={{ color: '#8B6550' }}>
                              {a.perex}
                            </div>
                          )}
                        </div>
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}>
                          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </main>
  )
}

/* ── Hledání ── */
async function search(q: string) {
  const supabase = await createClient()
  const like     = `%${q}%`

  const [animals, rescueCases, institutions, articles] = await Promise.all([
    // Zvířata — jméno, plemeno, popis
    supabase
      .from('animals')
      .select('id, name, breed, primary_photo, urgent, species:animal_species(name_cs,icon), institution:institutions(name,city)')
      .eq('published', true)
      .eq('adoption_status', 'available')
      .or(`name.ilike.${like},breed.ilike.${like},description.ilike.${like}`)
      .order('urgent', { ascending: false })
      .limit(8),

    // Záchranné případy — jméno, příčina, popis
    supabase
      .from('rescue_cases')
      .select('id, name, case_number, status, primary_photo, species:animal_species(name_cs,icon), institution:institutions(name,city)')
      .eq('published', true)
      .not('status', 'in', '("deceased")')
      .or(`name.ilike.${like},cause_of_injury.ilike.${like},public_description.ilike.${like},case_number.ilike.${like}`)
      .limit(6),

    // Instituce — název, město, popis
    supabase
      .from('institutions')
      .select('id, name, slug, city, type, logo_url')
      .eq('approval_status', 'approved')
      .or(`name.ilike.${like},city.ilike.${like},description.ilike.${like}`)
      .limit(5),

    // Články — název, perex
    supabase
      .from('articles')
      .select('id, title, slug, perex, cover_url')
      .eq('published', true)
      .or(`title.ilike.${like},perex.ilike.${like}`)
      .limit(5),
  ])

  return {
    animals:      animals.data      ?? [],
    rescueCases:  rescueCases.data  ?? [],
    institutions: institutions.data ?? [],
    articles:     articles.data     ?? [],
  }
}
