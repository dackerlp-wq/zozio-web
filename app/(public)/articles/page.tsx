import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Příběhy | Zozio',
  description: 'Příběhy adoptovaných zvířat a záchranných případů. Inspirace a radost.',
}

export default async function ArticlesPage() {
  const articles = await getArticles()
  const featured = articles[0]
  const rest     = articles.slice(1)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">

        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8634A' }}>Příběhy</p>
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-1" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Inspirativní příběhy
          </h1>
          <p className="text-sm" style={{ color: '#8B6550' }}>{articles.length} příběhů od útulků a záchranných stanic</p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📖</div>
            <p className="font-bold text-xl text-[#1A0F0A] mb-2">Zatím žádné příběhy</p>
            <p className="text-sm" style={{ color: '#8B6550' }}>Brzy přibydou příběhy od útulků a záchranných stanic.</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <Link href={`/articles/${(featured as any).slug}`} className="no-underline group block mb-8">
                <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:-translate-y-1 transition-all duration-200 md:flex">
                  <div className="relative md:w-80 h-56 md:h-auto flex-shrink-0"
                    style={{ background: '#FAECE7', minHeight: '220px' }}>
                    {(featured as any).cover_url
                      ? <Image src={(featured as any).cover_url} alt={(featured as any).title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-6xl">📖</div>
                    }
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: '#FAECE7', color: '#993C1D' }}>
                        Hlavní příběh
                      </span>
                      {(featured as any).institution && (
                        <InstitutionBadge inst={(featured as any).institution} />
                      )}
                    </div>
                    <h2 className="font-display font-extrabold text-[#1A0F0A] text-2xl md:text-3xl mb-3 leading-tight">
                      {(featured as any).title}
                    </h2>
                    {(featured as any).perex && (
                      <p className="text-base leading-relaxed mb-4 line-clamp-3" style={{ color: '#6B4030' }}>
                        {(featured as any).perex}
                      </p>
                    )}
                    <span className="text-sm font-bold" style={{ color: '#E8634A' }}>
                      Přečíst celý příběh →
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((a: any) => (
                  <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
                      <div className="relative h-44 flex-shrink-0" style={{ background: '#FAECE7' }}>
                        {a.cover_url
                          ? <Image src={a.cover_url} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
                        }
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        {a.institution && (
                          <div className="mb-2">
                            <InstitutionBadge inst={a.institution} compact />
                          </div>
                        )}
                        <h3 className="font-bold text-[#1A0F0A] leading-tight mb-2">{a.title}</h3>
                        {a.perex && (
                          <p className="text-xs line-clamp-3 flex-1 leading-relaxed" style={{ color: '#8B6550' }}>
                            {a.perex}
                          </p>
                        )}
                        <span className="text-xs font-bold mt-3 block" style={{ color: '#E8634A' }}>Přečíst →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function InstitutionBadge({ inst, compact = false }: { inst: any; compact?: boolean }) {
  const isShelter  = inst.type === 'shelter'
  const accentBg   = isShelter ? '#FAECE7' : '#E1F5EE'
  const accentText = isShelter ? '#993C1D' : '#0F6E56'

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: accentBg }}>
        {inst.logo_url
          ? <Image src={inst.logo_url} alt={inst.name} width={20} height={20} className="object-cover" />
          : <span style={{ fontSize: 10 }}>{isShelter ? '🏠' : '🚑'}</span>
        }
      </div>
      <span className="text-xs font-semibold truncate" style={{ color: compact ? '#8B6550' : accentText }}>
        {inst.name}
      </span>
      {!compact && inst.city && (
        <span className="text-xs" style={{ color: '#8B6550' }}>· {inst.city}</span>
      )}
    </div>
  )
}

async function getArticles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, category, published_at, institution:institutions(id,name,slug,type,city,logo_url)')
    .eq('published', true)
    .order('published_at', { ascending: false })
  return data ?? []
}
