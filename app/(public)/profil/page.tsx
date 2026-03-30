import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { FavoriteButton } from '@/components/public/FavoriteButton'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/profil')

  const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'příteli'

  // Načti vše najednou
  const [
    { data: favAnimals },
    { data: favInstitutions },
    { data: volunteers },
  ] = await Promise.all([
    supabase
      .from('animal_favorites')
      .select('animal_id, created_at, animal:animals(id, name, primary_photo, adoption_status, species:animal_species(name_cs, icon), institution:institutions(name, city))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('institution_favorites')
      .select('institution_id, created_at, institution:institutions(id, name, slug, type, city, logo_url, short_description)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('volunteers')
      .select('id, status, created_at, institution:institutions(name, slug, city)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Aktuality z oblíbených institucí — nová zvířata + články
  const favInstIds = (favInstitutions ?? []).map((f: any) => f.institution_id)

  const [{ data: newAnimals }, { data: newArticles }] = await Promise.all([
    favInstIds.length
      ? supabase
          .from('animals')
          .select('id, name, primary_photo, adoption_status, created_at, species:animal_species(name_cs, icon), institution:institutions(name, slug)')
          .in('institution_id', favInstIds)
          .eq('published', true)
          .eq('adoption_status', 'available')
          .order('created_at', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),

    favInstIds.length
      ? supabase
          .from('articles')
          .select('id, title, slug, perex, cover_url, published_at, institution:institutions(name, slug)')
          .in('institution_id', favInstIds)
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
  ])

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    pending:  { label: '⏳ Čeká',     bg: '#FAEEDA', color: '#854F0B' },
    approved: { label: '✓ Schváleno', bg: '#EAF3DE', color: '#3B6D11' },
    rejected: { label: '✗ Zamítnuto', bg: '#FAECE7', color: '#993C1D' },
  }

  const adoptionLabel: Record<string, string> = {
    available:        'K adopci',
    reserved:         'Rezervováno',
    adopted:          'Adoptováno',
    not_for_adoption: 'Není k adopci',
  }

  const hasFeed = (newAnimals?.length ?? 0) + (newArticles?.length ?? 0) > 0

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1000px] mx-auto px-5 md:px-10">

        {/* Header */}
        <div className="py-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8B6550' }}>Můj profil</p>
            <h1 className="font-display font-extrabold text-2xl text-[#1A0F0A]">
              Ahoj, {name.split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#8B6550' }}>{user.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/adopt"
              className="px-4 py-2 rounded-xl text-sm font-bold no-underline border hover:opacity-80 transition-all"
              style={{ borderColor: '#E8634A', color: '#E8634A', background: 'white' }}>
              + Najít zvíře
            </Link>
            <form action="/auth/logout" method="POST">
              <button type="submit"
                className="px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer bg-white hover:opacity-80 transition-all"
                style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                Odhlásit
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── Levý sloupec — Feed + zvířata ── */}
          <div className="space-y-6">

            {/* Aktuality z oblíbených institucí */}
            <section className="bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EDE8] flex items-center justify-between">
                <h2 className="font-bold text-[#1A0F0A]">
                  Aktuality od oblíbených
                  {hasFeed && <span className="ml-2 w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: '#E8634A' }}>
                    {(newAnimals?.length ?? 0) + (newArticles?.length ?? 0)}
                  </span>}
                </h2>
              </div>

              {!hasFeed ? (
                <div className="text-center py-12 px-5">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="font-bold text-[#1A0F0A] mb-1">Zatím žádné aktuality</p>
                  <p className="text-sm mb-5" style={{ color: '#8B6550' }}>
                    Sleduj útulky a záchranné stanice — uvidíš jejich nová zvířata a příběhy.
                  </p>
                  <Link href="/institutions"
                    className="inline-flex px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
                    style={{ background: '#E8634A' }}>
                    Najít útulek →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#F0EDE8]">

                  {/* Nová zvířata */}
                  {(newAnimals ?? []).map((a: any) => (
                    <Link key={a.id} href={`/animals/${a.id}`} className="no-underline group">
                      <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAF8] transition-all">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center"
                          style={{ background: '#FAECE7' }}>
                          {a.primary_photo
                            ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover" />
                            : <span className="text-xl">{a.species?.icon ?? '🐾'}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FAECE7', color: '#993C1D' }}>
                              🐾 Nové zvíře
                            </span>
                            <span className="text-[10px]" style={{ color: '#8B6550' }}>
                              {(a.institution as any)?.name}
                            </span>
                          </div>
                          <div className="font-semibold text-sm text-[#1A0F0A] truncate">{a.name}</div>
                          <div className="text-xs" style={{ color: '#8B6550' }}>
                            {a.species?.name_cs} · {adoptionLabel[a.adoption_status] ?? a.adoption_status}
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}>
                          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  ))}

                  {/* Nové články */}
                  {(newArticles ?? []).map((a: any) => (
                    <Link key={a.id} href={`/articles/${a.slug}`} className="no-underline group">
                      <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAF8] transition-all">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center"
                          style={{ background: '#FAEEDA' }}>
                          {a.cover_url
                            ? <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                            : <span className="text-xl">📖</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                              📖 Nový příběh
                            </span>
                            <span className="text-[10px]" style={{ color: '#8B6550' }}>
                              {(a.institution as any)?.name}
                            </span>
                          </div>
                          <div className="font-semibold text-sm text-[#1A0F0A] line-clamp-1">{a.title}</div>
                          {a.perex && (
                            <div className="text-xs line-clamp-1" style={{ color: '#8B6550' }}>{a.perex}</div>
                          )}
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#C8C5BF', flexShrink: 0 }}>
                          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Oblíbená zvířata */}
            <section className="bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EDE8] flex items-center justify-between">
                <h2 className="font-bold text-[#1A0F0A]">
                  Oblíbená zvířata
                  {(favAnimals?.length ?? 0) > 0 && (
                    <span className="ml-2 text-sm font-normal" style={{ color: '#8B6550' }}>
                      {favAnimals!.length}
                    </span>
                  )}
                </h2>
                <Link href="/adopt" className="text-xs font-bold no-underline hover:opacity-70" style={{ color: '#E8634A' }}>
                  Hledat →
                </Link>
              </div>

              {!favAnimals?.length ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">🐾</div>
                  <p className="text-sm" style={{ color: '#8B6550' }}>
                    Klikni na ❤️ u zvířete a uloží se sem.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                  {favAnimals.map((f: any) => {
                    const a = f.animal as any
                    return (
                      <Link key={a.id} href={`/animals/${a.id}`} className="no-underline group">
                        <div className="rounded-xl overflow-hidden border border-[#F0EDE8] hover:-translate-y-0.5 transition-all relative">
                          <div className="h-28 relative flex items-center justify-center" style={{ background: '#FAECE7' }}>
                            {a.primary_photo
                              ? <Image src={a.primary_photo} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                              : <span className="text-3xl">{a.species?.icon ?? '🐾'}</span>
                            }
                            <div className="absolute top-2 right-2">
                              <FavoriteButton type="animal" id={a.id} initialFav size="sm" />
                            </div>
                            {a.adoption_status !== 'available' && (
                              <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-[10px] font-bold text-white"
                                style={{ background: 'rgba(0,0,0,0.5)' }}>
                                {adoptionLabel[a.adoption_status]}
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <div className="font-bold text-xs text-[#1A0F0A] truncate">{a.name}</div>
                            <div className="text-[10px] truncate" style={{ color: '#8B6550' }}>
                              {a.species?.name_cs} · {(a.institution as any)?.city}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Pravý sloupec ── */}
          <div className="space-y-5">

            {/* Oblíbené instituce */}
            <section className="bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden">
              <div className="px-4 py-4 border-b border-[#F0EDE8] flex items-center justify-between">
                <h2 className="font-bold text-sm text-[#1A0F0A]">Sledované instituce</h2>
                <Link href="/institutions" className="text-xs font-bold no-underline hover:opacity-70" style={{ color: '#E8634A' }}>
                  Hledat →
                </Link>
              </div>

              {!favInstitutions?.length ? (
                <div className="text-center py-8 px-4">
                  <div className="text-3xl mb-2">🏠</div>
                  <p className="text-xs" style={{ color: '#8B6550' }}>
                    Sleduj útulky a vidíš jejich aktuality zde.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0EDE8]">
                  {favInstitutions.map((f: any) => {
                    const inst = f.institution as any
                    const isShelter = inst.type === 'shelter'
                    return (
                      <div key={inst.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-base"
                          style={{ background: isShelter ? '#FAECE7' : '#E1F5EE' }}>
                          {inst.logo_url
                            ? <Image src={inst.logo_url} alt={inst.name} width={36} height={36} className="object-cover" />
                            : <span>{isShelter ? '🏠' : '🚑'}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/institutions/${inst.slug}`}
                            className="font-semibold text-xs text-[#1A0F0A] truncate block no-underline hover:opacity-70">
                            {inst.name}
                          </Link>
                          <div className="text-[10px]" style={{ color: '#8B6550' }}>📍 {inst.city}</div>
                        </div>
                        <FavoriteButton type="institution" id={inst.id} initialFav size="sm" />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Dobrovolnické přihlášky */}
            <section className="bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden">
              <div className="px-4 py-4 border-b border-[#F0EDE8]">
                <h2 className="font-bold text-sm text-[#1A0F0A]">Dobrovolnictví</h2>
              </div>

              {!volunteers?.length ? (
                <div className="text-center py-8 px-4">
                  <div className="text-3xl mb-2">🙋</div>
                  <p className="text-xs mb-3" style={{ color: '#8B6550' }}>
                    Přihlas se jako dobrovolník na profilu útulku.
                  </p>
                  <Link href="/institutions"
                    className="inline-flex px-4 py-2 rounded-xl text-xs font-bold text-white no-underline"
                    style={{ background: '#E8634A' }}>
                    Najít útulek
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#F0EDE8]">
                  {volunteers.map((v: any) => {
                    const inst = v.institution as any
                    const st = statusConfig[v.status ?? 'pending']
                    return (
                      <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-[#1A0F0A] truncate">{inst?.name}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: '#8B6550' }}>
                            {new Date(v.created_at).toLocaleDateString('cs-CZ')}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Rychlé akce */}
            <div className="space-y-2">
              <Link href="/adopt"
                className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#F0EDE8] no-underline hover:-translate-y-0.5 transition-all">
                <span className="text-xl">🐾</span>
                <span className="text-sm font-semibold text-[#1A0F0A]">Hledat zvíře k adopci</span>
              </Link>
              <Link href="/rescue"
                className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#F0EDE8] no-underline hover:-translate-y-0.5 transition-all">
                <span className="text-xl">🦉</span>
                <span className="text-sm font-semibold text-[#1A0F0A]">Záchranné stanice</span>
              </Link>
              <Link href="/fundraisers"
                className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#F0EDE8] no-underline hover:-translate-y-0.5 transition-all">
                <span className="text-xl">💛</span>
                <span className="text-sm font-semibold text-[#1A0F0A]">Přispět sbírce</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
