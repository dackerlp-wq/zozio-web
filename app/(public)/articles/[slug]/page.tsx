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

const adoptionStatusConfig: Record<string, { label: string; bg: string; color: string }> = {
  available:        { label: 'K adopci',      bg: '#EAF3DE', color: '#3B6D11' },
  reserved:         { label: 'Rezervováno',   bg: '#FAEEDA', color: '#854F0B' },
  adopted:          { label: 'Adoptováno 🎉', bg: '#F0EDE8', color: '#5F5E5A' },
  foster:           { label: 'Ve foster',     bg: '#E1F5EE', color: '#0F6E56' },
  not_for_adoption: { label: 'Není k adopci', bg: '#F0EDE8', color: '#5F5E5A' },
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
  const { slug } = await params
  const article  = await getArticle(slug)
  if (!article) notFound()

  const inst      = article.institution as any
  const animal    = (article as any).animal as any
  const isShelter = inst?.type === 'shelter'
  const hasPanel  = !!(inst || animal)
  const animalStatus = animal
    ? (adoptionStatusConfig[animal.adoption_status] ?? adoptionStatusConfig.available)
    : null

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  const rightPanel = (
    <div className="space-y-4">
      {animal && <AnimalPanel animal={animal} status={animalStatus} />}
      {inst && <InstitutionPanel inst={inst} isShelter={isShelter} />}
      {inst?.otherArticles?.length > 0 && (
        <OtherArticles articles={inst.otherArticles} institutionName={inst.name} />
      )}
    </div>
  )

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm py-5" style={{ color: '#8B6550' }}>
          <Link href="/" className="no-underline hover:opacity-70" style={{ color: '#8B6550' }}>Domů</Link>
          <span>·</span>
          <Link href="/articles" className="no-underline hover:opacity-70" style={{ color: '#8B6550' }}>Příběhy</Link>
          <span>·</span>
          <span className="font-semibold truncate max-w-[240px]" style={{ color: '#1A0F0A' }}>{article.title}</span>
        </nav>

        {/* Grid — text + sticky panel */}
        <div className={`grid gap-8 lg:gap-12 items-start ${hasPanel ? 'lg:grid-cols-[1fr_296px]' : ''}`}>

          {/* ── Levý sloupec ── */}
          <article>
            {/* Meta */}
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
              style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
              {article.title}
            </h1>

            {/* Perex */}
            {article.perex && (
              <p className="text-lg leading-relaxed mb-7" style={{ color: '#6B4030', lineHeight: 1.7 }}>
                {article.perex}
              </p>
            )}

            {/* Cover */}
            {article.cover_url && (
              <div className="rounded-lg overflow-hidden mb-8 shadow-md">
                <Image
                  src={article.cover_url}
                  alt={article.title}
                  width={740} height={420}
                  className="w-full object-cover"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}

            {/* Obsah */}
            {article.content && (
              <>
                <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
                <style>{`
                  .article-content { font-size: 1.05rem; line-height: 1.85; color: #2C1810; }
                  .article-content h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #1A0F0A; margin: 2.5rem 0 0.75rem; }
                  .article-content h3 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: #1A0F0A; margin: 2rem 0 0.5rem; }
                  .article-content p { margin: 1rem 0; }
                  .article-content ul, .article-content ol { margin: 1rem 0; padding-left: 1.75rem; }
                  .article-content li { margin: 0.4rem 0; }
                  .article-content blockquote { border-left: 4px solid #E8634A; padding: .75rem 1.25rem; margin: 1.5rem 0; background: #FAECE7; border-radius: 0 12px 12px 0; font-style: italic; color: #6B3F1F; }
                  .article-content a { color: #E8634A; text-decoration: underline; }
                  .article-content img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
                  .article-content strong { font-weight: 700; }
                `}</style>
              </>
            )}

            {/* Mobil — panel pod textem */}
            {hasPanel && (
              <div className="lg:hidden mt-10 pt-8 border-t border-[#F0EDE8]">
                {rightPanel}
              </div>
            )}

            {/* Zpět */}
            <div className="mt-10 pt-6 border-t border-[#F0EDE8]">
              <Link href="/articles" className="font-bold no-underline hover:opacity-70 transition-opacity"
                style={{ color: '#E8634A' }}>
                ← Zpět na příběhy
              </Link>
            </div>
          </article>

          {/* ── Pravý sloupec — sticky ── */}
          {hasPanel && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                {rightPanel}
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}

/* ── Panel zvíře ── */
function AnimalPanel({ animal: a, status }: { animal: any; status: any }) {
  const species = a.species
  return (
    <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B6550' }}>
          Zvíře z příběhu
        </p>
      </div>
      <Link href={`/animals/${a.id}`} className="no-underline group block">
        <div className="relative h-44 overflow-hidden" style={{ background: '#FAECE7' }}>
          {a.primary_photo
            ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-5xl">{species?.icon ?? '🐾'}</div>
          }
          {status && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: status.bg, color: status.color }}>
              {status.label}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="font-bold text-[#1A0F0A] text-base mb-0.5 group-hover:opacity-80 transition-opacity">
            {a.name}
          </div>
          <div className="text-xs mb-3" style={{ color: '#8B6550' }}>
            {[species?.name_cs, a.breed].filter(Boolean).join(' · ')}
          </div>
          <div className="py-2 rounded-lg text-center text-xs font-bold text-white"
            style={{ background: '#E8634A' }}>
            {a.adoption_status === 'available' ? 'Adoptovat →' : 'Zobrazit profil →'}
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ── Panel instituce ── */
function InstitutionPanel({ inst, isShelter }: { inst: any; isShelter: boolean }) {
  const accentBg   = isShelter ? '#FAECE7' : '#E1F5EE'
  const accentText = isShelter ? '#993C1D' : '#0F6E56'
  const accent     = isShelter ? '#E8634A' : '#2E9E8F'
  return (
    <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
      <div className="px-4 pt-4 pb-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B6550' }}>
          Autor příběhu
        </p>
      </div>
      <Link href={`/institutions/${inst.slug}`} className="no-underline group block px-4 pb-4 pt-2 hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-xl"
            style={{ background: accentBg }}>
            {inst.logo_url
              ? <Image src={inst.logo_url} alt={inst.name} width={48} height={48} className="object-cover" />
              : <span>{isShelter ? '🏠' : '🚑'}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mb-1"
              style={{ background: accentBg, color: accentText }}>
              {isShelter ? '🏠 Útulek' : '🚑 Záchranná stanice'}
            </span>
            <div className="font-bold text-sm text-[#1A0F0A] truncate">{inst.name}</div>
            {inst.city && <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {inst.city}</div>}
          </div>
        </div>
        {inst.short_description && (
          <p className="text-xs leading-relaxed line-clamp-3 mb-3" style={{ color: '#8B6550' }}>
            {inst.short_description}
          </p>
        )}
        <div className="py-2 rounded-lg text-center text-xs font-bold text-white"
          style={{ background: accent }}>
          Zobrazit profil →
        </div>
      </Link>
    </div>
  )
}

/* ── Další příběhy ── */
function OtherArticles({ articles, institutionName }: { articles: any[]; institutionName: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#F0EDE8] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B6550' }}>
        Další od {institutionName}
      </p>
      <div className="space-y-2">
        {articles.map((a: any) => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#FAFAF8] transition-all">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center"
                style={{ background: '#FAECE7' }}>
                {a.cover_url
                  ? <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                  : <span style={{ fontSize: 16 }}>📖</span>
                }
              </div>
              <div className="text-xs font-semibold text-[#1A0F0A] line-clamp-2 group-hover:opacity-70 transition-opacity flex-1 min-w-0">
                {a.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Data ── */
async function getArticle(slug: string) {
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      institution:institutions(id, name, slug, type, city, logo_url, short_description, approval_status),
      animal:animals(id, name, breed, primary_photo, adoption_status, species:animal_species(name_cs, icon))
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!article) return null

  const inst = article.institution as any
  if (inst?.id) {
    const { data: others } = await supabase
      .from('articles')
      .select('id, title, slug, cover_url')
      .eq('institution_id', inst.id)
      .eq('published', true)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(3)
    if (others?.length) inst.otherArticles = others
  }

  return article
}
