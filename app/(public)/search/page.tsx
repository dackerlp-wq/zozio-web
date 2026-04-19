import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { SearchInput } from '@/components/public/SearchInput'

/* ── Query-specific types ── */
interface SearchAnimal {
  id: string
  name: string
  breed: string | null
  primary_photo: string | null
  urgent: boolean
  species: { name_cs: string; icon: string | null } | null
  institution: { name: string; city: string } | null
}

interface SearchInstitution {
  id: string
  name: string
  slug: string
  city: string
  type: string
  logo_url: string | null
}

interface SearchArticle {
  id: string
  title: string
  slug: string
  perex: string | null
  cover_url: string | null
}

interface SearchResults {
  animals: SearchAnimal[]
  institutions: SearchInstitution[]
  articles: SearchArticle[]
}

export const metadata: Metadata = {
  title: 'Vyhledávání | Zozio',
  description: 'Hledej zvířata k adopci, útulky a příběhy.',
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query  = q?.trim() ?? ''

  const results: SearchResults | null = query.length >= 2 ? await search(query) : null

  const totalCount = results
    ? results.animals.length + results.institutions.length + results.articles.length
    : 0

  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[800px] mx-auto px-5 md:px-10 pb-16">

        {/* Searchbar */}
        <div className="py-8 md:py-12">
          <h1 className="font-display font-extrabold text-text-primary mb-6"
            style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            {query ? `Výsledky pro „${query}"` : 'Vyhledávání'}
          </h1>
          <SearchInput initialValue={query} />
          {query.length >= 2 && (
            <p className="text-sm mt-3 text-text-muted">
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
            <p className="text-base font-semibold text-text-primary mb-2">Co hledáš?</p>
            <p className="text-sm text-text-muted">
              Zadej jméno zvířete, útulku, města nebo druh.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Labrador', 'Praha', 'Kočka', 'Králík', 'Fretka', 'Morče'].map(s => (
                <Link key={s} href={`/search?q=${encodeURIComponent(s)}`}
                  className="px-4 py-2 rounded-full text-sm font-semibold no-underline border hover:opacity-80 transition-all"
                  style={{ borderColor: '#E0DDD8', color: 'var(--text-body)', background: 'white' }}>
                  {s}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Krátký dotaz */}
        {query && query.length < 2 && (
          <div className="text-center py-12">
            <p className="text-sm text-text-muted">Zadej alespoň 2 znaky.</p>
          </div>
        )}

        {/* Výsledky */}
        {results && totalCount === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">😔</div>
            <p className="font-bold text-xl text-text-primary mb-2">Nic jsme nenašli</p>
            <p className="text-sm mb-6 text-text-muted">
              Zkus jiné slovo nebo se podívej na celý katalog.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/adopt" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline bg-coral">
                Zvířata k adopci
              </Link>
              <Link href="/institutions" className="px-5 py-2.5 rounded-xl font-bold text-sm no-underline border"
                style={{ color: '#1A0F0A', borderColor: '#E0DDD8', background: 'white' }}>
                Útulky
              </Link>
            </div>
          </div>
        )}

        {results && totalCount > 0 && (
          <div aria-live="polite" aria-label="Výsledky hledání" className="space-y-10">

            {/* ── Zvířata k adopci ── */}
            {results.animals.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: 'var(--coral-tag-bg)' }}>🐾</span>
                    Zvířata k adopci
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--coral-tag-bg)', color: 'var(--coral-tag-text)' }}>
                      {results.animals.length}
                    </span>
                  </h2>
                  <Link href={`/adopt?q=${encodeURIComponent(query)}`}
                    className="text-xs font-bold no-underline hover:opacity-70"
                    style={{ color: 'var(--coral)' }}>
                    Zobrazit vše →
                  </Link>
                </div>
                <div className="space-y-2">
                  {results.animals.map((a: SearchAnimal) => (
                    <Link key={a.id} href={`/animals/${a.id}`} className="no-underline group">
                      <div className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-border hover:border-coral/40 hover:-translate-y-0.5 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative"
                          style={{ background: 'var(--coral-tag-bg)' }}>
                          {a.primary_photo
                            ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">
                                {a.species?.icon ?? '🐾'}
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-text-primary truncate">{a.name}</div>
                          <div className="text-xs mt-0.5 truncate text-text-muted">
                            {[a.species?.name_cs, a.breed, a.institution?.city].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        {a.urgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'var(--coral)', color: 'white' }}>Urgentní</span>
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

            {/* ── Útulky ── */}
            {results.institutions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: 'var(--border)' }}>🏠</span>
                    Útulky
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--border)', color: 'var(--text-neutral)' }}>
                      {results.institutions.length}
                    </span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {results.institutions.map((i: SearchInstitution) => (
                    <Link key={i.id} href={`/institutions/${i.slug}`} className="no-underline group">
                      <div className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-border hover:border-coral/40 hover:-translate-y-0.5 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl"
                          style={{ background: 'var(--coral-tag-bg)' }}>
                          {i.logo_url
                            ? <Image src={i.logo_url} alt={i.name} width={56} height={56} className="object-cover" />
                            : '🏠'
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-text-primary truncate">{i.name}</div>
                          <div className="text-xs mt-0.5 text-text-muted">
                            📍 {i.city} · Útulek
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
                  <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: 'var(--warning-tag-bg)' }}>📖</span>
                    Příběhy
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' }}>
                      {results.articles.length}
                    </span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {results.articles.map((a: SearchArticle) => (
                    <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                      <div className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-border hover:border-coral/40 hover:-translate-y-0.5 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center"
                          style={{ background: 'var(--warning-tag-bg)' }}>
                          {a.cover_url
                            ? <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                            : <span className="text-2xl">📖</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-text-primary truncate">{a.title}</div>
                          {a.perex && (
                            <div className="text-xs mt-0.5 line-clamp-1 text-text-muted">
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
async function search(q: string): Promise<SearchResults> {
  const supabase = await createClient()
  const like     = `%${q}%`

  const [animals, institutions, articles] = await Promise.all([
    // Zvířata — jméno, plemeno, popis
    supabase
      .from('animals')
      .select('id, name, breed, primary_photo, urgent, species:animal_species(name_cs,icon), institution:institutions(name,city)')
      .eq('published', true)
      .eq('adoption_status', 'available')
      .or(`name.ilike.${like},breed.ilike.${like},description.ilike.${like}`)
      .order('urgent', { ascending: false })
      .limit(8),

    // Útulky — název, město, popis
    supabase
      .from('institutions')
      .select('id, name, slug, city, type, logo_url')
      .eq('approval_status', 'approved')
      .eq('type', 'shelter')
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
    animals:      (animals.data      ?? []) as unknown as SearchAnimal[],
    institutions: (institutions.data ?? []) as unknown as SearchInstitution[],
    articles:     (articles.data     ?? []) as unknown as SearchArticle[],
  }
}
