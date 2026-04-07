import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { FavoriteButtonWrapper } from '@/components/public/FavoriteButtonWrapper'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Zozio — Najdi svého nového přítele',
  description: 'Adoptuj zvíře z útulku nebo podpoř záchrannou stanici. Stovky zvířat čekají na nový domov po celé ČR a SR.',
}

export default async function HomePage() {
  const [animals, species] = await Promise.all([
    getFeaturedAnimals(),
    getSpecies(),
  ])

  return (
    <main className="overflow-x-hidden">
      <HeroSection animals={animals} species={species} />
      <Suspense fallback={<StatsStripSkeleton />}>
        <StatsStripAsync />
      </Suspense>
      <AnimalsSection animals={animals} />
      <Suspense fallback={<RescueSectionSkeleton />}>
        <RescueSectionAsync />
      </Suspense>
      <Suspense fallback={<StoriesSectionSkeleton />}>
        <StoriesSectionAsync />
      </Suspense>
      <InstitutionsCta />
    </main>
  )
}

/* ── ASYNC WRAPPERS ── */
async function StatsStripAsync() {
  const stats = await getStats()
  return <StatsStrip stats={stats} />
}

async function RescueSectionAsync() {
  const [cases, fundraisers] = await Promise.all([
    getFeaturedRescueCases(),
    getActiveFundraisers(),
  ])
  return <RescueSection cases={cases} fundraisers={fundraisers} />
}

async function StoriesSectionAsync() {
  const [articles, pinnedArticle] = await Promise.all([
    getLatestArticles(),
    getPinnedArticle(),
  ])
  return <StoriesSection articles={articles} pinnedArticle={pinnedArticle} />
}

/* ── SKELETON FALLBACKS ── */
function StatsStripSkeleton() {
  return (
    <div className="bg-espresso px-4 md:px-12 py-6 md:py-8">
      <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`text-center py-2 ${i < 3 ? 'md:border-r border-white/10' : ''}`}>
            <div className="h-6 w-12 mx-auto rounded bg-white/10 animate-pulse mb-2" />
            <div className="h-4 w-20 mx-auto rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RescueSectionSkeleton() {
  return (
    <div className="py-12 md:py-20 px-4 md:px-12 min-h-[320px]" style={{ background: '#F5F0EB' }} />
  )
}

function StoriesSectionSkeleton() {
  return (
    <div className="py-12 md:py-20 px-4 md:px-12 min-h-[320px] bg-warm" />
  )
}

