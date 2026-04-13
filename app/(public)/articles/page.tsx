import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleInstitutionFilter } from '@/components/public/ArticleInstitutionFilter'

export const metadata: Metadata = {
  title: 'Příběhy adopcí a záchran | Zozio',
  description: 'Čtěte příběhy úspěšných adopcí a záchran zvířat z celé ČR a SR.',
}

interface PageProps {
  searchParams: Promise<{ kategorie?: string; instituce?: string }>
}

const categoryLabel: Record<string, string> = {
  story:  '🐾 Příběh adopce',
  rescue: '🦉 Záchranný příběh',
  tips:   '💡 Tipy',
  news:   '📰 Novinky',
}

const categoryColor: Record<string, string> = {
  story:  'bg-coral-light text-coral-dark',
  rescue: 'bg-rescue-bg text-rescue-dark',
  tips:   'bg-amber-light text-warning',
  news:   'bg-sand text-brown-mid',
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { kategorie, instituce } = await searchParams
  const supabase = await createClient()

  // Načti články s institucí
  let query = supabase
    .from('articles')
    .select(`
      id, title, slug, perex, cover_url, category,
      author_name, published_at, views,
      institution:institutions(id, name, slug, type, logo_url)
    `)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(24)

  if (kategorie) query = query.eq('category', kategorie)
  if (instituce)  query = query.eq('institution_id', instituce)

  const { data: articles } = await query

  // Načti instituce pro filtr (jen ty co mají aspoň 1 publikovaný článek)
  const { data: institutionsRaw } = await supabase
    .from('articles')
    .select('institution:institutions(id, name)')
    .eq('published', true)
    .not('institution_id', 'is', null)

  // Deduplikuj instituce
  const instMap = new Map<string, { id: string; name: string }>()
  for (const row of institutionsRaw ?? []) {
    const inst = row.institution as unknown as { id: string; name: string } | null
    if (inst?.id) instMap.set(inst.id, inst)
  }
  const institutions = Array.from(instMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'cs'))

  const items = articles ?? []
  const hasFilters = !!(kategorie || instituce)

  // URL helper pro filtry
  const filterUrl = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged = { kategorie, instituce, ...params }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    const str = p.toString()
    return `/articles${str ? `?${str}` : ''}`
  }

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6">

        {/* Hero */}
        <div className="text-center mb-8 md:mb-10">
          <span className="inline-flex items-center gap-1.5 bg-coral-light text-coral-dark font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
            📖 Příběhy
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-2 leading-tight">
            Příběhy, které zahřejí srdce
          </h1>
          <p className="text-sm md:text-base text-brown-mid max-w-[520px] leading-relaxed">
            Adopce, záchranné příběhy a novinky ze světa útulků a záchranných stanic.
          </p>
        </div>

        {/* Filtry */}
        <div className="flex flex-wrap gap-2 mb-8 items-center">

          {/* Kategorie */}
          <div className="flex flex-wrap gap-1.5">
            <Link href={filterUrl({ kategorie: undefined })}
              className={`inline-flex items-center px-3 py-1.5 rounded-pill text-xs font-bold border transition-all no-underline ${
                !kategorie
                  ? 'bg-espresso text-white border-espresso'
                  : 'bg-white text-text-muted border-border hover:border-espresso hover:text-espresso'
              }`}>
              Vše
            </Link>
            {Object.entries(categoryLabel).map(([key, label]) => (
              <Link key={key} href={filterUrl({ kategorie: key })}
                className={`inline-flex items-center px-3 py-1.5 rounded-pill text-xs font-bold border transition-all no-underline ${
                  kategorie === key
                    ? `${categoryColor[key]} border-transparent`
                    : 'bg-white text-text-muted border-border hover:border-espresso hover:text-espresso'
                }`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Oddělovač */}
          {institutions.length > 0 && (
            <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
          )}

          {/* Instituce */}
          {institutions.length > 0 && (
            <ArticleInstitutionFilter
              institutions={institutions}
              current={instituce}
              kategorie={kategorie}
            />
          )}

          {/* Zrušit filtry */}
          {hasFilters && (
            <Link href="/articles"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-coral transition-colors no-underline ml-auto">
              × Zrušit filtry
            </Link>
          )}
        </div>

        {/* Výsledky */}
        {items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(article => {
                const inst = article.institution as unknown as { id: string; name: string; slug: string; type: string; logo_url: string | null } | null
                const isShelter = inst?.type === 'shelter'

                return (
                  <article key={article.id} className="bg-white rounded-[var(--radius-lg)] overflow-hidden shadow-sm border border-border hover:-translate-y-1 hover:shadow-md transition-all flex flex-col">

                    {/* Obrázek */}
                    <Link href={`/articles/${article.slug}`} className="no-underline block">
                      {article.cover_url ? (
                        <div className="h-44 relative overflow-hidden">
                          <Image
                            src={article.cover_url}
                            alt={article.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-44 bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-5xl">
                          🐾
                        </div>
                      )}
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      {/* Kategorie */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold mb-3 self-start ${categoryColor[article.category ?? 'story'] ?? 'bg-sand text-gray'}`}>
                        {categoryLabel[article.category ?? 'story'] ?? '📖 Příběh'}
                      </span>

                      {/* Název */}
                      <Link href={`/articles/${article.slug}`} className="no-underline group flex-1">
                        <h2 className="font-display font-extrabold text-lg text-espresso mb-2 leading-tight group-hover:text-coral transition-colors">
                          {article.title}
                        </h2>
                        {article.perex && (
                          <p className="text-sm text-text-body leading-relaxed line-clamp-2 mb-3">
                            {article.perex}
                          </p>
                        )}
                      </Link>

                      {/* Footer — instituce + datum */}
                      <div className="pt-3 mt-auto border-t border-border">
                        <div className="flex items-center justify-between gap-2">

                          {/* Instituce */}
                          {inst ? (
                            <Link href={`/institutions/${inst.slug}`}
                              className="flex items-center gap-2 no-underline group min-w-0">
                              <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-xs overflow-hidden ${isShelter ? 'bg-coral-tag-bg' : 'bg-rescue-tag-bg'}`}>
                                {inst.logo_url
                                  ? <Image src={inst.logo_url} alt={inst.name} width={24} height={24} className="object-cover" />
                                  : <span>{isShelter ? '🏠' : '🚑'}</span>
                                }
                              </div>
                              <span className="text-xs font-semibold text-text-muted group-hover:text-coral transition-colors truncate">
                                {inst.name}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-xs text-text-muted">
                              {article.author_name ?? 'Zozio'}
                            </span>
                          )}

                          {/* Datum */}
                          {article.published_at && (
                            <span className="text-xs text-text-muted flex-shrink-0">
                              {new Date(article.published_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>

                        {/* Přečíst tlačítko */}
                        <Link href={`/articles/${article.slug}`}
                          className="mt-3 flex items-center gap-1 text-xs font-bold text-coral hover:text-coral-dark transition-colors no-underline group">
                          Přečíst celý příběh
                          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Počet výsledků */}
            <p className="text-center text-sm text-text-muted mt-8">
              {items.length === 24 ? 'Zobrazeno prvních 24 příběhů' : `Celkem ${items.length} příběhů`}
              {hasFilters && ' · '}
              {hasFilters && <Link href="/articles" className="text-coral hover:underline">zobrazit vše</Link>}
            </p>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="font-display font-extrabold text-2xl text-espresso mb-2">
              {hasFilters ? 'Žádné příběhy nenalezeny' : 'Zatím žádné příběhy'}
            </h2>
            <p className="text-text-muted mb-6">
              {hasFilters
                ? 'Zkus jiný filtr nebo zobraz všechny příběhy.'
                : 'Brzy tu budou příběhy adopcí a záchran zvířat.'}
            </p>
            {hasFilters && (
              <Link href="/articles"
                className="inline-flex items-center gap-2 bg-coral text-white font-bold px-6 py-3 rounded-pill no-underline hover:bg-coral-dark transition-colors">
                Zobrazit vše
              </Link>
            )}
          </div>
        )}

      </div>
    </main>
  )
}

function ArticleCard({ article }: { article: any }) {
  const institution = article.institution as any
  const readingMins = article.perex
    ? Math.max(1, Math.ceil(article.perex.split(' ').length / 200))
    : null

  return (
    <Link href={`/articles/${article.slug}`} className="no-underline group">
      <article className="bg-white rounded-xl overflow-hidden border border-gray-pale hover:-translate-y-1 hover:shadow-md transition-all h-full flex flex-col">
        {/* Image */}
        <div className="relative h-40 md:h-48 bg-sand flex-shrink-0">
          {article.cover_url ? (
            <Image
              src={article.cover_url}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-sand to-coral-light">
              🐾
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 flex flex-col flex-1">
          <span className="text-[11px] font-bold text-coral-dark mb-2">
            {categoryLabel[article.category ?? 'story'] ?? '📖 Příběh'}
          </span>
          <h2 className="font-display font-extrabold text-sm md:text-base text-espresso mb-2 leading-tight line-clamp-2 group-hover:text-coral transition-colors flex-1">
            {article.title}
          </h2>
          {article.perex && (
            <p className="text-xs text-brown-mid leading-relaxed line-clamp-2 mb-3 hidden md:block">
              {article.perex}
            </p>
          )}
          <div className="flex items-center justify-between text-[11px] text-gray mt-auto pt-2 border-t border-gray-pale">
            <span className="font-semibold truncate max-w-[120px]">
              {institution?.name ?? 'Zozio'}
            </span>
            <span className="flex-shrink-0 ml-2">
              {article.published_at
                ? new Date(article.published_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
                : readingMins ? `${readingMins} min čtení` : null
              }
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
