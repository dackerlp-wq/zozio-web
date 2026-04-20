import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { InstitutionTabs } from '@/components/public/InstitutionTabs'
import { InstitutionActions } from '@/components/public/InstitutionActions'

interface PageProps {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const inst = await getInstitution(slug)
  if (!inst) return { title: 'Instituce nenalezena | Zozio' }
  const i = inst as any
  return {
    title:       `${i.name} | Zozio`,
    description: i.short_description ?? i.description?.slice(0, 155) ?? '',
    openGraph:   { title: i.name, images: i.cover_url ? [{ url: i.cover_url }] : [] },
  }
}

export default async function InstitutionProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { tab }  = await searchParams

  const inst = await getInstitution(slug)
  if (!inst) notFound()

  const i         = inst as any
  const activeTab = tab ?? 'animals'

  // Auth stav pro tlačítka
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient()

  const [animals, fundraisers, articles, volunteers, favRow, volunteerRow] = await Promise.all([
    getAnimals(i.id),
    getFundraisers(i.id),
    getArticles(i.id),
    getVolunteerCount(i.id),

    user
      ? service.from('institution_favorites').select('id').eq('user_id', user.id).eq('institution_id', i.id).maybeSingle()
      : Promise.resolve({ data: null }),

    user
      ? service.from('volunteers').select('status').eq('user_id', user.id).eq('institution_id', i.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const tabs = [
    { id: 'animals',    label: 'Zvířata',  count: (animals as any[]).length },
    { id: 'fundraisers', label: 'Sbírky',  count: (fundraisers as any[]).length },
    { id: 'stories',     label: 'Příběhy', count: (articles as any[]).length },
    { id: 'about',       label: 'O nás',   count: null },
    { id: 'contact',     label: 'Kontakt', count: null },
  ]

  return (
    <main className="min-h-screen bg-warm">

      {/* ── Cover ── */}
      <div className="relative h-44 md:h-60 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--espresso) 0%, var(--coral) 100%)' }}>
        {i.cover_url && (
          <Image src={i.cover_url} alt="" role="presentation" fill className="object-cover opacity-50" />
        )}
        {/* Gradient overlay dole */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)' }} />

        {/* Název + akce v coveru dole */}
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-10 pb-5 max-w-[1100px] mx-auto">
          <div className="flex items-end justify-between gap-3">

            {/* Levá část — logo + název */}
            <div className="flex items-end gap-4 min-w-0">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-lg border-4 border-white flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl shadow-lg"
                style={{ background: '#FAECE7' }}>
                {i.logo_url
                  ? <Image src={i.logo_url} alt={i.name} width={96} height={96} className="object-cover" />
                  : <span>🏠</span>
                }
              </div>
              <div className="pb-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(232,99,74,0.25)', color: '#FFD4C2', border: '1px solid rgba(232,99,74,0.35)' }}>
                    🏠 Útulek
                  </span>
                  {i.approval_status === 'approved' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(59,109,17,0.30)', color: '#AADDA8', border: '1px solid rgba(59,109,17,0.35)' }}>
                      ✓ Ověřeno
                    </span>
                  )}
                </div>
                <h1 className="font-display font-extrabold text-white leading-tight truncate"
                  style={{ fontSize: 'clamp(16px, 3vw, 30px)', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  {i.name}
                </h1>
                {i.city && (
                  <p className="text-xs md:text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.92)' }}>📍 {i.city}</p>
                )}
              </div>
            </div>

            {/* Pravá část — akční tlačítka */}
            <div className="flex-shrink-0 pb-1">
              <InstitutionActions
                institution={{ id: i.id, name: i.name, slug: i.slug, type: i.type, city: i.city, logo_url: i.logo_url ?? null }}
                initialFav={!!(favRow as any)?.data}
                volunteerStatus={((volunteerRow as any)?.data?.status ?? 'none') as any}
                isLoggedIn={!!user}
                userEmail={user?.email ?? ''}
                userName={user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── Statistiky ── */}
      <div className="border-b border-border bg-white">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            {[
              { num: (animals as any[]).length,                                  label: 'zvířat',           color: 'var(--coral)' },
              { num: (fundraisers as any[]).filter((f: any) => f.active).length, label: 'aktivních sbírek', color: 'var(--amber)' },
              { num: volunteers,                                                  label: 'dobrovolníků',     color: 'var(--text-muted)' },
              { num: (articles as any[]).length,                                  label: 'příběhů',          color: 'var(--text-muted)' },
            ].map(({ num, label, color }, i) => (
              <div key={label} className="px-4 sm:px-6 py-3 sm:py-4 border-border"
                style={{ borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="font-display font-extrabold text-2xl" style={{ color }}>{num}</div>
                <div className="text-xs font-medium mt-0.5 text-text-muted">{label}</div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── Taby + obsah ── */}
      <div className="max-w-[1100px] mx-auto px-0 md:px-10 pb-16">
        <InstitutionTabs
          tabs={tabs}
          activeTab={activeTab}
          slug={slug}
          institution={i}
          animals={animals as any[]}
          fundraisers={fundraisers as any[]}
          articles={articles as any[]}
        />
      </div>
    </main>
  )
}

/* ── Data ── */

async function getInstitution(slug: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('institutions')
    .select('*')
    .eq('slug', slug)
    .eq('approval_status', 'approved')
    .single()
  return data
}

async function getAnimals(id: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('animals')
    .select('id, name, breed, birth_year, sex, size, primary_photo, urgent, adoption_status, vaccinated, neutered, microchipped, good_with_kids, good_with_dogs, good_with_cats, good_with_other_animals, activity_level, care_difficulty, suitable_for_flat, suitable_for_house, species:animal_species(id, name_cs, icon)')
    .eq('institution_id', id)
    .or('published.eq.true,adoption_status.eq.conditional')
    .in('adoption_status', ['available', 'reserved', 'foster', 'conditional'])
    .or(`quarantine_end.is.null,quarantine_end.lt.${today},adoption_status.eq.conditional`)
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getFundraisers(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('id, title, description, goal_amount, current_amount, active, deadline, image_url, darujme_url, darujme_donors_count, darujme_synced_at')
    .eq('institution_id', id)
    .order('active', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getArticles(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, category, published_at')
    .eq('institution_id', id)
    .eq('published', true)
    .order('published_at', { ascending: false })
  return data ?? []
}

async function getVolunteerCount(id: string) {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('volunteers')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', id)
    .eq('status', 'active')
  return count ?? 0
}
