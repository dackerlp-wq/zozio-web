import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Příběhy adopcí a záchran | Zozio',
  description: 'Čtěte příběhy úspěšných adopcí a záchran zvířat z celé ČR a SR.',
}

const categoryLabel: Record<string, string> = {
  story:  '🐾 Příběh adopce',
  rescue: '🦉 Záchranný příběh',
  tips:   '💡 Tipy a rady',
  news:   '📰 Novinky',
}

const categoryColor: Record<string, string> = {
  story:  'bg-coral-light text-coral-dark',
  rescue: 'bg-rescue-bg text-rescue-dark',
  tips:   'bg-amber-light text-warning',
  news:   'bg-sand text-brown-mid',
}

export default async function ArticlesPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, category, author_name, published_at, institution:institutions(name, type)')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(24)

  const items = articles ?? []

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">

        <div className="text-center mb-10 md:mb-12">
          <span className="inline-flex items-center gap-1.5 bg-coral-light text-coral-dark font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
            📖 Příběhy
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-espresso mb-3 leading-tight">
            Příběhy, které zahřejí srdce
          </h1>
          <p className="text-base md:text-lg text-brown-mid max-w-[480px] mx-auto leading-relaxed">
            Adopce, záchranné příběhy a novinky ze světa útulků a záchranných stanic.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📖</div>
            <p className="font-display font-bold text-xl text-gray">Zatím žádné příběhy</p>
            <p className="text-sm text-gray mt-2">Brzy tu budou příběhy adoptovaných zvířat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(article => {
              const inst = article.institution as any
              return (
                <article key={article.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-pale hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">

                  {/* Cover */}
                  <Link href={`/articles/${article.slug}`} className="no-underline">
                    {article.cover_url ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={article.cover_url}
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-5xl">
                        {categoryLabel[article.category ?? 'story']?.slice(0, 2)}
                      </div>
                    )}
                  </Link>

                  {/* Tělo */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold ${categoryColor[article.category ?? 'story'] ?? 'bg-sand text-gray'}`}>
                        {categoryLabel[article.category ?? 'story'] ?? '📖 Článek'}
                      </span>
                      {inst && (
                        <span className={`text-[10px] font-bold ${inst.type === 'shelter' ? 'text-coral' : 'text-rescue'}`}>
                          {inst.type === 'shelter' ? '🏠' : '🚑'} {inst.name}
                        </span>
                      )}
                    </div>

                    <Link href={`/articles/${article.slug}`} className="no-underline flex-1">
                      <h2 className="font-display font-extrabold text-lg text-espresso mb-2 leading-tight hover:text-coral transition-colors">
                        {article.title}
                      </h2>
                      {article.perex && (
                        <p className="text-sm text-brown-mid leading-relaxed line-clamp-3 mb-4">
                          {article.perex}
                        </p>
                      )}
                    </Link>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-pale">
                      <div className="text-xs text-gray">
                        {article.author_name && <span>{article.author_name} · </span>}
                        {article.published_at && (
                          <span>{new Date(article.published_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>
                      <Link href={`/articles/${article.slug}`} className="no-underline">
                        <span className="text-xs font-bold text-coral hover:text-coral-dark transition-colors">
                          Přečíst celý příběh →
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
