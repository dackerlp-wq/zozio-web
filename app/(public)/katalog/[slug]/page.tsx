import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { breedSlug } from '@/lib/breed-slug'

export const revalidate = 3600

export interface BreedProfile {
  name_en?: string
  height_cm?: string
  weight_kg?: string
  lifespan?: string
  fci_group?: string
  use_cases?: string[]
  character_intro?: string
  character_traits?: string[]
  character_warning?: string
  activity_needs?: string[]
  activity_suitable?: string[]
  activity_note?: string
  difficulty_rating?: number
  difficulty_needs?: string[]
  warnings?: string[]
  history?: string
  history_facts?: string[]
  fun_facts?: string[]
  summary?: string
}

const SIZE_LABELS: Record<string, string> = {
  small: 'Malé (do 10 kg)',
  medium: 'Střední (10–25 kg)',
  large: 'Velké (25–45 kg)',
  xlarge: 'Obří (45+ kg)',
}
const ENERGY_LABELS: Record<string, string> = {
  low: 'Klidné',
  medium: 'Střední',
  high: 'Aktivní',
  very_high: 'Velmi aktivní',
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: breeds } = await supabase
    .from('animal_breeds')
    .select('name_cs, description, profile')
  const breed = (breeds ?? []).find(b => breedSlug(b.name_cs) === slug)
  if (!breed) return { title: 'Plemeno nenalezeno | Zozio' }
  const p = (breed.profile ?? {}) as BreedProfile
  return {
    title: `${breed.name_cs}${p.name_en ? ` (${p.name_en})` : ''} | Katalog plemen | Zozio`,
    description: breed.description ?? p.character_intro ?? `Vše o plemeni ${breed.name_cs} — adopce, povaha, péče a aktuální nabídka na Zozio.`,
  }
}

