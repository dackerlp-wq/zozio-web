import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import sanitizeHtml from 'sanitize-html'
import { createClient } from '@/lib/supabase/server'
import { AdSlot } from '@/components/public/AdSlot'
import type { Article, Institution, InstitutionType, ShelterAnimalStatus } from '@/types/database'

/* ── Query-specific types ── */
interface ArticleDetail extends Article {
  institution: (Pick<Institution, 'id' | 'name' | 'slug' | 'type' | 'city' | 'logo_url' | 'short_description' | 'approval_status'> & {
    otherArticles?: OtherArticleItem[]
  }) | null
  animal: {
    id: string
    name: string
    breed: string | null
    primary_photo: string | null
    adoption_status: ShelterAnimalStatus
    species: { name_cs: string; icon: string | null } | null
  } | null
}

interface OtherArticleItem {
  id: string
  title: string
  slug: string
  cover_url: string | null
}

interface AnimalPanelData {
  id: string
  name: string
  breed: string | null
  primary_photo: string | null
  adoption_status: ShelterAnimalStatus
  species: { name_cs: string; icon: string | null } | null
}

interface InstitutionPanelData {
  id: string
  name: string
  slug: string
  type: InstitutionType
  city: string
  lat:  number | null
  lng:  number | null
  logo_url: string | null
  short_description: string | null
  otherArticles?: OtherArticleItem[]
}

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
  available:        { label: 'K adopci',      bg: 'var(--success-tag-bg)', color: 'var(--success-tag-text)' },
  reserved:         { label: 'Rezervováno',   bg: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' },
  adopted:          { label: 'Adoptováno 🎉', bg: 'var(--border)', color: 'var(--text-neutral)' },
  foster:           { label: 'V dočasné péči',     bg: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' },
  not_for_adoption: { label: 'Není k adopci', bg: 'var(--border)', color: 'var(--text-neutral)' },
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

  const inst      = (article as ArticleDetail).institution as InstitutionPanelData | null
  const animal    = (article as ArticleDetail).animal as AnimalPanelData | null
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
      {inst && inst.otherArticles && inst.otherArticles.length > 0 && (
        <OtherArticles articles={inst.otherArticles} institutionName={inst.name} />
      )}
      {/* Sidebar reklama — cílena na region + instituci + kategorii článku */}
      <AdSlot
        slot="sidebar"
        lat={inst?.lat ?? undefined}
        lng={inst?.lng ?? undefined}
        institutionId={inst?.id ?? undefined}
        articleCategory={article.category ?? undefined}
      />
    </div>
  )

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16 bg-warm">
      <div className="max-w-[1100px] mx-auto px-5 md:px-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm py-5 text-text-muted">
          <Link href="/" className="no-underline hover:opacity-70 text-text-muted">Domů</Link>
          <span>·</span>
          <Link href="/articles" className="no-underline hover:opacity-70 text-text-muted">Příběhy</Link>
          <span>·</span>
          <span className="font-semibold truncate max-w-[240px] text-text-primary">{article.title}</span>
        </nav>

        {/* Grid — text + sticky panel (vždy 2 sloupce na desktopu) */}
        <div className="grid gap-8 lg:gap-12 items-start lg:grid-cols-[1fr_280px]">

          {/* ── Levý sloupec ── */}
          <article>
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-coral-tag-bg text-coral-tag-text">
                {categoryLabel[article.category ?? 'story'] ?? '📖 Příběh'}
              </span>
              {publishedDate && (
                <span className="text-xs text-text-muted">{publishedDate}</span>
              )}
              {article.author_name && (
                <span className="text-xs text-text-muted">· {article.author_name}</span>
              )}
            </div>

            {/* Název */}
            <h1 className="font-display font-extrabold text-text-primary leading-tight mb-4"
              style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
              {article.title}
            </h1>

            {/* Perex */}
            {article.perex && (
              <p className="text-lg leading-relaxed mb-7 text-text-body" style={{ lineHeight: 1.7 }}>
                {article.perex}
              </p>
            )}

            {/* Cover */}
            {article.cover_url && (
              <div className="rounded-2xl overflow-hidden mb-8 shadow-md">
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
                <div className="article-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content, {
                  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
                  allowedAttributes: {
                    ...sanitizeHtml.defaults.allowedAttributes,
                    img: ['src', 'alt', 'width', 'height', 'class'],
                    a: ['href', 'target', 'rel'],
                  },
                  allowedSchemes: ['https', 'http'],
                }) }} />
                <style>{`
                  .article-content { font-size: 1.05rem; line-height: 1.85; color: var(--espresso); }
                  .article-content h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 2.5rem 0 0.75rem; }
                  .article-content h3 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 2rem 0 0.5rem; }
                  .article-content p { margin: 1rem 0; }
                  .article-content ul, .article-content ol { margin: 1rem 0; padding-left: 1.75rem; }
                  .article-content li { margin: 0.4rem 0; }
                  .article-content blockquote { border-left: 4px solid var(--coral); padding: .75rem 1.25rem; margin: 1.5rem 0; background: var(--coral-tag-bg); border-radius: 0 12px 12px 0; font-style: italic; color: var(--brown); }
                  .article-content a { color: var(--coral); text-decoration: underline; }
                  .article-content img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
                  .article-content strong { font-weight: 700; }
                `}</style>
              </>
            )}

            {/* Mobil — panel pod textem */}
            {true && (
              <div className="lg:hidden mt-10 pt-8 border-t border-border">
                {rightPanel}
              </div>
            )}

            {/* Zpět */}
            <div className="mt-10 pt-6 border-t border-border">
              <Link href="/articles" className="font-bold no-underline hover:opacity-70 transition-opacity text-coral">
                ← Zpět na příběhy
              </Link>
            </div>
          </article>

          {/* ── Pravý sloupec — sticky (vždy viditelný) ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {rightPanel}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

/* ── Panel zvíře ── */
function AnimalPanel({ animal: a, status }: { animal: AnimalPanelData; status: { label: string; bg: string; color: string } | null }) {
  const species = a.species
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Zvíře z příběhu
        </p>
      </div>
      <Link href={`/animals/${a.id}`} className="no-underline group block">
        <div className="relative h-44 overflow-hidden bg-coral-tag-bg">
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
          <div className="font-bold text-text-primary text-base mb-0.5 group-hover:opacity-80 transition-opacity">
            {a.name}
          </div>
          <div className="text-xs mb-3 text-text-muted">
            {[species?.name_cs, a.breed].filter(Boolean).join(' · ')}
          </div>
          <div className="py-2 rounded-xl text-center text-xs font-bold text-white bg-coral">
            {a.adoption_status === 'available' ? 'Adoptovat →' : 'Zobrazit profil →'}
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ── Panel instituce ── */
function InstitutionPanel({ inst, isShelter }: { inst: InstitutionPanelData; isShelter: boolean }) {
  const accentBg   = isShelter ? 'var(--coral-tag-bg)' : 'var(--rescue-tag-bg)'
  const accentText = isShelter ? 'var(--coral-tag-text)' : 'var(--rescue-tag-text)'
  const accent     = isShelter ? 'var(--coral)' : 'var(--rescue)'
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-text-muted">
          Autor příběhu
        </p>
      </div>
      <Link href={`/institutions/${inst.slug}`} className="no-underline group block px-4 pb-4 pt-2 hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-xl"
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
            <div className="font-bold text-sm text-text-primary truncate">{inst.name}</div>
            {inst.city && <div className="text-xs mt-0.5 text-text-muted">📍 {inst.city}</div>}
          </div>
        </div>
        {inst.short_description && (
          <p className="text-xs leading-relaxed line-clamp-3 mb-3 text-text-muted">
            {inst.short_description}
          </p>
        )}
        <div className="py-2 rounded-xl text-center text-xs font-bold text-white"
          style={{ background: accent }}>
          Zobrazit profil →
        </div>
      </Link>
    </div>
  )
}

/* ── Další příběhy ── */
function OtherArticles({ articles, institutionName }: { articles: OtherArticleItem[]; institutionName: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-text-muted">
        Další od {institutionName}
      </p>
      <div className="space-y-2">
        {articles.map((a: OtherArticleItem) => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-warm-hover transition-all">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center bg-coral-tag-bg">
                {a.cover_url
                  ? <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                  : <span style={{ fontSize: 16 }}>📖</span>
                }
              </div>
              <div className="text-xs font-semibold text-text-primary line-clamp-2 group-hover:opacity-70 transition-opacity flex-1 min-w-0">
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
async function getArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      institution:institutions(id, name, slug, type, city, lat, lng, logo_url, short_description, approval_status),
      animal:animals(id, name, breed, primary_photo, adoption_status, species:animal_species(name_cs, icon))
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!article) return null

  const result = article as unknown as ArticleDetail
  const inst = result.institution
  if (inst?.id) {
    const { data: others } = await supabase
      .from('articles')
      .select('id, title, slug, cover_url')
      .eq('institution_id', inst.id)
      .eq('published', true)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(3)
    if (others?.length) inst.otherArticles = others as OtherArticleItem[]
  }

  return result
}
