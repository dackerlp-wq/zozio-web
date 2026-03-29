import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PhotoGallery } from '@/components/public/PhotoGallery'
import { AdoptionForm } from '@/components/public/AdoptionForm'
import { ShareButtons } from '@/components/public/ShareButtons'
import { StickyPanel } from '@/components/public/StickyPanel'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const animal  = await getAnimal(id)
  if (!animal) return { title: 'Zvíře nenalezeno | Zozio' }
  const a = animal as any
  return {
    title:       `${a.name} — Adopce | Zozio`,
    description: a.description?.slice(0, 155) ?? `Adoptuj ${a.name} z útulku.`,
    openGraph: {
      title:       `${a.name} hledá domov | Zozio`,
      description: a.description?.slice(0, 155) ?? '',
      images:      a.primary_photo ? [{ url: a.primary_photo }] : [],
    },
  }
}

export default async function AnimalDetailPage({ params }: PageProps) {
  const { id }  = await params
  const animal  = await getAnimal(id)
  if (!animal) notFound()

  const a           = animal as any
  const institution = a.institution as any
  const species     = a.species     as any
  const similar     = await getSimilarAnimals(id, a.species_id, a.institution_id)
  const article     = await getLinkedArticle(id)

  const isAvailable = a.adoption_status === 'available'
  const isReserved  = a.adoption_status === 'reserved'
  const shareUrl    = `${BASE}/animals/${id}`

  const age = a.birth_year
    ? `${new Date().getFullYear() - a.birth_year} ${new Date().getFullYear() - a.birth_year === 1 ? 'rok' : new Date().getFullYear() - a.birth_year < 5 ? 'roky' : 'let'}`
    : null

  const sexLabel = a.sex === 'male' ? '♂ Samec' : a.sex === 'female' ? '♀ Samice' : null
  const sizeLabel: Record<string, string> = { small: 'Malý', medium: 'Střední', large: 'Velký', xlarge: 'Extra velký' }

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 py-5 text-sm" style={{ color: '#8B6550' }}>
          <Link href="/" className="no-underline hover:opacity-70 transition-opacity" style={{ color: '#8B6550' }}>Domů</Link>
          <span>·</span>
          <Link href="/adopt" className="no-underline hover:opacity-70 transition-opacity" style={{ color: '#8B6550' }}>Adopce</Link>
          <span>·</span>
          <span className="font-semibold" style={{ color: '#1A0F0A' }}>{a.name}</span>
        </nav>

        {/* Hlavní grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

          {/* ── Levý sloupec ── */}
          <div>

            {/* Galerie */}
            <div className="mb-8">
              <PhotoGallery
                photos={a.photos ?? []}
                primaryPhoto={a.primary_photo}
                animalName={a.name}
                icon={species?.icon}
              />
              {/* Share pod galerií */}
              <div className="mt-4">
                <ShareButtons
                  url={shareUrl}
                  title={`${a.name} hledá domov`}
                  text={a.description?.slice(0, 100) ?? `Adoptuj ${a.name} z útulku ${institution?.name}.`}
                />
              </div>
            </div>

            {/* Jméno + meta — mobilní verze */}
            <div className="lg:hidden mb-8">
              <AnimalHeader animal={a} age={age} sexLabel={sexLabel} sizeLabel={sizeLabel} species={species} institution={institution} />
            </div>

            {/* Popis */}
            {a.description && (
              <section className="mb-8">
                <SectionTitle>O {a.name}</SectionTitle>
                <p className="text-base leading-relaxed" style={{ color: '#4A2C1A', lineHeight: 1.8 }}>
                  {a.description}
                </p>
              </section>
            )}

            {/* Kompatibilita */}
            <section className="mb-8">
              <SectionTitle>Kompatibilita</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <CompatCard
                  icon="🧒"
                  label="Děti"
                  value={a.good_with_kids}
                />
                <CompatCard
                  icon="🐕"
                  label="Psi"
                  value={a.good_with_dogs}
                />
                <CompatCard
                  icon="🐈"
                  label="Kočky"
                  value={a.good_with_cats}
                />
              </div>
            </section>

            {/* Zdraví */}
            <section className="mb-8">
              <SectionTitle>Zdraví a stav</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Očkovaný',    value: a.vaccinated },
                  { label: 'Kastrovaný',  value: a.neutered },
                  { label: 'Čipovaný',    value: a.microchipped },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                    style={{ borderColor: value ? '#BDE8D0' : '#F0EDE8', background: value ? '#F0FBF5' : '#FAFAF8' }}>
                    <span className="text-base">{value ? '✓' : '—'}</span>
                    <span className="text-sm font-medium" style={{ color: value ? '#1D6A42' : '#8B6550' }}>{label}</span>
                  </div>
                ))}
                {a.special_needs && (
                  <div className="col-span-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl border"
                    style={{ borderColor: '#F5D8A0', background: '#FFFBEF' }}>
                    <span>⚠️</span>
                    <span className="text-sm font-medium" style={{ color: '#7A4F00' }}>{a.special_needs}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Propojený článek */}
            {article && (
              <section className="mb-8">
                <SectionTitle>Příběh {a.name}</SectionTitle>
                <Link href={`/articles/${(article as any).slug}`} className="no-underline group">
                  <div className="flex items-start gap-4 p-4 rounded-2xl border hover:-translate-y-0.5 transition-all"
                    style={{ background: '#FAECE7', borderColor: 'rgba(232,99,74,0.20)' }}>
                    <span className="text-3xl flex-shrink-0">📖</span>
                    <div>
                      <div className="font-bold text-[#1A0F0A] mb-1">{(article as any).title}</div>
                      {(article as any).perex && (
                        <p className="text-sm line-clamp-2" style={{ color: '#6B4030' }}>{(article as any).perex}</p>
                      )}
                      <span className="text-xs font-bold mt-2 inline-block" style={{ color: '#E8634A' }}>
                        Přečíst celý příběh →
                      </span>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Podobná zvířata */}
            {similar.length > 0 && (
              <section className="mb-8">
                <SectionTitle>Podobná zvířata</SectionTitle>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {similar.map((s: any) => (
                    <Link key={s.id} href={`/animals/${s.id}`} className="no-underline group flex-shrink-0">
                      <div className="w-36 bg-white rounded-xl overflow-hidden border border-[#F0EDE8] hover:border-[#E8634A]/40 transition-all">
                        <div className="relative h-28 bg-[#FAECE7] flex items-center justify-center overflow-hidden">
                          {s.primary_photo
                            ? <Image src={s.primary_photo} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <span className="text-3xl">{(s.species as any)?.icon ?? '🐾'}</span>
                          }
                        </div>
                        <div className="p-2.5">
                          <div className="font-bold text-sm text-[#1A0F0A] truncate">{s.name}</div>
                          <div className="text-xs truncate" style={{ color: '#8B6550' }}>{(s.institution as any)?.city}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Adopční formulář — mobilní verze */}
            <div className="lg:hidden">
              {isAvailable && (
                <div className="bg-white rounded-2xl border border-[#F0EDE8] p-5">
                  <h2 className="font-bold text-xl text-[#1A0F0A] mb-1">Chci adoptovat {a.name}</h2>
                  <p className="text-sm mb-5" style={{ color: '#8B6550' }}>Vyplň žádost a útulok tě kontaktuje.</p>
                  <AdoptionForm animalId={a.id} animalName={a.name} institutionId={a.institution_id} />
                </div>
              )}
              {isReserved && <ReservedBanner name={a.name} />}
            </div>
          </div>

          {/* ── Pravý sloupec — sticky ── */}
          <div className="hidden lg:block">
            <StickyPanel>
              {/* Jméno + info */}
              <div className="p-5 border-b border-[#F0EDE8]">
                <AnimalHeader animal={a} age={age} sexLabel={sexLabel} sizeLabel={sizeLabel} species={species} institution={institution} />
              </div>

              {/* Útulok */}
              {institution && (
                <div className="px-5 py-4 border-b border-[#F0EDE8]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>Útulok</div>
                      <div className="font-semibold text-sm text-[#1A0F0A]">{institution.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {institution.city}</div>
                    </div>
                    <Link href={`/institutions/${institution.slug}`}
                      className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                      Profil →
                    </Link>
                  </div>
                </div>
              )}

              {/* Poplatek */}
              {a.adoption_fee > 0 && (
                <div className="px-5 py-3 border-b border-[#F0EDE8] flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#6B4030' }}>Adopční poplatek</span>
                  <span className="font-bold text-[#1A0F0A]">{a.adoption_fee.toLocaleString('cs-CZ')} Kč</span>
                </div>
              )}

              {/* CTA nebo stav */}
              <div className="p-5">
                {isAvailable && (
                  <>
                    <h3 className="font-bold text-base text-[#1A0F0A] mb-1">Adoptovat {a.name}</h3>
                    <p className="text-xs mb-4" style={{ color: '#8B6550' }}>
                      Vyplň žádost — útulok tě kontaktuje do 3 pracovních dní.
                    </p>
                    <AdoptionForm animalId={a.id} animalName={a.name} institutionId={a.institution_id} />
                  </>
                )}
                {isReserved && <ReservedBanner name={a.name} />}
                {!isAvailable && !isReserved && (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🏠</div>
                    <p className="font-bold text-[#1A0F0A]">{a.name} již byl adoptován!</p>
                    <Link href="/adopt" className="mt-3 inline-block">
                      <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90"
                        style={{ background: '#E8634A' }}>
                        Najít další zvíře →
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </StickyPanel>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Komponenty ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold text-lg text-[#1A0F0A] mb-4 pb-3 border-b border-[#F0EDE8]">
      {children}
    </h2>
  )
}

function AnimalHeader({ animal: a, age, sexLabel, sizeLabel, species, institution }: any) {
  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    available:        { label: 'K adopci',     bg: '#EAF3DE', color: '#3B6D11' },
    reserved:         { label: 'Rezervováno',  bg: '#FAEEDA', color: '#854F0B' },
    adopted:          { label: 'Adoptováno',   bg: '#F0EDE8', color: '#5F5E5A' },
    foster:           { label: 'Ve foster',    bg: '#E1F5EE', color: '#0F6E56' },
    not_for_adoption: { label: 'Není k adopci', bg: '#F0EDE8', color: '#5F5E5A' },
  }
  const status = statusConfig[a.adoption_status] ?? statusConfig.available

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="font-display font-extrabold text-[#1A0F0A] leading-tight"
          style={{ fontSize: 'clamp(26px, 4vw, 36px)' }}>
          {a.name}
        </h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 mt-1"
          style={{ background: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>

      <p className="text-sm mb-4" style={{ color: '#8B6550' }}>
        {[
          species?.name_cs,
          a.breed,
          age,
          sexLabel,
          a.size ? sizeLabel[a.size] : null,
          a.weight_kg ? `${a.weight_kg} kg` : null,
        ].filter(Boolean).join(' · ')}
      </p>

      {a.urgent && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
          style={{ background: 'rgba(232,99,74,0.10)', border: '1px solid rgba(232,99,74,0.25)' }}>
          <span className="w-2 h-2 rounded-full bg-[#E8634A] animate-pulse" />
          <span className="text-xs font-bold" style={{ color: '#993C1D' }}>Urgentní adopce</span>
        </div>
      )}
    </div>
  )
}

function CompatCard({ icon, label, value }: { icon: string; label: string; value: boolean | null }) {
  const isYes = value === true
  const isNo  = value === false

  return (
    <div className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border text-center"
      style={{
        borderColor: isYes ? '#BDE8D0' : isNo ? '#F5C4B3' : '#F0EDE8',
        background:  isYes ? '#F0FBF5' : isNo ? '#FFF5F2' : '#FAFAF8',
      }}>
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold" style={{ color: '#1A0F0A' }}>{label}</span>
      <span className="text-xs font-bold"
        style={{ color: isYes ? '#1D6A42' : isNo ? '#993C1D' : '#8B6550' }}>
        {isYes ? 'Ano' : isNo ? 'Ne' : 'Neznámo'}
      </span>
    </div>
  )
}

function ReservedBanner({ name }: { name: string }) {
  return (
    <div className="text-center py-4 rounded-xl" style={{ background: '#FAEEDA' }}>
      <div className="text-3xl mb-2">⏳</div>
      <p className="font-bold text-[#1A0F0A] mb-1">{name} je momentálně rezervovaný</p>
      <p className="text-xs mb-3" style={{ color: '#8B6550' }}>Můžeš podat žádost a být na řadě.</p>
      <Link href="/adopt">
        <button className="px-4 py-2 rounded-lg font-bold text-sm border-none cursor-pointer hover:opacity-90 text-white"
          style={{ background: '#E8634A' }}>
          Najít další zvíře
        </button>
      </Link>
    </div>
  )
}

/* ── Data ── */

async function getAnimal(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animals')
    .select(`
      *,
      institution:institutions(id, name, city, type, slug, email, phone),
      species:animal_species(id, name_cs, icon)
    `)
    .eq('id', id)
    .eq('published', true)
    .single()
  return data
}

async function getSimilarAnimals(id: string, speciesId: string, institutionId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animals')
    .select('id, name, primary_photo, species:animal_species(icon), institution:institutions(city)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .eq('species_id', speciesId)
    .neq('id', id)
    .limit(6)
  return data ?? []
}

async function getLinkedArticle(animalId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex')
    .eq('animal_id', animalId)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}
