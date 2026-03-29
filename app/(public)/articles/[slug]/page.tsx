import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ slug: string }>
}

const categoryLabel: Record<string, string> = {
  story:  '🐾 Příběh adopce',
  rescue: '🦉 Záchranný příběh',
  tips:   '💡 Tipy a rady',
  news:   '📰 Novinky',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article  = await getArticle(slug)
  if (!article) return { title: 'Článek nenalezen | Zozio' }
  return {
    title:       `${article.title} | Zozio`,
    description: article.perex ?? article.title,
    openGraph: {
      title:       article.title,
      description: article.perex ?? '',
      images:      article.cover_url ? [{ url: article.cover_url }] : [],
    },
  }
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug }   = await params
  const article    = await getArticle(slug)
  if (!article) notFound()

  const inst = article.institution as any
  const isShelter = inst?.type === 'shelter'

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[740px] mx-auto px-5 md:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm py-5" style={{ color: '#8B6550' }}>
          <Link href="/" className="no-underline hover:opacity-70" style={{ color: '#8B6550' }}>Domů</Link>
          <span>·</span>
          <Link href="/articles" className="no-underline hover:opacity-70" style={{ color: '#8B6550' }}>Příběhy</Link>
          <span>·</span>
          <span className="font-semibold truncate max-w-[200px]" style={{ color: '#1A0F0A' }}>{article.title}</span>
        </nav>

        {/* Kategorie + datum */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: '#FAECE7', color: '#993C1D' }}>
            {categoryLabel[article.category ?? 'story'] ?? '📖 Příběh'}
          </span>
          {publishedDate && (
            <span className="text-xs" style={{ color: '#8B6550' }}>{publishedDate}</span>
          )}
          {article.author_name && (
            <span className="text-xs" style={{ color: '#8B6550' }}>· {article.author_name}</span>
          )}
        </div>

        {/* Název */}
        <h1 className="font-display font-extrabold text-[#1A0F0A] leading-tight mb-4"
          style={{ fontSize: 'clamp(26px, 5vw, 42px)' }}>
          {article.title}
        </h1>

        {/* Perex */}
        {article.perex && (
          <p className="text-lg leading-relaxed mb-7" style={{ color: '#6B4030', lineHeight: 1.7 }}>
            {article.perex}
          </p>
        )}

        {/* Cover foto */}
        {article.cover_url && (
          <div className="rounded-2xl overflow-hidden mb-8 shadow-md">
            <Image
              src={article.cover_url}
              alt={article.title}
              width={740}
              height={420}
              className="w-full object-cover"
              style={{ maxHeight: '420px' }}
            />
          </div>
        )}

        {/* Obsah */}
        {article.content && (
          <>
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            <style>{`
              .article-content { font-size: 1.05rem; line-height: 1.85; color: #2C1810; }
              .article-content h2 {
                font-family: var(--font-display);
                font-size: 1.6rem; font-weight: 800;
                color: #1A0F0A; margin: 2.5rem 0 0.75rem;
              }
              .article-content h3 {
                font-family: var(--font-display);
                font-size: 1.2rem; font-weight: 700;
                color: #1A0F0A; margin: 2rem 0 0.5rem;
              }
              .article-content p { margin: 1rem 0; }
              .article-content ul, .article-content ol {
                margin: 1rem 0; padding-left: 1.75rem;
              }
              .article-content li { margin: 0.4rem 0; }
              .article-content blockquote {
                border-left: 4px solid #E8634A;
                padding: 0.75rem 1.25rem;
                margin: 1.5rem 0;
                background: #FAECE7;
                border-radius: 0 12px 12px 0;
                font-style: italic;
                color: #6B3F1F;
              }
              .article-content a { color: #E8634A; text-decoration: underline; }
              .article-content img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
              .article-content strong { font-weight: 700; }
            `}</style>
          </>
        )}

        {/* ── Karta instituce ── */}
        {inst && (
          <div className="mt-12 pt-8 border-t border-[#F0EDE8]">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#8B6550' }}>
              Autor příběhu
            </p>
            <Link href={`/institutions/${inst.slug}`} className="no-underline group">
              <div className="flex items-center gap-5 p-5 rounded-2xl border hover:-translate-y-0.5 transition-all"
                style={{
                  background: isShelter ? '#FEFCF8' : '#F8FDFB',
                  borderColor: isShelter ? '#F0DDD6' : '#C8EBE3',
                }}>

                {/* Logo */}
                <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl border-2 border-white shadow-sm"
                  style={{ background: isShelter ? '#FAECE7' : '#E1F5EE' }}>
                  {inst.logo_url
                    ? <Image src={inst.logo_url} alt={inst.name} width={64} height={64} className="object-cover" />
                    : <span>{isShelter ? '🏠' : '🚑'}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={isShelter
                        ? { background: '#FAECE7', color: '#993C1D' }
                        : { background: '#E1F5EE', color: '#0F6E56' }}>
                      {isShelter ? '🏠 Útulek' : '🚑 Záchranná stanice'}
                    </span>
                    {inst.approval_status === 'approved' && (
                      <span className="text-[10px] font-bold" style={{ color: '#3B6D11' }}>✓ Ověřeno</span>
                    )}
                  </div>
                  <div className="font-bold text-[#1A0F0A] truncate group-hover:opacity-80 transition-opacity">
                    {inst.name}
                  </div>
                  {inst.city && (
                    <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {inst.city}</div>
                  )}
                  {inst.short_description && (
                    <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: '#8B6550' }}>
                      {inst.short_description}
                    </p>
                  )}
                </div>

                {/* Šipka */}
                <div className="flex-shrink-0" style={{ color: '#C8C5BF' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>

            {/* Další příběhy od instituce */}
            {inst.otherArticles && inst.otherArticles.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#8B6550' }}>
                  Další příběhy od {inst.name}
                </p>
                <div className="space-y-2">
                  {inst.otherArticles.map((a: any) => (
                    <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-0.5 transition-all bg-white">
                        {a.cover_url && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                            <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-[#1A0F0A] truncate">{a.title}</div>
                          {a.perex && (
                            <div className="text-xs truncate mt-0.5" style={{ color: '#8B6550' }}>{a.perex}</div>
                          )}
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}>
                          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zpět */}
        <div className="mt-10 pt-6 border-t border-[#F0EDE8]">
          <Link href="/articles" className="font-bold no-underline hover:opacity-70 transition-opacity"
            style={{ color: '#E8634A' }}>
            ← Zpět na příběhy
          </Link>
        </div>
      </div>
    </main>
  )
}

async function getArticle(slug: string) {
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      institution:institutions(
        id, name, slug, type, city, logo_url, short_description, approval_status
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!article) return null

  // Načti další příběhy od stejné instituce
  const inst = article.institution as any
  if (inst?.id) {
    const { data: others } = await supabase
      .from('articles')
      .select('id, title, slug, perex, cover_url')
      .eq('institution_id', inst.id)
      .eq('published', true)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(3)

    if (others?.length) {
      ;(article.institution as any).otherArticles = others
    }
  }

  return article
}
