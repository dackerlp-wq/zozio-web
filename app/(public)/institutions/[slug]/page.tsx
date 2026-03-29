import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { InstitutionTabs } from '@/components/public/InstitutionTabs'

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

      {/* ── Cover + header ── */}
      <div className="relative">

        {/* Cover foto */}
        <div className="h-40 md:h-56 relative overflow-hidden"
          style={{ background: isShelter
            ? 'linear-gradient(135deg, #3D2015 0%, #E8634A 100%)'
            : 'linear-gradient(135deg, #1C2E28 0%, #2E9E8F 100%)' }}>
          {i.cover_url && (
            <Image src={i.cover_url} alt={i.name} fill className="object-cover opacity-60" />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
        </div>

        {/* Profile info — pod coverem */}
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">

          {/* Logo + název */}
          <div className="flex items-start gap-5 py-5 border-b border-[#F0EDE8]">

            {/* Logo — vystupuje z coveru */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl shadow-md -mt-10 md:-mt-12"
              style={{ background: isShelter ? '#FAECE7' : '#E1F5EE' }}>
              {i.logo_url
                ? <Image src={i.logo_url} alt={i.name} width={96} height={96} className="object-cover" />
                : <span>{isShelter ? '🏠' : '🚑'}</span>
              }
            </div>

            {/* Název + meta */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={isShelter
                    ? { background: '#FAECE7', color: '#993C1D' }
                    : { background: '#E1F5EE', color: '#0F6E56' }}>
                  {isShelter ? '🏠 Útulek' : '🚑 Záchranná stanice'}
                </span>
                {i.approval_status === 'approved' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                    ✓ Ověřeno
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-[#1A0F0A] leading-tight"
                style={{ fontSize: 'clamp(20px, 3.5vw, 32px)' }}>
                {i.name}
              </h1>
              {i.city && (
                <p className="text-sm mt-1" style={{ color: '#8B6550' }}>📍 {i.city}</p>
              )}
            </div>
          </div>

          {/* Statistiky */}
          <div className="flex flex-wrap gap-8 py-5 border-b border-[#F0EDE8]">
            {[
              {
                num:   isShelter ? (animals as any[]).length : (rescueCases as any[]).length,
                label: isShelter ? 'zvířat' : 'záchranných případů',
              },
              { num: (fundraisers as any[]).filter((f: any) => f.active).length, label: 'aktivních sbírek' },
              { num: volunteers, label: 'dobrovolníků' },
              { num: (articles as any[]).length, label: 'příběhů' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="font-display font-extrabold text-2xl text-[#1A0F0A]">{num}</div>
                <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Taby + obsah ── */}
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('institutions')
    .select('*')
    .eq('slug', slug)
    .eq('approval_status', 'approved')
    .single()
  return data
}

async function getAnimals(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animals')
    .select('id, name, breed, birth_year, primary_photo, urgent, adoption_status, vaccinated, neutered, species:animal_species(name_cs,icon)')
    .eq('institution_id', id)
    .eq('published', true)
    .in('adoption_status', ['available', 'reserved', 'foster'])
    .or('in_quarantine.is.null,in_quarantine.eq.false')
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getRescueCases(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, status, cause_of_injury, primary_photo, species:animal_species(name_cs,icon)')
    .eq('institution_id', id)
    .eq('published', true)
    .not('status', 'in', '("deceased")')
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getFundraisers(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('id, title, description, goal_amount, current_amount, active')
    .eq('institution_id', id)
    .order('active', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getArticles(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex, cover_url, category, published_at')
    .eq('institution_id', id)
    .eq('published', true)
    .order('published_at', { ascending: false })
  return data ?? []
}

async function getVolunteerCount(id: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('volunteers')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', id)
    .eq('status', 'active')
  return count ?? 0
}
