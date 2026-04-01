import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { RescueFilter } from '@/components/public/RescueFilter'
import { FavoriteButton } from '@/components/public/FavoriteButton'
import type { RescueCaseStatus } from '@/types/database'

/* ── Query-specific types ── */
interface RescueListCase {
  id: string
  name: string | null
  case_number: string | null
  status: RescueCaseStatus
  cause_of_injury: string | null
  public_description: string | null
  estimated_age: string | null
  primary_photo: string | null
  intake_date: string | null
  species: { name_cs: string; icon: string | null } | null
  institution: { name: string; city: string; slug: string } | null
}

interface RescueFilterParams {
  species?: string
  status?: string
  city?: string
  page?: string
}

export const metadata: Metadata = {
  title: 'Záchranné stanice | Zozio',
  description: 'Zachraňme ohrožená volně žijící zvířata. Podpoř záchranné stanice po celé ČR a SR.',
}

const PAGE_SIZE = 18

interface PageProps {
  searchParams: Promise<{ species?: string; status?: string; city?: string; page?: string }>
}

export default async function RescuePage({ searchParams }: PageProps) {
  const params = await searchParams
  const page   = Math.max(1, parseInt(params.page ?? '1'))

  const [cases, total, species, cities] = await Promise.all([
    getRescueCases(params, page),
    getTotal(params),
    getSpecies(),
    getCities(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-rescue">Záchranné stanice</p>
          <h1 className="font-display font-extrabold text-text-primary mb-1" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Zachraňme ohrožená zvířata
          </h1>
          <p className="text-sm text-text-muted">
            {total === 0 ? 'Žádné výsledky' : `${total} záchranných případů`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <aside className="w-full lg:w-56 flex-shrink-0">
            <RescueFilter species={species} cities={cities} params={params} />
          </aside>

          <div className="flex-1 min-w-0">
            {cases.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-bold text-xl text-text-primary mb-2">Žádné výsledky</p>
                <p className="text-sm mb-6 text-text-muted">Zkus upravit filtry.</p>
                <Link href="/rescue" className="inline-flex px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline bg-rescue">Zrušit filtry</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((c: RescueListCase) => <RescueCard key={c.id} c={c} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
                {page > 1 && (
                  <Link href={buildUrl(params, { page: String(page - 1) })}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm border no-underline"
                    style={{ borderColor: '#E0DDD8', color: 'var(--text-body)', background: 'white' }}>←</Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link key={p} href={buildUrl(params, { page: String(p) })}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium border no-underline"
                    style={p === page
                      ? { background: 'var(--rescue)', color: 'white', borderColor: 'var(--rescue)' }
                      : { background: 'white', color: 'var(--text-body)', borderColor: '#E0DDD8' }
                    }>{p}</Link>
                ))}
                {page < totalPages && (
                  <Link href={buildUrl(params, { page: String(page + 1) })}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm border no-underline"
                    style={{ borderColor: '#E0DDD8', color: 'var(--text-body)', background: 'white' }}>→</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function RescueCard({ c }: { c: RescueListCase }) {
  const species     = c.species
  const institution = c.institution
  const intakeDate  = c.intake_date
    ? new Date(c.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })
    : null

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    intake:         { label: '🚑 Příjem',       bg: 'var(--coral-tag-bg)', color: 'var(--coral-tag-text)' },
    treatment:      { label: '🩺 Léčba',        bg: 'var(--warning-tag-bg)', color: 'var(--warning-tag-text)' },
    rehabilitation: { label: '💪 Rehabilitace', bg: 'var(--rescue-tag-bg)', color: 'var(--rescue-tag-text)' },
    released:       { label: '🌿 Propuštěno',   bg: 'var(--success-tag-bg)', color: 'var(--success-tag-text)' },
    transferred:    { label: '🚐 Přemístěno',   bg: 'var(--border)', color: 'var(--text-neutral)' },
  }
  const status = statusConfig[c.status] ?? statusConfig.intake
  const isReleased = c.status === 'released'

  return (
    <div className="relative group">
      <Link href={`/rescue/${c.id}`} className="no-underline">
        <div className="bg-white rounded-2xl overflow-hidden border border-border hover:border-rescue/40 hover:-translate-y-1 transition-all duration-200 h-full flex flex-col"
          style={{ borderTop: '3px solid var(--rescue)' }}>

          <div className="relative h-44 overflow-hidden flex-shrink-0 bg-rescue-tag-bg">
            {c.primary_photo
              ? <Image src={c.primary_photo} alt={c.name ?? c.case_number ?? ''} fill
                  sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-5xl">
                  {species?.icon ?? '🐾'}
                </div>
            }
            {/* Status badge */}
            <div className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: status.bg, color: status.color }}>
              {status.label}
            </div>
            {/* ❤️ Favorite button */}
            <div className="absolute top-3 right-3">
              <FavoriteButton type="animal" id={c.id} size="sm" />
            </div>
            {institution?.city && (
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className="text-[10px] font-bold text-text-primary">{institution.city}</span>
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col flex-1">
            <div className="font-bold text-text-primary text-base mb-0.5 truncate">
              {c.name ?? c.case_number ?? 'Neznámé zvíře'}
            </div>
            <div className="text-xs mb-2 truncate text-text-muted">
              {[species?.name_cs, c.estimated_age, intakeDate ? `od ${intakeDate}` : null].filter(Boolean).join(' · ')}
            </div>
            {c.cause_of_injury && (
              <div className="mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                  style={{ background: 'var(--border)', color: 'var(--text-body)' }}>
                  {c.cause_of_injury.slice(0, 45)}
                </span>
              </div>
            )}
            {c.public_description && (
              <p className="text-xs line-clamp-2 leading-relaxed flex-1 mb-3 text-text-muted">
                {c.public_description}
              </p>
            )}
            <div className="mt-auto pt-3 border-t border-border">
              <button className="w-full py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer hover:opacity-90 transition-all"
                style={{ background: isReleased ? 'var(--success-tag-text)' : 'var(--rescue)' }}>
                {isReleased ? '🎉 Příběh záchrany' : '💛 Podpořit léčbu'}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

function buildUrl(params: RescueFilterParams, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/rescue${str ? `?${str}` : ''}`
}

async function getRescueCases(params: RescueFilterParams, page: number) {
  const supabase = await createClient()
  const offset   = (page - 1) * PAGE_SIZE
  let query = supabase
    .from('rescue_cases')
    .select('id, name, case_number, status, cause_of_injury, public_description, estimated_age, primary_photo, intake_date, species:animal_species(name_cs,icon), institution:institutions(name,city,slug)')
    .eq('published', true)
    .not('status', 'in', '("deceased")')
  if (params.species) query = query.eq('species_id', params.species)
  if (params.status)  query = query.eq('status', params.status)
  query = query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1)
  const { data } = await query
  let cases = (data ?? []) as unknown as RescueListCase[]
  if (params.city) cases = cases.filter(c => c.institution?.city === params.city)
  return cases
}

async function getTotal(params: RescueFilterParams) {
  const supabase = await createClient()
  let query = supabase
    .from('rescue_cases')
    .select('id', { count: 'exact', head: true })
    .eq('published', true)
    .not('status', 'in', '("deceased")')
  if (params.species) query = query.eq('species_id', params.species)
  if (params.status)  query = query.eq('status', params.status)
  const { count } = await query
  return count ?? 0
}

async function getSpecies() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animal_species')
    .select('id, name_cs, icon')
    .eq('category', 'wild')
    .order('name_cs')
  return data ?? []
}

async function getCities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('institutions')
    .select('city')
    .eq('type', 'rescue_station')
    .eq('approval_status', 'approved')
  return [...new Set((data ?? []).map((d: { city: string }) => d.city).filter(Boolean))].sort() as string[]
}