export default async function BreedProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: allBreeds } = await supabase
    .from('animal_breeds')
    .select('id, species_id, name_cs, name_sk, origin_country, size_category, energy_level, hypoallergenic, description, profile, species:animal_species(id, name_cs, icon)')

  const breed = (allBreeds ?? []).find(b => breedSlug(b.name_cs) === slug)
  if (!breed) notFound()

  const speciesInfo = Array.isArray(breed.species) ? breed.species[0] : breed.species
  const p = (breed.profile ?? {}) as BreedProfile

  const { data: animals } = await supabase
    .from('animals')
    .select('id, name, gender, age_years, age_months, photo_url, institution:institutions(id, name, slug)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .eq('species_id', breed.species_id)
    .eq('breed', breed.name_cs)
    .order('created_at', { ascending: false })
    .limit(20)

  const animalList = animals ?? []

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs pt-4 mb-6" style={{ color: '#A08070' }}>
          <Link href="/katalog" className="hover:text-[#E8634A] transition-colors no-underline">Katalog plemen</Link>
          <span>/</span>
          {speciesInfo && <><span>{speciesInfo.icon} {speciesInfo.name_cs}</span><span>/</span></>}
          <span className="font-semibold" style={{ color: '#1A0F0A' }}>{breed.name_cs}</span>
        </nav>

        {/* ─── HERO ────────────────────────────────── */}
        <div className="rounded-lg overflow-hidden mb-8"
          style={{ background: 'linear-gradient(135deg, #2C1810 0%, #4A2C1A 60%, #6B3A20 100%)' }}>
          <div className="px-6 md:px-10 py-8 md:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {speciesInfo?.icon && <span className="text-4xl">{speciesInfo.icon}</span>}
                  <h1 className="font-display font-extrabold text-white"
                    style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>
                    {breed.name_cs}
                  </h1>
                </div>
                {p.name_en && (
                  <p className="text-base font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {p.name_en}
                  </p>
                )}
                {breed.name_sk && (
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>SK: {breed.name_sk}</p>
                )}
              </div>
              {animalList.length > 0 && (
                <Link href={`/adopt?species=${breed.species_id}&breed=${encodeURIComponent(breed.name_cs)}`}
                  className="flex-shrink-0 px-5 py-3 rounded-lg font-bold text-white no-underline hover:opacity-90 transition-opacity text-sm"
                  style={{ background: '#E8634A' }}>
                  {animalList.length} k adopci →
                </Link>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-2.5 mt-6">
              {breed.origin_country && <HeroStat icon="🌍" label={breed.origin_country} />}
              {p.height_cm && <HeroStat icon="↕️" label={p.height_cm} />}
              {p.weight_kg && <HeroStat icon="⚖️" label={p.weight_kg} />}
              {p.lifespan && <HeroStat icon="🕐" label={p.lifespan} />}
              {breed.size_category && <HeroStat icon="📏" label={SIZE_LABELS[breed.size_category] ?? breed.size_category} />}
              {breed.energy_level && <HeroStat icon="⚡" label={ENERGY_LABELS[breed.energy_level] ?? breed.energy_level} />}
              {breed.hypoallergenic && <HeroStat icon="🌿" label="Hypoalergenní" />}
            </div>
          </div>
        </div>

        {/* ─── TWO-COLUMN LAYOUT ─────────────────────
            Left: breed info + rich content
            Right: adoption sidebar (sticky desktop, bottom mobile)
        ─────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT: content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Basic info */}
            <Section icon="📌" title="Základní informace" accent="#E8634A">
              <InfoTable rows={[
                breed.origin_country ? ['Původ', breed.origin_country] : null,
                breed.size_category ? ['Velikost', SIZE_LABELS[breed.size_category] ?? breed.size_category] : null,
                p.height_cm ? ['Výška', p.height_cm] : null,
                p.weight_kg ? ['Hmotnost', p.weight_kg] : null,
                p.lifespan ? ['Délka života', p.lifespan] : null,
                p.fci_group ? ['Skupina (FCI)', p.fci_group] : null,
                breed.energy_level ? ['Aktivita', ENERGY_LABELS[breed.energy_level] ?? breed.energy_level] : null,
                breed.hypoallergenic ? ['Hypoalergenní', 'Ano'] : null,
              ].filter(Boolean) as [string, string][]} />
              {p.use_cases && p.use_cases.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#A08070' }}>Využití</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.use_cases.map((u, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md font-medium"
                        style={{ background: '#FBF0EC', color: '#6B3A20' }}>{u}</span>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Personality */}
            {(p.character_intro || p.character_traits?.length) && (
              <Section icon="🧠" title="Povaha" accent="#7C3AED">
                {p.character_intro && (
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#2C1810' }}>{p.character_intro}</p>
                )}
                {p.character_traits && p.character_traits.length > 0 && (
                  <BulletList items={p.character_traits} />
                )}
                {p.character_warning && (
                  <Callout type="info" className="mt-3">
                    <p className="text-sm" style={{ color: '#1A0F0A' }}>
                      <span className="font-bold">👉 </span>{p.character_warning}
                    </p>
                  </Callout>
                )}
              </Section>
            )}

            {/* Activity */}
            {(p.activity_needs?.length || p.activity_suitable?.length) && (
              <Section icon="⚡" title="Aktivita a potřeby" accent="#0EA5E9">
                {p.activity_needs && p.activity_needs.length > 0 && (
                  <BulletList items={p.activity_needs} />
                )}
                {p.activity_suitable && p.activity_suitable.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#A08070' }}>Vhodné aktivity</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.activity_suitable.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {p.activity_note && (
                  <Callout type="info" className="mt-3">
                    <p className="text-sm"><span className="font-bold">👉 </span>{p.activity_note}</p>
                  </Callout>
                )}
              </Section>
            )}

            {/* Difficulty */}
            {(p.difficulty_rating || p.difficulty_needs?.length || p.warnings?.length) && (
              <Section icon="🏡" title="Náročnost chovu" accent="#D97706">
                {p.difficulty_rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <Stars n={p.difficulty_rating} />
                    <span className="text-sm font-semibold" style={{ color: '#6B3A20' }}>
                      {['', 'Nízká', 'Mírná', 'Střední', 'Vyšší', 'Vysoká'][p.difficulty_rating]}
                    </span>
                  </div>
                )}
                {p.difficulty_needs && p.difficulty_needs.length > 0 && (
                  <BulletList items={p.difficulty_needs} />
                )}
                {p.warnings && p.warnings.length > 0 && (
                  <Callout type="warning" className="mt-3">
                    <p className="text-xs font-bold mb-1.5">⚠️ Časté problémy</p>
                    <BulletList items={p.warnings} small />
                  </Callout>
                )}
              </Section>
            )}

            {/* History */}
            {(p.history || p.history_facts?.length) && (
              <Section icon="📜" title="Historie a vznik" accent="#059669">
                {p.history && (
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#2C1810' }}>{p.history}</p>
                )}
                {p.history_facts && p.history_facts.length > 0 && (
                  <ul className="space-y-1.5">
                    {p.history_facts.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: '#2C1810' }}>
                        <span className="flex-shrink-0 font-bold" style={{ color: '#059669' }}>➡️</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {/* Fun facts */}
            {p.fun_facts && p.fun_facts.length > 0 && (
              <div>
                <h2 className="font-display font-extrabold text-[#1A0F0A] text-base mb-3">🧩 Zajímavosti</h2>
                <div className="space-y-3">
                  {p.fun_facts.map((f, i) => (
                    <div key={i} className="rounded-lg p-4 border border-[#F0EDE8] bg-white flex gap-3">
                      <span className="text-xl flex-shrink-0">{['🐕‍🦺', '🧠', '🎬', '🏆', '🌍'][i % 5]}</span>
                      <p className="text-sm leading-relaxed" style={{ color: '#2C1810' }}>{f}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {p.summary && (
              <div className="p-6 rounded-lg border-l-4" style={{ background: '#FBF0EC', borderColor: '#E8634A' }}>
                <h2 className="font-display font-extrabold text-[#1A0F0A] text-base mb-2">✔️ Shrnutí</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#4A2C1A' }}>{p.summary}</p>
              </div>
            )}

          </div>

          {/* RIGHT: adoptions sidebar */}
          <aside className="w-full lg:w-[300px] xl:w-[320px] flex-shrink-0 lg:sticky lg:top-24">
            <div className="rounded-lg border border-[#F0EDE8] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0EDE8] flex items-center justify-between"
                style={{ background: '#FBF0EC' }}>
                <h2 className="font-display font-extrabold text-sm text-[#1A0F0A]">
                  Aktuálně k adopci
                </h2>
                {animalList.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#E8634A', color: 'white' }}>
                    {animalList.length}
                  </span>
                )}
              </div>

              {animalList.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-3xl mb-2">🐾</div>
                  <p className="text-sm font-semibold text-[#4A2C1A] mb-1">Žádná zvířata k adopci</p>
                  <p className="text-xs mb-4" style={{ color: '#8B6550' }}>Nová zvířata přibývají každý den</p>
                  <Link href="/adopt"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-white no-underline hover:opacity-90 transition-opacity text-xs"
                    style={{ background: '#E8634A' }}>
                    Všechna zvířata →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-[#F0EDE8] max-h-[70vh] overflow-y-auto">
                    {animalList.map(animal => <AdoptionRow key={animal.id} animal={animal} />)}
                  </div>
                  {animalList.length >= 20 && (
                    <div className="px-4 py-3 border-t border-[#F0EDE8]">
                      <Link href={`/adopt?species=${breed.species_id}&breed=${encodeURIComponent(breed.name_cs)}`}
                        className="block text-center text-xs font-bold no-underline hover:opacity-80 transition-opacity"
                        style={{ color: '#E8634A' }}>
                        Zobrazit vše →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

        </div>

        <div className="mt-10 pt-6 border-t border-[#F0EDE8]">
          <Link href="/katalog" className="text-sm font-semibold no-underline hover:text-[#E8634A] transition-colors"
            style={{ color: '#8B6550' }}>
            ← Zpět na katalog plemen
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HeroStat({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
      style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}>
      <span>{icon}</span>{label}
    </span>
  )
}

function Section({ icon, title, accent, children }: { icon: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#F0EDE8] bg-white overflow-hidden">
      <div className="px-5 py-3 flex items-center gap-2 border-b border-[#F0EDE8]"
        style={{ borderLeft: `4px solid ${accent}` }}>
        <span className="text-base">{icon}</span>
        <h2 className="font-display font-extrabold text-sm text-[#1A0F0A] uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function InfoTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return null
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-[#F8F5F2] last:border-0">
            <td className="py-1.5 pr-3 font-semibold whitespace-nowrap" style={{ color: '#A08070', width: '45%' }}>{label}</td>
            <td className="py-1.5 font-medium" style={{ color: '#2C1810' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BulletList({ items, small }: { items: string[]; small?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-2 ${small ? 'text-xs' : 'text-sm'}`} style={{ color: '#2C1810' }}>
          <span className="flex-shrink-0 mt-0.5" style={{ color: '#E8634A' }}>•</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Callout({ type, children, className = '' }: { type: 'info' | 'warning'; children: React.ReactNode; className?: string }) {
  const styles = type === 'info'
    ? { background: '#EFF6FF', border: '#BFDBFE' }
    : { background: '#FFF7ED', border: '#FED7AA' }
  return (
    <div className={`rounded-lg p-3 border ${className}`}
      style={{ background: styles.background, borderColor: styles.border }}>
      {children}
    </div>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < n ? '⭐' : '☆'}</span>
      ))}
    </span>
  )
}

type AnimalRow = {
  id: string; name: string; gender?: string; age_years?: number; age_months?: number
  photo_url?: string; institution?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null
}

function AdoptionRow({ animal }: { animal: AnimalRow }) {
  const inst = Array.isArray(animal.institution) ? animal.institution[0] : animal.institution
  return (
    <Link href={`/adopt/${animal.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#FDFCFA] transition-colors no-underline group">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F0EB] flex-shrink-0">
        {animal.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={animal.photo_url} alt={animal.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[#1A0F0A] truncate group-hover:text-[#E8634A] transition-colors">{animal.name}</p>
        {inst && <p className="text-xs truncate" style={{ color: '#A08070' }}>{inst.name}</p>}
        <div className="flex gap-1 mt-0.5">
          {animal.gender && (
            <span className="text-[10px] font-bold" style={{ color: '#8B6550' }}>
              {animal.gender === 'male' ? '♂' : animal.gender === 'female' ? '♀' : ''}
            </span>
          )}
          {animal.age_years != null && (
            <span className="text-[10px]" style={{ color: '#A08070' }}>
              {animal.age_years === 0 ? `${animal.age_months ?? 0} měs.` : `${animal.age_years} r.`}
            </span>
          )}
        </div>
      </div>
      <span className="text-[#E8634A] text-xs font-bold flex-shrink-0">→</span>
    </Link>
  )
}
