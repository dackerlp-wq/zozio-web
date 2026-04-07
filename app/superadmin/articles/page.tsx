import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'
import { PinButton } from './PinButton'

export const revalidate = 0

export default async function SuperadminArticlesPage() {
  const service = createServiceClient()

  const { data: articles } = await service
    .from('articles')
    .select('id, title, slug, cover_url, category, published, published_at, pinned, institution:institutions(name)')
    .eq('published', true)
    .order('pinned',       { ascending: false })
    .order('published_at', { ascending: false })

  const items = (articles ?? []) as any[]
  const pinned = items.find(a => a.pinned)

  const categoryLabel: Record<string, string> = {
    story:  '🐾 Příběh adopce',
    rescue: '🦉 Záchranný příběh',
    tips:   '💡 Tipy',
    news:   '📰 Novinky',
  }

  return (
    <div className="min-h-screen bg-gray-pale/30">
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/superadmin" className="text-xs text-gray-light hover:text-white font-semibold transition-colors">
            ← Superadmin
          </Link>
          <span className="text-gray-light/40">·</span>
          <span className="font-display font-bold text-sm text-amber">📖 Články</span>
        </div>
        <Link href="/articles" target="_blank"
          className="text-xs text-gray-light hover:text-white font-semibold transition-colors">
          Zobrazit na webu →
        </Link>
      </div>

      <div className="max-w-[900px] mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-3xl text-espresso mb-1">
            📌 Připnutý hero článek
          </h1>
          <p className="text-gray text-sm">
            Připnutý článek se zobrazí jako velká hero karta na vrchu stránky /articles.
            Může být připnut vždy jen <strong>jeden</strong> článek.
          </p>
        </div>

        {/* Aktuálně připnutý */}
        {pinned ? (
          <div className="bg-amber-light border-2 border-amber rounded-xl p-5 mb-8 flex items-center gap-4">
            <span className="text-2xl">📌</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-warning uppercase tracking-wider mb-0.5">Aktuálně připnutý</p>
              <p className="font-bold text-espresso truncate">{pinned.title}</p>
              <p className="text-xs text-brown-mid">{pinned.institution?.name ?? 'Zozio'}</p>
            </div>
            <PinButton articleId={pinned.id} isPinned={true} />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-pale rounded-xl p-5 mb-8 text-center text-gray text-sm">
            Žádný článek není připnut — hero sekce se nezobrazí.
          </div>
        )}

        {/* Seznam článků */}
        <h2 className="font-display font-bold text-lg text-espresso mb-4">
          Všechny publikované články ({items.length})
        </h2>

        <div className="space-y-2">
          {items.map((a: any) => (
            <div key={a.id}
              className={`bg-white rounded-xl border flex items-center gap-4 p-4 transition-all
                ${a.pinned ? 'border-amber shadow-sm' : 'border-gray-pale'}`}>

              {/* Foto */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                style={{ background: '#FAECE7' }}>
                {a.cover_url
                  ? <Image src={a.cover_url} alt={a.title} fill className="object-cover" sizes="56px" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {a.pinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-light text-warning">📌 Připnuto</span>}
                  <span className="text-[11px] text-gray">
                    {categoryLabel[a.category] ?? '📖 Příběh'}
                  </span>
                </div>
                <div className="font-bold text-sm text-espresso truncate">{a.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray mt-0.5">
                  <span>{a.institution?.name ?? 'Zozio'}</span>
                  {a.published_at && (
                    <>
                      <span>·</span>
                      <span>{new Date(a.published_at).toLocaleDateString('cs-CZ')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Akce */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/articles/${a.slug}`} target="_blank"
                  className="text-xs font-semibold text-gray hover:text-coral transition-colors no-underline px-2 py-1">
                  Zobrazit →
                </Link>
                <PinButton articleId={a.id} isPinned={a.pinned} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
