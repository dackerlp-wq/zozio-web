import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { InstitutionTabs } from '@/components/public/InstitutionTabs'
import { FavoriteButton } from '@/components/public/FavoriteButton'

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

  const [animals, rescueCases, fundraisers, articles, volunteers] = await Promise.all([
    isShelter ? getAnimals(i.id)      : Promise.resolve([]),
    !isShelter ? getRescueCases(i.id) : Promise.resolve([]),
    getFundraisers(i.id),
    getArticles(i.id),
    getVolunteerCount(i.id),
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
    <main className="min-h-screen" style={{ background: '#FFFCF8' }}>

      {/* ── Cover ── */}
      <div className="relative h-44 md:h-60 overflow-hidden"
        style={{ background: isShelter
          ? 'linear-gradient(135deg, #2C1810 0%, #E8634A 100%)'
          : 'linear-gradient(135deg, #1C2E28 0%, #2E9E8F 100%)' }}>
        {i.cover_url && (
          <Image src={i.cover_url} alt="" role="presentation" fill className="object-cover opacity-50" />
        )}
        {/* Gradient overlay dole */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)' }} />

        {/* ❤️ Favorite button vpravo nahoře */}
        <div className="absolute top-4 right-4 md:right-10 z-10">
          <FavoriteButton type="institution" id={i.id} />
        </div>

        {/* Název přímo v coveru dole */}
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-10 pb-5 max-w-[1100px] mx-auto">
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg border-4 border-white flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl shadow-lg"
              style={{ background: isShelter ? '#FAECE7' : '#E1F5EE' }}>
              {i.logo_url
                ? <Image src={i.logo_url} alt={i.name} width={96} height={96} className="object-cover" />
                : <span>{isShelter ? '🏠' : '🚑'}</span>
              }
            </div>
            {/* Název na tmavém pozadí coveru */}
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
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
              <h1 className="font-display font-extrabold text-white leading-tight"
                style={{ fontSize: 'clamp(18px, 3vw, 30px)', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {i.name}
              </h1>
              {i.city && (
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.92)' }}>📍 {i.city}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Statistiky ── */}
      <div className="border-b border-[#F0EDE8] bg-white">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <dl className="grid grid-cols-4">
            {[
              {
                num:   isShelter ? (animals as any[]).length : (rescueCases as any[]).length,
                label: isShelter ? 'zvířat' : 'záchranných případů',
                color: isShelter ? '#E8634A' : '#2E9E8F',
              },
              { num: (fundraisers as any[]).filter((f: any) => f.active).length, label: 'aktivních sbírek', color: '#F0A500' },
              { num: volunteers, label: 'dobrovolníků', color: '#6B4030' },
              { num: (articles as any[]).length, label: 'příběhů', color: '#6B4030' },
            ].map(({ num, label, color }) => (
              <div key={label} className="px-4 md:px-6 py-3 md:py-4 border-r border-[#F0EDE8] last:border-r-0 first:pl-0">
                <dd className="font-display font-extrabold text-xl md:text-2xl" style={{ color }}>{num}</dd>
                <dt className="text-[11px] md:text-xs font-medium mt-0.5 leading-tight" style={{ color: '#6B4030' }}>{label}</dt>
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
  const { data } = await supabase
    .from('animals')
    .select('id, name, breed, birth_year, sex, size, primary_photo, urgent, adoption_status, vaccinated, neutered, microchipped, good_with_kids, good_with_dogs, good_with_cats, species:animal_species(name_cs,icon)')
    .eq('institution_id', id)
    .eq('published', true)
    .in('adoption_status', ['available', 'reserved', 'foster'])
    .or('in_quarantine.is.null,in_quarantine.eq.false')
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