/* ── HERO ── */
function HeroSection({ animals, species }: { animals: any[]; species: any[] }) {
  const urgentCount = animals.filter(a => a.urgent).length

  return (
    <section className="relative pt-20 pb-0 md:pb-12 bg-warm overflow-hidden">
      {/* Blob pozadí */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-coral opacity-[0.10] -top-32 -right-20 blur-[100px]" />
        <div className="absolute w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full bg-amber opacity-[0.08] bottom-0 right-1/3 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center py-10 md:py-16">

          {/* Text */}
          <div>

            <h1 className="font-display font-extrabold text-[clamp(36px,6vw,72px)] leading-[1.05] text-espresso mb-4"
              style={{ animation: 'fadeUp .5s ease .05s both' }}>
              Každé zvíře<br />
              hledá{' '}
              <span className="text-coral relative inline-block">
                domov
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-amber opacity-40 rounded-full -z-10" />
              </span>
            </h1>

            <p className="text-base md:text-xl leading-relaxed text-brown-mid mb-7 max-w-[480px]"
              style={{ animation: 'fadeUp .5s ease .1s both' }}>
              Adoptuj zvíře z útulku nebo podpoř záchrannou stanici.
              Stovky zvířat čekají na nový domov po celé ČR a SR.
            </p>

            <div className="flex flex-row gap-3 mb-8" style={{ animation: 'fadeUp .5s ease .15s both' }}>
              <Link href="/adopt">
                <Button variant="primary" size="sm" className="whitespace-nowrap md:text-lg md:px-10 md:py-[17px]">
                  🐾 Najít zvíře k adopci
                </Button>
              </Link>
              <Link href="/rescue">
                <Button variant="rescue" size="sm" className="whitespace-nowrap md:text-lg md:px-10 md:py-[17px]">
                  🦉 Záchranné stanice
                </Button>
              </Link>
            </div>

            {/* Rychlé filtry */}
            {(() => {
              const dogSpecies = species.find((s: any) => s.name_cs.toLowerCase().includes('pes') || s.name_cs.toLowerCase() === 'psi')
              const catSpecies = species.find((s: any) => s.name_cs.toLowerCase().includes('kočk'))
              const fixed = [dogSpecies, catSpecies].filter(Boolean) as any[]
              const fixedIds = new Set(fixed.map((s: any) => s.id))
              const otherSpecies = species
                .filter((s: any) => !fixedIds.has(s.id))
                .sort(() => 0.5 - Math.random())
                .slice(0, 2)
              const filters = [
                ...fixed.map((s: any) => ({ href: `/adopt?species=${s.id}`, emoji: s.icon || '🐾', label: s.name_cs })),
                ...otherSpecies.map((s: any) => ({ href: `/adopt?species=${s.id}`, emoji: s.icon || '🐾', label: s.name_cs })),
              ]
              return (
                <div style={{ animation: 'fadeUp .5s ease .2s both' }}>
                  <p className="text-xs font-bold text-gray uppercase tracking-wider mb-3">Hledáš konkrétní zvíře?</p>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {filters.map(({ href, emoji, label }) => (
                      <Link key={label} href={href}>
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-gray-pale rounded-pill font-body text-sm font-bold text-espresso hover:border-coral hover:text-coral transition-all cursor-pointer whitespace-nowrap flex-shrink-0">
                          {emoji} {label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Mozaika fotek — desktop */}
          <div className="hidden lg:flex lg:flex-col gap-3" style={{ animation: 'fadeUp .5s ease .1s both' }}>
            <div className="grid grid-cols-2 gap-3">
              {animals.slice(0, 4).map((animal, i) => (
                <Link key={animal.id} href={`/animals/${animal.id}`}>
                  <div className={`relative rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${i === 0 ? 'aspect-square' : i === 1 ? 'aspect-[4/3]' : i === 2 ? 'aspect-[4/3]' : 'aspect-square'}`}>
                    {animal.primary_photo ? (
                      <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover" sizes="280px" priority={i === 0} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-5xl">
                        {animal.species?.icon ?? '🐾'}
                      </div>
                    )}
                    {animal.urgent && (
                      <div className="absolute top-2 left-2"><Badge variant="urgent" /></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-espresso/80 to-transparent p-3">
                      <div className="font-display font-bold text-sm text-white">{animal.name}</div>
                      <div className="text-xs text-white/70">{animal.institution?.city}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {urgentCount > 0 && (
              <Link href="/adopt?urgent=true" className="block">
                <div className="flex items-center justify-center gap-2 bg-coral-light text-coral-dark font-body text-sm font-bold px-4 py-3 rounded-2xl hover:bg-coral hover:text-white transition-all cursor-pointer w-full">
                  🆘 {urgentCount} {urgentCount === 1 ? 'zvíře potřebuje' : urgentCount < 5 ? 'zvířata potřebují' : 'zvířat potřebuje'} urgentní pomoc
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobilní strip fotek — horizontální scroll */}
      {animals.length > 0 && (
        <div className="lg:hidden pb-4 pt-2">
          <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
            {animals.slice(0, 6).map(animal => (
              <Link key={animal.id} href={`/animals/${animal.id}`} className="no-underline flex-shrink-0">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-sm">
                  {animal.primary_photo ? (
                    <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover" sizes="128px" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-4xl">
                      {animal.species?.icon ?? '🐾'}
                    </div>
                  )}
                  {animal.urgent && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Volám ZOZ</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-espresso/75 to-transparent px-2 py-1.5">
                    <div className="font-bold text-[11px] text-white truncate">{animal.name}</div>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/adopt" className="no-underline flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-pale flex flex-col items-center justify-center gap-1 hover:border-coral transition-colors">
                <span className="text-2xl">🐾</span>
                <span className="text-xs font-bold text-gray text-center leading-tight px-2">Zobrazit vše</span>
              </div>
            </Link>
          </div>
          {urgentCount > 0 && (
            <Link href="/adopt?urgent=true" className="block px-4 pb-6">
              <div className="flex items-center justify-center gap-2 bg-coral-light text-coral-dark font-body text-sm font-bold px-4 py-3 rounded-2xl hover:bg-coral hover:text-white transition-all cursor-pointer">
                🆘 {urgentCount} {urgentCount === 1 ? 'zvíře potřebuje' : urgentCount < 5 ? 'zvířata potřebují' : 'zvířat potřebuje'} urgentní pomoc
              </div>
            </Link>
          )}
        </div>
      )}
    </section>
  )
}

/* ── STATS ── */
function StatsStrip({ stats }: { stats: { availableAnimals: number; adoptedTotal: number; institutionCount: number } }) {
  const items = [
    { num: stats.institutionCount > 0 ? `${stats.institutionCount}+` : '10+', label: 'Útulků a stanic', icon: '🏠' },
    { num: stats.availableAnimals > 0 ? stats.availableAnimals.toString() : '50+', label: 'Čeká na domov', icon: '🐾' },
    { num: stats.adoptedTotal > 0 ? `${stats.adoptedTotal}+` : '100+', label: 'Úspěšných adopcí', icon: '💚' },
    { num: 'Zdarma', label: 'Základní plán pro všechny', icon: '✨' },
  ]
  return (
    <div className="bg-espresso px-4 md:px-12 py-6 md:py-8">
      <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
        {items.map(({ num, label, icon }, i) => (
          <div key={label} className={`text-center py-2 ${i < 3 ? 'md:border-r border-white/10' : ''}`}>
            <div className="text-xl mb-1">{icon}</div>
            <div className="font-display font-extrabold text-xl md:text-3xl text-coral mb-0.5">{num}</div>
            <div className="text-[11px] md:text-sm text-gray-light font-semibold leading-tight">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ZVÍŘATA K ADOPCI ── */
function AnimalsSection({ animals }: { animals: any[] }) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-12 bg-warm">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              🐾 K adopci
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-4xl text-espresso leading-tight">
              Zvířata čekající na nový domov
            </h2>
          </div>
          <Link href="/adopt" className="hidden md:block flex-shrink-0 ml-4">
            <Button variant="ghost">Zobrazit vše →</Button>
          </Link>
        </div>

        {animals.length === 0 ? (
          <div className="text-center py-12 text-gray">Načítám zvířata...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {animals.slice(0, 8).map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}

        <div className="text-center mt-6 md:hidden">
          <Link href="/adopt">
            <Button variant="ghost" className="w-full justify-center">Zobrazit všechna zvířata →</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function AnimalCard({ animal }: { animal: any }) {
  return (
    <Link href={`/animals/${animal.id}`} className="no-underline">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-pale hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className="relative h-36 md:h-44 bg-gradient-to-br from-sand to-coral-light flex-shrink-0">
          {animal.primary_photo ? (
            <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {animal.species?.icon ?? '🐾'}
            </div>
          )}
          {animal.urgent && <Badge variant="urgent" className="absolute top-2 left-2" />}
          <FavoriteButtonWrapper type="animal" id={animal.id} size="sm" className="absolute top-2 right-2" />
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-pill px-2 py-0.5">
            <span className="text-[10px] font-bold text-espresso">{animal.institution?.city}</span>
          </div>
        </div>
        <div className="p-3 md:p-4 flex flex-col flex-1">
          <div className="font-display font-extrabold text-sm md:text-lg text-espresso mb-0.5 leading-tight">{animal.name}</div>
          <div className="text-xs text-gray mb-2">
            {animal.species?.name_cs}
            {animal.birth_year && ` · ${new Date().getFullYear() - animal.birth_year} let`}
          </div>
          <div className="flex flex-wrap gap-1 mt-auto">
            {animal.neutered     && <Tag label="Kastrovaný"  variant="green" />}
            {animal.vaccinated   && <Tag label="Očkovaný"    variant="green" />}
            {animal.good_with_kids && <Tag label="Miluje děti" variant="coral" />}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── ZÁCHRANNÉ STANICE + SBÍRKY ── */
function RescueSection({ cases, fundraisers }: { cases: any[], fundraisers: any[] }) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-12" style={{ background: '#F5F0EB' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">

          {/* Záchranné případy */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-rescue-bg text-rescue-dark font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              🦉 Záchranné stanice
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-5 leading-tight">
              Volně žijící zvířata<br />potřebují tvoji pomoc
            </h2>

            <div className="space-y-3 mb-6">
              {cases.slice(0, 3).map(c => (
                <Link key={c.id} href={`/rescue/${c.id}`} className="no-underline">
                  <div className="flex items-center gap-4 bg-white rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all border border-[#E8E3DD]">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-rescue-bg flex items-center justify-center text-2xl flex-shrink-0">
                      {c.primary_photo ? (
                        <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover" sizes="56px" />
                      ) : (
                        <span>{c.species?.icon ?? '🐾'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm text-espresso truncate">{c.name ?? c.case_number}</div>
                      <div className="text-xs text-gray">{c.species?.name_cs} · {c.institution?.city}</div>
                      {c.cause_of_injury && (
                        <div className="text-xs text-brown-mid mt-0.5 line-clamp-1">{c.cause_of_injury}</div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 bg-rescue-bg text-rescue-dark">
                      {c.status === 'treatment' ? '🩺 Léčba' : c.status === 'rehabilitation' ? '💪 Rehab' : '🚑 Příjem'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link href="/rescue">
              <Button variant="ghost-rescue">Všechny záchranné stanice →</Button>
            </Link>
          </div>

          {/* Sbírky */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              💛 Aktivní sbírky
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-5 leading-tight">
              Přispěj útulku<br />nebo záchranné stanici
            </h2>

            <div className="space-y-3 mb-6">
              {fundraisers.slice(0, 3).map(f => {
                const percent  = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
                const isShelter = f.institution?.type === 'shelter'
                return (
                  <Link key={f.id} href={`/fundraisers/${f.id}`} className="no-underline block">
                    <div className="bg-white rounded-2xl p-4 border border-[#E8E3DD] hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm text-espresso leading-tight truncate">{f.title}</div>
                          <div className="text-xs text-gray mt-0.5">{f.institution?.name}</div>
                        </div>
                        <span className="text-lg flex-shrink-0">
                          {isShelter ? '🏠' : '🦉'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-bold text-espresso">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                        <span className="text-gray">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${percent}%`,
                          background: isShelter ? '#E8634A' : '#2E9E8F',
                        }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <Link href="/fundraisers">
              <Button variant="amber">💛 Zobrazit všechny sbírky</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── PŘÍBĚHY ── */
function StoriesSection({ articles, pinnedArticle }: { articles: any[]; pinnedArticle: any | null }) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-12 bg-warm">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-coral-light text-coral-dark font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              📖 Příběhy
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-4xl text-espresso leading-tight">
              Příběhy, které zahřejí srdce
            </h2>
          </div>
          <Link href="/articles" className="hidden md:block flex-shrink-0 ml-4">
            <Button variant="ghost">Číst více →</Button>
          </Link>
        </div>

        {/* Hero připnutý článek */}
        {pinnedArticle && (
          <Link href={`/articles/${pinnedArticle.slug}`} className="no-underline block mb-6 group">
            <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-pale shadow-sm hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-48 md:h-64 bg-gradient-to-br from-sand to-coral-light">
                  {pinnedArticle.cover_url ? (
                    <Image src={pinnedArticle.cover_url} alt={pinnedArticle.title} fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width:768px) 100vw, 600px" loading="eager" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-amber text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      📌 Doporučujeme
                    </span>
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <span className="text-xs font-bold text-coral-dark mb-2 block">📖 Příběh</span>
                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-espresso mb-3 leading-tight group-hover:text-coral transition-colors">
                    {pinnedArticle.title}
                  </h3>
                  {pinnedArticle.perex && (
                    <p className="text-sm text-brown-mid leading-relaxed line-clamp-3 mb-4">
                      {pinnedArticle.perex}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray">
                    {pinnedArticle.institution?.name && (
                      <span className="font-semibold text-espresso">{pinnedArticle.institution.name}</span>
                    )}
                    {pinnedArticle.published_at && (
                      <>
                        <span>·</span>
                        <span>{new Date(pinnedArticle.published_at).toLocaleDateString('cs-CZ')}</span>
                      </>
                    )}
                  </div>
                  <span className="mt-4 text-sm font-bold text-coral inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Číst příběh →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Ostatní články */}
        {articles.length === 0 && !pinnedArticle ? (
          <div className="text-center py-10 text-gray text-sm">Žádné příběhy zatím nejsou k dispozici.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {articles
              .filter(a => a.id !== pinnedArticle?.id)
              .slice(0, 4)
              .map((a: any) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-pale shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all h-full flex flex-col">
                    {a.cover_url ? (
                      <div className="relative h-32 md:h-40 flex-shrink-0">
                        <Image src={a.cover_url} alt={a.title} fill className="object-cover" sizes="(max-width:640px) 50vw, 33vw" />
                      </div>
                    ) : (
                      <div className="h-32 md:h-40 bg-gradient-to-br from-coral-light to-sand flex items-center justify-center text-4xl flex-shrink-0">
                        📖
                      </div>
                    )}
                    <div className="p-3 md:p-5 flex flex-col flex-1">
                      <h3 className="font-display font-extrabold text-sm md:text-base text-espresso mb-1.5 line-clamp-2 leading-tight flex-1">{a.title}</h3>
                      {a.perex && (
                        <p className="text-xs text-brown-mid leading-relaxed mb-2 line-clamp-2 hidden md:block">{a.perex}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-pale">
                        <span className="text-[11px] text-gray font-semibold truncate">{a.institution?.name ?? 'Zozio'}</span>
                        <span className="text-[11px] text-gray flex-shrink-0 ml-2">
                          {a.published_at ? new Date(a.published_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}

        <div className="text-center mt-6 md:hidden">
          <Link href="/articles">
            <Button variant="ghost" className="w-full justify-center">Číst více příběhů →</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── PRO INSTITUCE ── */
function InstitutionsCta() {
  return (
    <section className="py-12 md:py-16 px-4 md:px-12 bg-espresso">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-display font-extrabold text-xs text-amber uppercase tracking-wider mb-2">Pro útulky a záchranné stanice</div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight">
            Spravujte svou instituci<br className="hidden md:block" /> online přes Zozio
          </h2>
          <p className="text-sm text-gray-light mt-2 max-w-[400px]">
            Adopce, záchranné případy, sbírky, dobrovolníci — vše na jednom místě. Začněte zdarma.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/pro-instituce" className="w-full sm:w-auto">
            <Button variant="amber" size="lg" className="justify-center w-full">Zjistit více</Button>
          </Link>
          <Link href="/auth/register" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center px-8 py-[17px] rounded-pill font-display font-bold text-base text-white border-2 border-white/30 hover:bg-white/10 transition-all cursor-pointer">
              Registrovat instituci →
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── DATA ── */
async function getFeaturedAnimals() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('animals')
    .select('id, name, species:animal_species(name_cs,icon), institution:institutions(name,city,type), primary_photo, urgent, adoption_status, birth_year, neutered, vaccinated, good_with_kids')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8)
  return data ?? []
}

async function getFeaturedRescueCases() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, species:animal_species(name_cs,icon), institution:institutions(name,city), primary_photo, status, cause_of_injury')
    .eq('published', true)
    .in('status', ['intake', 'treatment', 'rehabilitation'])
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getActiveFundraisers() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('id, title, goal_amount, current_amount, institution:institutions(name,type)')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getStats() {
  const supabase = createServiceClient()
  const [animalsRes, adoptedRes, institutionsRes] = await Promise.all([
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('published', true).eq('adoption_status', 'available'),
    supabase.from('adoption_applications').select('id', { count: 'exact', head: true }).eq('status', 'adopted'),
    supabase.from('institutions').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
  ])
  return {
    availableAnimals: animalsRes.count ?? 0,
    adoptedTotal:     adoptedRes.count ?? 0,
    institutionCount: institutionsRes.count ?? 0,
  }
}

async function getLatestArticles() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, published_at, institution:institutions(name)')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(5)
  return data ?? []
}

async function getPinnedArticle() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, published_at, institution:institutions(name)')
    .eq('published', true)
    .eq('pinned', true)
    .single()
  return data ?? null
}

async function getSpecies() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('animal_species')
    .select('id, name_cs, icon')
    .order('name_cs')
  return data ?? []
}
