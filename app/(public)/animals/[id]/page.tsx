import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PhotoGallery } from '@/components/public/PhotoGallery'
import { AdoptionForm } from '@/components/public/AdoptionForm'
import { ShareButtons } from '@/components/public/ShareButtons'
import { formatBreed } from '@/lib/breed-label'
import { StickyPanel } from '@/components/public/StickyPanel'
import { FavoriteButton } from '@/components/public/FavoriteButton'
import type { Animal, Institution, AnimalSpecies } from '@/types/database'

/* ── Query-specific types ── */
interface AnimalDetail extends Omit<Animal, 'institution' | 'species'> {
  institution: Pick<Institution, 'id' | 'name' | 'city' | 'type' | 'slug' | 'email' | 'phone'> | null
  species: Pick<AnimalSpecies, 'id' | 'name_cs' | 'icon'> | null
}

interface SimilarAnimal {
  id: string
  name: string
  primary_photo: string | null
  species: { icon: string | null } | null
  institution: { city: string } | null
}

interface LinkedArticle {
  id: string
  title: string
  slug: string
  perex: string | null
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const a = await getAnimal(id)
  if (!a) return { title: 'Zvíře nenalezeno | Zozio' }
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
  const a = await getAnimal(id)
  if (!a) notFound()

  const institution = a.institution
  const species     = a.species
  const similar     = await getSimilarAnimals(id, a.species_id, a.institution_id)
  const article     = await getLinkedArticle(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [similar, article, favData] = await Promise.all([
    getSimilarAnimals(id, a.species_id, a.breed ?? null),
    getLinkedArticle(id),
    user
      ? supabase.from('animal_favorites').select('id').eq('user_id', user.id).eq('animal_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const initialFav = !!favData.data

  const isAvailable = a.adoption_status === 'available'
  const isReserved  = a.adoption_status === 'reserved'
  const shareUrl    = `${BASE}/animals/${id}`

  const yearsOld = a.birth_year ? new Date().getFullYear() - a.birth_year : null
  const age = yearsOld != null
    ? `${yearsOld} ${yearsOld === 1 ? 'rok' : yearsOld < 5 ? 'roky' : 'let'}`
    : a.age_months
      ? `${a.age_months} ${a.age_months === 1 ? 'měsíc' : a.age_months < 5 ? 'měsíce' : 'měsíců'}`
      : null

  const sexLabel = a.sex === 'male' ? '♂ Samec' : a.sex === 'female' ? '♀ Samice' : null
  const sizeLabel: Record<string, string> = { small: 'Malý', medium: 'Střední', large: 'Velký', xlarge: 'Extra velký' }

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    available:        { label: 'K adopci',      bg: '#EAF3DE', color: '#3B6D11' },
    reserved:         { label: 'Rezervováno',   bg: '#FAEEDA', color: '#854F0B' },
    adopted:          { label: 'Adoptováno 🎉', bg: '#F0EDE8', color: '#5F5E5A' },
    foster:           { label: 'Ve foster',     bg: '#E1F5EE', color: '#0F6E56' },
    not_for_adoption: { label: 'Není k adopci', bg: '#F0EDE8', color: '#5F5E5A' },
  }
  const status = statusConfig[a.adoption_status] ?? statusConfig.available

  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 py-5 text-sm text-text-muted">
          <Link href="/" className="no-underline hover:opacity-70 transition-opacity text-text-muted">Domů</Link>
          <span>·</span>
          <Link href="/adopt" className="no-underline hover:opacity-70 transition-opacity text-text-muted">Adopce</Link>
          <span>·</span>
          <span className="font-semibold text-text-primary">{a.name}</span>
        </nav>

        {/* Hlavní grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

          {/* ── Levý sloupec ── */}
          <div>

            {/* Galerie */}
            <div className="mb-6">
              <PhotoGallery
                photos={a.photos ?? []}
                primaryPhoto={a.primary_photo}
                animalName={a.name}
                icon={species?.icon}
              />
              <div className="mt-3 flex items-center gap-3">
                <ShareButtons
                  url={shareUrl}
                  title={`${a.name} hledá domov`}
                  text={a.description?.slice(0, 100) ?? `Adoptuj ${a.name} z útulku ${institution?.name}.`}
                />
                <FavoriteButton type="animal" id={a.id} initialFav={initialFav} size="md" />
              </div>
            </div>

            {/* Jméno + status + útulek — mobilní verze */}
            <div className="lg:hidden mb-6">
              <AnimalNameBlock a={a} age={age} sexLabel={sexLabel} sizeLabel={sizeLabel} species={species} status={status} />
              {institution && (
                <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-lg border border-[#F0EDE8] bg-white">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#8B6550' }}>
                      {institution.type === 'shelter' ? 'Útulek' : 'Záchranná stanice'}
                    </div>
                    <div className="font-semibold text-sm text-[#1A0F0A]">{institution.name}</div>
                    {institution.city && <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {institution.city}</div>}
                  </div>
                  <Link href={`/institutions/${institution.slug}`}
                    className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 flex-shrink-0"
                    style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                    Profil →
                  </Link>
                </div>
              )}
            </div>

            {/* Urgentní banner — mobil */}
            {a.urgent && (
              <div className="lg:hidden mb-5">
                <UrgentBanner />
              </div>
            )}

            {/* Popis */}
            {a.description && (
              <section className="mb-7">
                <SectionTitle>O „{a.name}"</SectionTitle>
                <p className="text-base leading-relaxed" style={{ color: '#4A2C1A', lineHeight: 1.85 }}>
                  {a.description}
                </p>
              </section>
            )}

            {/* Příběh */}
            {a.story && (
              <section className="mb-7">
                <SectionTitle>Příběh</SectionTitle>
                <p className="text-base leading-relaxed" style={{ color: '#4A2C1A', lineHeight: 1.85 }}>
                  {a.story}
                </p>
              </section>
            )}

            {/* Detailní info box */}
            <AnimalInfoBox a={a} age={age} sexLabel={sexLabel} sizeLabel={sizeLabel} species={species} />

            {/* Kompatibilita */}
            <CompatibilitySection a={a} />

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
                    style={{ borderColor: value ? '#BDE8D0' : 'var(--border)', background: value ? '#F0FBF5' : 'var(--warm-hover)' }}>
                    <span className="text-base">{value ? '✓' : '—'}</span>
                    <span className="text-sm font-medium" style={{ color: value ? '#1D6A42' : 'var(--text-muted)' }}>{label}</span>
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
                <Link href={`/articles/${article.slug}`} className="no-underline group">
                  <div className="flex items-start gap-4 p-4 rounded-2xl border hover:-translate-y-0.5 transition-all"
                    style={{ background: 'var(--coral-tag-bg)', borderColor: 'rgba(232,99,74,0.20)' }}>
                    <span className="text-3xl flex-shrink-0">📖</span>
                    <div>
                      <div className="font-bold text-text-primary mb-1">{article.title}</div>
                      {article.perex && (
                        <p className="text-sm line-clamp-2 text-text-body">{article.perex}</p>
                      )}
                      <span className="text-xs font-bold mt-2 inline-block text-coral">
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
                  {similar.map((s: SimilarAnimal) => (
                    <Link key={s.id} href={`/animals/${s.id}`} className="no-underline group flex-shrink-0">
                      <div className="w-36 bg-white rounded-xl overflow-hidden border border-border hover:border-coral/40 transition-all">
                        <div className="relative h-28 bg-coral-tag-bg flex items-center justify-center overflow-hidden">
                          {s.primary_photo
                            ? <Image src={s.primary_photo} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <span className="text-3xl">{s.species?.icon ?? '🐾'}</span>
                          }
                        </div>
                        <div className="p-2.5">
                          <div className="font-bold text-sm text-text-primary truncate">{s.name}</div>
                          <div className="text-xs truncate text-text-muted">{s.institution?.city}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Adopční formulář — mobilní verze */}
            <div className="lg:hidden mb-7">
              {isAvailable && (
                <div className="bg-white rounded-2xl border border-border p-5">
                  <h2 className="font-bold text-xl text-text-primary mb-1">Chci adoptovat {a.name}</h2>
                  <p className="text-sm mb-5 text-text-muted">Vyplň žádost a útulok tě kontaktuje.</p>
                  <AdoptionForm animalId={a.id} animalName={a.name} institutionId={a.institution_id} />
                </div>
              )}
              {isReserved && <ReservedBanner name={a.name} />}
              {!isAvailable && !isReserved && <AdoptedBanner name={a.name} />}
            </div>

            {/* Podobná zvířata */}
            {similar.length > 0 && (
              <section className="mb-7">
                <SectionTitle>Podobná zvířata</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {similar.map((s: any) => (
                    <SimilarAnimalCard key={s.id} animal={s} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Pravý sloupec — sticky ── */}
          <div className="hidden lg:block">
            <StickyPanel>
              {/* Jméno + info */}
              <div className="p-5 border-b border-border">
                <AnimalHeader animal={a} age={age} sexLabel={sexLabel} sizeLabel={sizeLabel} species={species} institution={institution} />
              </div>

              {/* Útulek */}
              {institution && (
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-text-muted">Útulok</div>
                      <div className="font-semibold text-sm text-text-primary">{institution.name}</div>
                      <div className="text-xs mt-0.5 text-text-muted">📍 {institution.city}</div>
                    </div>
                    <Link href={`/institutions/${institution.slug}`}
                      className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: '#E0DDD8', color: 'var(--text-body)' }}>
                      Profil →
                    </Link>
                  </div>
                </div>
              )}

              {/* Poplatek */}
              {a.adoption_fee > 0 && (
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-text-body">Adopční poplatek</span>
                  <span className="font-bold text-text-primary">{a.adoption_fee.toLocaleString('cs-CZ')} Kč</span>
                </div>
              )}

              {/* CTA */}
              <div className="p-5">
                {isAvailable && (
                  <>
                    <h3 className="font-bold text-base text-text-primary mb-1">Adoptovat {a.name}</h3>
                    <p className="text-xs mb-4 text-text-muted">
                      Vyplň žádost — útulok tě kontaktuje do 3 pracovních dní.
                    </p>
                    <AdoptionForm animalId={a.id} animalName={a.name} institutionId={a.institution_id} />
                  </>
                )}
                {isReserved && <ReservedBanner name={a.name} />}
                {!isAvailable && !isReserved && (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🏠</div>
                    <p className="font-bold text-text-primary">{a.name} již byl adoptován!</p>
                    <Link href="/adopt" className="mt-3 inline-block">
                      <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 bg-coral">
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
    <h2 className="font-bold text-lg text-text-primary mb-4 pb-3 border-b border-border">
      {children}
    </h2>
  )
}

function AnimalHeader({ animal: a, age, sexLabel, sizeLabel, species, institution }: {
  animal: AnimalDetail
  age: string | null
  sexLabel: string | null
  sizeLabel: Record<string, string>
  species: Pick<AnimalSpecies, 'id' | 'name_cs' | 'icon'> | null
  institution: Pick<Institution, 'id' | 'name' | 'city' | 'type' | 'slug' | 'email' | 'phone'> | null
}) {
  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    available:        { label: 'K adopci',     bg: 'var(--success-tag-bg)', color: 'var(--success-tag-text)' },
    reserved:         { label: 'Rezervováno',  bg: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' },
    adopted:          { label: 'Adoptováno',   bg: 'var(--border)', color: 'var(--text-neutral)' },
    foster:           { label: 'Ve foster',    bg: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' },
    not_for_adoption: { label: 'Není k adopci', bg: 'var(--border)', color: 'var(--text-neutral)' },
  }
  const status = statusConfig[a.adoption_status] ?? statusConfig.available

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="font-display font-extrabold text-text-primary leading-tight"
          style={{ fontSize: 'clamp(26px, 4vw, 36px)' }}>
          {a.name}
        </h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 mt-1"
          style={{ background: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>

      <p className="text-sm mb-4 text-text-muted">
        {[
          species?.name_cs,
          formatBreed(a.breed, a.is_crossbreed, a.breed2),
          age,
          sexLabel,
          a.size ? sizeLabel[a.size] : null,
          a.weight_kg ? `${a.weight_kg} kg` : null,
        ].filter(Boolean).join(' · ')}
      </p>

      {a.urgent && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
          style={{ background: 'rgba(232,99,74,0.10)', border: '1px solid rgba(232,99,74,0.25)' }}>
          <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          <span className="text-xs font-bold text-coral-tag-text">Urgentní adopce</span>
        </div>
      )}
    </div>
  )
}

function UrgentBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-0"
      style={{ background: 'rgba(232,99,74,0.10)', border: '1px solid rgba(232,99,74,0.25)' }}>
      <span className="w-2 h-2 rounded-full bg-[#E8634A] animate-pulse flex-shrink-0" />
      <span className="text-xs font-bold" style={{ color: '#993C1D' }}>Urgentní adopce — toto zvíře potřebuje domov co nejdříve</span>
    </div>
  )
}

function AnimalInfoBox({ a, age, sexLabel, sizeLabel, species }: any) {
  const intakeDate = a.intake_date
    ? new Date(a.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const isFemale = a.sex === 'female'

  const activityLabel: Record<string, string> = {
    low:    isFemale ? '😴 Klidná'          : '😴 Klidný',
    medium: '🚶 Středně aktivní',
    high:   isFemale ? '🏃 Velmi aktivní'   : '🏃 Velmi aktivní',
  }
  const difficultyLabel: Record<string, string> = {
    easy:      isFemale ? '⭐ Nenáročná'           : '⭐ Nenáročný',
    medium:    isFemale ? '⭐⭐ Středně náročná'   : '⭐⭐ Středně náročný',
    demanding: isFemale ? '⭐⭐⭐ Náročná'         : '⭐⭐⭐ Náročný',
  }

  const homeTypes = [
    a.suitable_for_flat  && '🏢 Byt',
    a.suitable_for_house && '🏡 Dům',
  ].filter(Boolean).join(', ')

  const rows: { icon: string; label: string; value: string }[] = [
    species?.name_cs                  && { icon: '🐾', label: 'Druh',          value: species.name_cs },
    a.breed                           && { icon: '🔖', label: 'Rasa',           value: formatBreed(a.breed, a.is_crossbreed, a.breed2) },
    age                               && { icon: '🎂', label: 'Věk',            value: age },
    sexLabel                          && { icon: '⚥',  label: 'Pohlaví',        value: sexLabel },
    a.size                            && { icon: '📏', label: 'Velikost',        value: sizeLabel[a.size] ?? a.size },
    a.weight_kg                       && { icon: '⚖️', label: 'Váha',           value: `${a.weight_kg} kg` },
    a.activity_level                  && { icon: '⚡', label: 'Aktivita',        value: activityLabel[a.activity_level] ?? a.activity_level },
    a.care_difficulty                 && { icon: '🎯', label: 'Náročnost péče', value: difficultyLabel[a.care_difficulty] ?? a.care_difficulty },
    homeTypes                         && { icon: '🏠', label: 'Ideální domov',  value: homeTypes },
    a.coat_color                      && { icon: '🎨', label: 'Barva srsti',    value: a.coat_color },
    a.coat_type                       && { icon: '✂️', label: 'Typ srsti',      value: a.coat_type },
    a.origin                          && { icon: '📍', label: 'Původ',           value: a.origin },
    intakeDate                        && { icon: '📅', label: 'V útulku od',    value: intakeDate },
    a.intake_reason                   && { icon: '💬', label: 'Důvod příchodu', value: a.intake_reason },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  if (!rows.length) return null

  return (
    <section className="mb-7">
      <SectionTitle>Základní informace</SectionTitle>
      <div className="rounded-lg border border-[#F0EDE8] overflow-hidden bg-white">
        {rows.map((row, i) => (
          <div key={row.label}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[#F8F5F2]' : ''}`}>
            <span className="text-base w-6 text-center flex-shrink-0">{row.icon}</span>
            <span className="text-sm flex-1" style={{ color: '#8B6550' }}>{row.label}</span>
            <span className="text-sm font-semibold text-[#1A0F0A] text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function CompatibilitySection({ a }: { a: any }) {
  const cards = [
    { icon: '🧒', label: 'Děti',    value: a.good_with_kids },
    { icon: '🐕', label: 'Psi',     value: a.good_with_dogs },
    { icon: '🐈', label: 'Kočky',   value: a.good_with_cats },
    { icon: '🧑', label: 'Dospělí', value: a.good_with_adults },
  ].filter(c => c.value !== undefined && c.value !== null)

  if (!cards.length) return null

  return (
    <section className="mb-7">
      <SectionTitle>Kompatibilita</SectionTitle>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)` }}>
        {cards.map(({ icon, label, value }) => (
          <CompatCard key={label} icon={icon} label={label} value={value} />
        ))}
      </div>
    </section>
  )
}

function CompatCard({ icon, label, value }: { icon: string; label: string; value: boolean | null }) {
  const isYes = value === true
  const isNo  = value === false

  return (
    <div className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-lg border text-center"
      style={{
        borderColor: isYes ? '#BDE8D0' : isNo ? '#F5C4B3' : 'var(--border)',
        background:  isYes ? '#F0FBF5' : isNo ? '#FFF5F2' : 'var(--warm-hover)',
      }}>
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <span className="text-xs font-bold"
        style={{ color: isYes ? '#1D6A42' : isNo ? 'var(--coral-tag-text)' : 'var(--text-muted)' }}>
        {isYes ? 'Ano' : isNo ? 'Ne' : 'Neznámo'}
      </span>
    </div>
  )
}

function HealthSection({ a }: { a: any }) {
  const items = [
    { label: 'Očkovaný',   value: a.vaccinated },
    { label: 'Kastrovaný', value: a.neutered },
    { label: 'Čipovaný',   value: a.microchipped },
    { label: 'Odčervený',  value: a.dewormed },
  ].filter(item => item.value !== undefined && item.value !== null)

  const hasHealth = items.length > 0 || a.special_needs || a.health_notes

  if (!hasHealth) return null

  return (
    <section className="mb-7">
      <SectionTitle>Zdraví a veterinární stav</SectionTitle>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map(({ label, value }) => (
            <div key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
              style={{ borderColor: value ? '#BDE8D0' : '#F0EDE8', background: value ? '#F0FBF5' : '#FAFAF8', color: value ? '#1D6A42' : '#8B6550' }}>
              <span>{value ? '✓' : '—'}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
      {a.health_notes && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border mb-2"
          style={{ borderColor: '#E8E0D4', background: '#FAFAF8' }}>
          <span className="text-base flex-shrink-0">📋</span>
          <p className="text-sm leading-relaxed" style={{ color: '#4A2C1A' }}>{a.health_notes}</p>
        </div>
      )}
      {a.special_needs && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border"
          style={{ borderColor: '#F5D8A0', background: '#FFFBEF' }}>
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-sm leading-relaxed font-medium" style={{ color: '#7A4F00' }}>{a.special_needs}</p>
        </div>
      )}
    </section>
  )
}

function SimilarAnimalCard({ animal: s }: { animal: any }) {
  const institution = s.institution as any
  const species = s.species as any
  const isSameBreed = s._sameBreed

  return (
    <Link href={`/animals/${s.id}`} className="no-underline group">
      <div className="bg-white rounded-lg overflow-hidden border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-0.5 transition-all">
        <div className="relative aspect-[4/3] bg-[#FAECE7] flex items-center justify-center overflow-hidden">
          {s.primary_photo
            ? <Image src={s.primary_photo} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <span className="text-4xl">{species?.icon ?? '🐾'}</span>
          }
          {isSameBreed && s.breed && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
              {formatBreed(s.breed, s.is_crossbreed, s.breed2)}
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="font-bold text-sm text-[#1A0F0A] truncate group-hover:opacity-80 transition-opacity">{s.name}</div>
          <div className="text-xs mt-0.5 truncate" style={{ color: '#8B6550' }}>
            {[species?.name_cs, institution?.city].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
    </Link>
  )
}

function ReservedBanner({ name }: { name: string }) {
  return (
    <div className="text-center py-4 rounded-xl bg-warning-tag-bg">
      <div className="text-3xl mb-2">⏳</div>
      <p className="font-bold text-text-primary mb-1">{name} je momentálně rezervovaný</p>
      <p className="text-xs mb-3 text-text-muted">Můžeš podat žádost a být na řadě.</p>
      <Link href="/adopt">
        <button className="px-4 py-2 rounded-lg font-bold text-sm border-none cursor-pointer hover:opacity-90 text-white bg-coral">
          Najít další zvíře
        </button>
      </Link>
    </div>
  )
}

function AdoptedBanner({ name }: { name: string }) {
  return (
    <div className="text-center py-5 rounded-lg" style={{ background: '#F0FBF5' }}>
      <div className="text-3xl mb-2">🏠</div>
      <p className="font-bold text-[#1A0F0A] mb-1">{name} již našel/la domov!</p>
      <p className="text-xs mb-3" style={{ color: '#8B6550' }}>Podívej se na další zvířata, která hledají rodinu.</p>
      <Link href="/adopt">
        <button className="px-5 py-2.5 rounded-lg font-bold text-sm text-white border-none cursor-pointer hover:opacity-90"
          style={{ background: '#E8634A' }}>
          Najít další zvíře →
        </button>
      </Link>
    </div>
  )
}

/* ── Data ── */

async function getAnimal(id: string): Promise<AnimalDetail | null> {
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
  return data as AnimalDetail | null
}

async function getSimilarAnimals(id: string, speciesId: string | null, institutionId: string): Promise<SimilarAnimal[]> {
  if (!speciesId) return []
  const supabase = await createClient()

  // Nejdřív zkus stejnou rasu (max 3)
  let sameBreed: any[] = []
  if (breed) {
    const { data } = await supabase
      .from('animals')
      .select('id, name, primary_photo, breed, species:animal_species(icon, name_cs), institution:institutions(city, name)')
      .eq('published', true)
      .eq('adoption_status', 'available')
      .eq('species_id', speciesId)
      .eq('breed', breed)
      .neq('id', id)
      .limit(3)
    sameBreed = (data ?? []).map(a => ({ ...a, _sameBreed: true }))
  }

  // Doplň stejným druhem (bez již nalezených)
  const remaining = 6 - sameBreed.length
  const excludeIds = [id, ...sameBreed.map((a: any) => a.id)]

  const { data: sameSpecies } = await supabase
    .from('animals')
    .select('id, name, primary_photo, breed, species:animal_species(icon, name_cs), institution:institutions(city, name)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .eq('species_id', speciesId)
    .neq('id', id)
    .limit(6)
  return (data ?? []) as unknown as SimilarAnimal[]
}

async function getLinkedArticle(animalId: string): Promise<LinkedArticle | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex')
    .eq('animal_id', animalId)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  return (data as LinkedArticle | null) ?? null
}
