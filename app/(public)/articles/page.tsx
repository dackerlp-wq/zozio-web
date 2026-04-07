import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Příběhy adopcí a záchran | Zozio',
  description: 'Čtěte příběhy úspěšných adopcí a záchran zvířat z celé ČR a SR.',
}

const PAGE_SIZE = 12

const CATEGORIES = [
  { key: '',       label: 'Vše' },
  { key: 'story',  label: '🐾 Příběhy' },
  { key: 'rescue', label: '🦉 Záchranné' },
  { key: 'tips',   label: '💡 Tipy' },
  { key: 'news',   label: '📰 Novinky' },
]

const categoryLabel: Record<string, string> = {
  story:  '🐾 Příběh adopce',
  rescue: '🦉 Záchranný příběh',
  tips:   '💡 Tipy',
  news:   '📰 Novinky',
}

interface PageProps {
  searchParams: Promise<{ cat?: string; page?: string }>
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { cat = '', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = createServiceClient()

  // Pinned hero + paginated list in parallel
  const pinnedQuery = supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, category, published_at, institution:institutions(name, slug)')
    .eq('published', true)
    .eq('pinned', true)
    .single()

  let listQuery = supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, category, published_at, institution:institutions(name, slug)', { count: 'exact' })
    .eq('published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (cat) listQuery = listQuery.eq('category', cat)

  const [{ data: pinned }, { data: articlesRaw, count }] = await Promise.all([
    pinnedQuery,
    listQuery,
  ])

  const articles = articlesRaw ?? []
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildUrl(params: { cat?: string; page?: number }) {
    const q = new URLSearchParams()
    const c = params.cat !== undefined ? params.cat : cat
    const p = params.page ?? 1
    if (c) q.set('cat', c)
    if (p > 1) q.set('page', String(p))
    const qs = q.toString()
    return `/articles${qs ? `?${qs}` : ''}`
  }

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="mb-8 md:mb-10">
          <span className="inline-flex items-center gap-1.5 bg-coral-light text-coral-dark font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-3">
            📖 Příběhy
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-2 leading-tight">
            Příběhy, které zahřejí srdce
          </h1>
          <p className="text-sm md:text-base text-brown-mid max-w-[520px] leading-relaxed">
            Adopce, záchranné příběhy a novinky ze světa útulků a záchranných stanic.
          </p>
        </div>

        {/* Pinned hero — show only on first page with no category filter */}
        {pinned && !cat && page === 1 && (
          <Link href={`/articles/${pinned.slug}`} className="no-underline block mb-10 group">
            <div className="relative rounded-2xl overflow-hidden border border-amber/40 shadow-sm bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="relative h-56 md:h-auto md:min-h-[320px] bg-sand">
                  {pinned.cover_url ? (
                    <Image
                      src={pinned.cover_url}
                      alt={pinned.title}
                      fill
                      loading="eager"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 550px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-sand to-coral-light">
                      🐾
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-amber text-white text-xs font-bold px-3 py-1 rounded-pill">
                      📌 Doporučujeme
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-7 md:p-10 flex flex-col justify-center">
                  <span className="inline-flex items-center text-xs font-bold text-coral-dark mb-3">
                    {categoryLabel[pinned.category ?? 'story'] ?? '📖 Příběh'}
                  </span>
                  <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-3 leading-tight group-hover:text-coral transition-colors">
                    {pinned.title}
                  </h2>
                  {pinned.perex && (
                    <p className="text-sm md:text-base text-brown-mid leading-relaxed line-clamp-3 mb-4">
                      {pinned.perex}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray">
                    {(pinned.institution as any)?.name && (
                      <span className="font-semibold text-espresso">{(pinned.institution as any).name}</span>
                    )}
                    {pinned.published_at && (
                      <>
                        <span>·</span>
                        <span>{new Date(pinned.published_at).toLocaleDateString('cs-CZ')}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-coral group-hover:gap-3 transition-all">
                      Číst příběh →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-7 scrollbar-hide">
          {CATEGORIES.map(c => (
            <Link
              key={c.key}
              href={buildUrl({ cat: c.key, page: 1 })}
              className={`no-underline flex-shrink-0 text-sm font-bold px-4 py-2 rounded-pill border transition-all
                ${cat === c.key
                  ? 'bg-espresso text-white border-espresso'
                  : 'bg-white text-gray border-gray-pale hover:border-gray-light hover:text-espresso'
                }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link href={buildUrl({ page: page - 1 })}
                    className="no-underline px-4 py-2 rounded-lg border border-gray-pale bg-white text-sm font-semibold text-gray hover:border-espresso hover:text-espresso transition-all">
                    ← Předchozí
                  </Link>
                )}
                <span className="text-sm text-gray px-3">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={buildUrl({ page: page + 1 })}
                    className="no-underline px-4 py-2 rounded-lg border border-gray-pale bg-white text-sm font-semibold text-gray hover:border-espresso hover:text-espresso transition-all">
                    Další →
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-bold text-espresso mb-1">Žádné články v této kategorii</p>
            <Link href="/articles" className="text-sm text-coral font-semibold no-underline hover:opacity-80">
              Zobrazit vše
            </Link>
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
