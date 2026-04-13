import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PhotoGallery } from '@/components/public/PhotoGallery'
import { AdoptionForm } from '@/components/public/AdoptionForm'
import { ShareButtons } from '@/components/public/ShareButtons'
import { StickyPanel } from '@/components/public/StickyPanel'
import { FavoriteButton } from '@/components/public/FavoriteButton'
import { formatBreed } from '@/lib/breed-label'
import { ORIGIN_LABEL, INTAKE_REASON_LABEL } from '@/lib/animal-labels'
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

  // Zjisti jestli je zvíře v oblíbených přihlášeného uživatele
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let initialFav = false
  if (user) {
    const { data } = await supabase
      .from('animal_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('animal_id', id)
      .maybeSingle()
    initialFav = !!data
  }

  const isAvailable = a.adoption_status === 'available'
  const isReserved  = a.adoption_status === 'reserved'
  const shareUrl    = `${BASE}/animals/${id}`

  const age = a.birth_year
    ? `${new Date().getFullYear() - a.birth_year} ${new Date().getFullYear() - a.birth_year === 1 ? 'rok' : new Date().getFullYear() - a.birth_year < 5 ? 'roky' : 'let'}`
    : null

  const sexLabel = a.sex === 'male' ? '♂ Samec' : a.sex === 'female' ? '♀ Samice' : null
  const sizeLabel: Record<string, string> = { small: 'Malý', medium: 'Střední', large: 'Velký', xlarge: 'Extra velký' }

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
            <div className="mb-8">
              <PhotoGallery
                photos={a.photos ?? []}
                primaryPhoto={a.primary_photo}
                animalName={a.name}
                icon={species?.icon}
              />
              {/* Share + oblíbené pod galerií */}
              <div className="mt-4 flex items-center gap-3">
                <ShareButtons
                  url={shareUrl}
                  title={`${a.name} hledá domov`}
                  text={a.description?.slice(0, 100) ?? `Adoptuj ${a.name} z útulku ${institution?.name}.`}
                />
                <FavoriteButton type="animal" id={a.id} initialFav={initialFav} size="md" />
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

            {/* Základní informace */}
            <AnimalInfoBox a={a as any} age={age} sexLabel={sexLabel} sizeLabel={sizeLabel} species={species} />

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
            <div className="lg:hidden">
              {isAvailable && (
                <div className="bg-white rounded-2xl border border-border p-5">
                  <h2 className="font-bold text-xl text-text-primary mb-1">Chci adoptovat {a.name}</h2>
                  <p className="text-sm mb-5 text-text-muted">Vyplň žádost a útulok tě kontaktuje.</p>
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
              <div className="p-5 border-b border-border">
                <AnimalHeader animal={a} age={age} sexLabel={sexLabel} sizeLabel={sizeLabel} species={species} institution={institution} />
              </div>

              {/* Útulok */}
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

              {/* CTA nebo stav */}
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
          <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          <span className="text-xs font-bold text-coral-tag-text">Urgentní adopce</span>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnimalInfoBox({ a, age, sexLabel, sizeLabel, species }: { a: any; age: string | null; sexLabel: string | null; sizeLabel: Record<string, string>; species: any }) {
  const intakeDate = a.intake_date
    ? new Date(a.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const isFemale = a.sex === 'female'
  const activityLabel: Record<string, string> = {
    low:       isFemale ? '😴 Klidná'           : '😴 Klidný',
    medium:    '🚶 Středně aktivní',
    high:      '🏃 Velmi aktivní',
    very_high: '⚡ Extrémně aktivní',
  }
  const difficultyLabel: Record<string, string> = {
    easy:      isFemale ? '⭐ Nenáročná'         : '⭐ Nenáročný',
    medium:    isFemale ? '⭐⭐ Středně náročná' : '⭐⭐ Středně náročný',
    demanding: isFemale ? '⭐⭐⭐ Náročná'       : '⭐⭐⭐ Náročný',
  }
  const homeTypes = [
    a.suitable_for_flat  && '🏢 Byt',
    a.suitable_for_house && '🏡 Dům',
  ].filter(Boolean).join(', ')

  const rows: { icon: string; label: string; value: string }[] = [
    species?.name_cs          && { icon: '🐾', label: 'Druh',          value: species.name_cs },
    a.breed                   && { icon: '🔖', label: 'Rasa',           value: formatBreed(a.breed, a.is_crossbreed, a.breed2) },
    age                       && { icon: '🎂', label: 'Věk',            value: age },
    sexLabel                  && { icon: '⚥',  label: 'Pohlaví',        value: sexLabel },
    a.size                    && { icon: '📏', label: 'Velikost',        value: sizeLabel[a.size] ?? a.size },
    a.weight_kg               && { icon: '⚖️', label: 'Váha',           value: `${a.weight_kg} kg` },
    a.activity_level          && { icon: '⚡', label: 'Aktivita',        value: activityLabel[a.activity_level] ?? a.activity_level },
    a.care_difficulty         && { icon: '🎯', label: 'Náročnost péče', value: difficultyLabel[a.care_difficulty] ?? a.care_difficulty },
    homeTypes                 && { icon: '🏠', label: 'Ideální domov',  value: homeTypes },
    intakeDate                && { icon: '📅', label: 'V útulku od',    value: intakeDate },
    a.origin                  && { icon: '📍', label: 'Důvod příchodu', value: ORIGIN_LABEL[a.origin] ?? a.origin },
    a.intake_reason           && { icon: '💬', label: 'Poznámka',       value: INTAKE_REASON_LABEL[a.intake_reason] ?? a.intake_reason },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  if (!rows.length) return null

  return (
    <section className="mb-8">
      <SectionTitle>Základní informace</SectionTitle>
      <div className="rounded-xl border border-[#F0EDE8] overflow-hidden bg-white">
        {rows.map((row, i) => (
          <div key={row.label}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[#F8F5F2]' : ''}`}>
            <span className="text-base w-6 text-center flex-shrink-0">{row.icon}</span>
            <span className="text-sm flex-1 text-text-muted">{row.label}</span>
            <span className="text-sm font-semibold text-text-primary text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
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
  const { data } = await supabase
    .from('animals')
    .select('id, name, primary_photo, species:animal_species(icon), institution:institutions(city)')
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
