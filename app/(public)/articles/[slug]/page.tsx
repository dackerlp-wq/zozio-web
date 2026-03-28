import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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

const categoryColor: Record<string, string> = {
  story:  'bg-coral-light text-coral-dark',
  rescue: 'bg-rescue-bg text-rescue-dark',
  tips:   'bg-amber-light text-warning',
  news:   'bg-sand text-brown-mid',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Článek nenalezen | Zozio' }
  return {
    title: article.title,
    description: article.perex ?? article.title,
    openGraph: {
      title:       article.title,
      description: article.perex ?? '',
      images:      article.cover_url ? [{ url: article.cover_url }] : [],
    },
  }
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : null

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[800px] mx-auto px-4 md:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray mb-6 font-semibold">
          <Link href="/" className="hover:text-coral transition-colors">Domů</Link>
          <span>·</span>
          <Link href="/articles" className="hover:text-coral transition-colors">Příběhy</Link>
          <span>·</span>
          <span className="text-espresso truncate">{article.title}</span>
        </nav>

        {/* Kategorie + meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-bold ${categoryColor[article.category ?? 'story'] ?? 'bg-sand text-gray'}`}>
            {categoryLabel[article.category ?? 'story']}
          </span>
          {article.institution && (
            <span className="text-xs text-gray font-semibold">
              {(article.institution as any).name}
            </span>
          )}
          {publishedDate && (
            <span className="text-xs text-gray">{publishedDate}</span>
          )}
          {article.author_name && (
            <span className="text-xs text-gray">· {article.author_name}</span>
          )}
        </div>

        {/* Název */}
        <h1 className="font-display font-extrabold text-3xl md:text-5xl text-espresso leading-tight mb-5">
          {article.title}
        </h1>

        {/* Perex */}
        {article.perex && (
          <p className="text-lg md:text-xl text-brown-mid leading-relaxed mb-7 font-body">
            {article.perex}
          </p>
        )}

        {/* Cover foto */}
        {article.cover_url && (
          <div className="rounded-lg overflow-hidden mb-8 shadow-md">
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full h-[280px] md:h-[420px] object-cover"
            />
          </div>
        )}

        {/* Obsah */}
        {article.content && (
          <div
            className="article-content font-body text-base md:text-lg text-espresso leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

        {/* CSS pro obsah */}
        <style>{`
          .article-content h2 {
            font-family: var(--font-display);
            font-size: 1.6rem;
            font-weight: 800;
            color: #2C1810;
            margin: 2rem 0 0.75rem;
          }
          .article-content h3 {
            font-family: var(--font-display);
            font-size: 1.25rem;
            font-weight: 700;
            color: #2C1810;
            margin: 1.5rem 0 0.5rem;
          }
          .article-content p { margin: 1rem 0; }
          .article-content ul, .article-content ol {
            margin: 1rem 0;
            padding-left: 1.75rem;
          }
          .article-content li { margin: 0.4rem 0; }
          .article-content blockquote {
            border-left: 4px solid #E8634A;
            padding: 0.75rem 1.25rem;
            margin: 1.5rem 0;
            background: #FDEAE6;
            border-radius: 0 10px 10px 0;
            font-style: italic;
            color: #6B3F1F;
          }
          .article-content a {
            color: #E8634A;
            text-decoration: underline;
          }
          .article-content img {
            max-width: 100%;
            border-radius: 10px;
            margin: 1.5rem 0;
          }
          .article-content figure {
            margin: 1.5rem 0;
          }
          .article-content strong { font-weight: 700; }
          .article-content em { font-style: italic; }
        `}</style>

        {/* Zpět */}
        <div className="mt-12 pt-8 border-t border-gray-pale">
          <Link href="/articles" className="text-coral font-bold hover:text-coral-dark transition-colors">
            ← Zpět na příběhy
          </Link>
        </div>
      </div>
    </main>
  )
}

async function getArticle(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*, institution:institutions(id,name,slug)')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data ?? null
}
