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
  const isShelter = i.type === 'shelter'
  const activeTab = tab ?? (isShelter ? 'animals' : 'rescue')

  // Auth stav pro tlačítka
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient()

  const [animals, rescueCases, fundraisers, articles, volunteers, favRow, volunteerRow] = await Promise.all([
    isShelter ? getAnimals(i.id)      : Promise.resolve([]),
    !isShelter ? getRescueCases(i.id) : Promise.resolve([]),
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
    ...(isShelter
      ? [{ id: 'animals',    label: 'Zvířata',          count: (animals as any[]).length }]
      : [{ id: 'rescue',     label: 'Záchranné případy', count: (rescueCases as any[]).length }]
    ),
    { id: 'fundraisers', label: 'Sbírky',    count: (fundraisers as any[]).length },
    { id: 'stories',     label: 'Příběhy',   count: (articles as any[]).length },
    { id: 'about',       label: 'O nás',     count: null },
    { id: 'contact',     label: 'Kontakt',   count: null },
  ]

  return (
    <main className="min-h-screen bg-warm">

      {/* ── Cover ── */}
      <div className="relative h-44 md:h-60 overflow-hidden"
        style={{ background: isShelter
          ? 'linear-gradient(135deg, var(--espresso) 0%, var(--coral) 100%)'
          : 'linear-gradient(135deg, #1C2E28 0%, var(--rescue) 100%)' }}>
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
                style={{ background: isShelter ? '#FAECE7' : '#E1F5EE' }}>
                {i.logo_url
                  ? <Image src={i.logo_url} alt={i.name} width={96} height={96} className="object-cover" />
                  : <span>{isShelter ? '🏠' : '🚑'}</span>
                }
              </div>
              <div className="pb-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={isShelter
                      ? { background: 'rgba(232,99,74,0.25)', color: '#FFD4C2', border: '1px solid rgba(232,99,74,0.35)' }
                      : { background: 'rgba(46,158,143,0.25)', color: '#A8F0E4', border: '1px solid rgba(46,158,143,0.35)' }}>
                    {isShelter ? '🏠 Útulek' : '🚑 Záchranná stanice'}
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
          <dl className="grid grid-cols-4">
            {[
              {
                num:   isShelter ? (animals as any[]).length : (rescueCases as any[]).length,
                label: isShelter ? 'zvířat' : 'záchranných případů',
                color: isShelter ? 'var(--coral)' : 'var(--rescue)',
              },
              { num: (fundraisers as any[]).filter((f: any) => f.active).length, label: 'aktivních sbírek', color: 'var(--amber)' },
              { num: volunteers, label: 'dobrovolníků', color: 'var(--text-muted)' },
              { num: (articles as any[]).length, label: 'příběhů', color: 'var(--text-muted)' },
            ].map(({ num, label, color }) => (
              <div key={label} className="px-6 py-4 border-r border-border last:border-r-0 first:pl-0">
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
          isShelter={isShelter}
          animals={animals as any[]}
          rescueCases={rescueCases as any[]}
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

async function getRescueCases(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, status, intake_date, cause_of_injury, primary_photo, species:animal_species(name_cs,icon)')
    .eq('institution_id', id)
    .eq('published', true)
    .not('status', 'in', '("deceased")')
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
