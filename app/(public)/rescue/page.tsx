import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { RescueFilter } from '@/components/public/RescueFilter'
import { FavoriteButton } from '@/components/public/FavoriteButton'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Záchranné stanice | Zozio',
  description: 'Zachraňme ohrožená volně žijící zvířata. Podpoř záchranné stanice po celé ČR a SR.',
}

const PAGE_SIZE = 18

interface PageProps {
  searchParams: Promise<{
    species?: string
    status?:  string
    city?:    string
    lat?:     string
    lng?:     string
    sex?:     string
    page?:    string
  }>
}

export default async function RescuePage({ searchParams }: PageProps) {
  const params = await searchParams
  const page   = Math.max(1, parseInt(params.page ?? '1'))
  const hasLoc = !!(params.lat && params.lng)

  const [{ cases, total }, species, cities] = await Promise.all([
    getRescueCases(params, page),
    getSpecies(),
    getCities(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#2E9E8F' }}>Záchranné stanice</p>
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-1" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            {hasLoc ? 'Příběhy z vašeho okolí' : 'Zachraňme ohrožená zvířata'}
          </h1>
          <p className="text-sm" style={{ color: '#8B6550' }}>
            {total === 0 ? 'Žádné výsledky' : `${total} záchranných případů`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <aside className="w-full lg:w-56 flex-shrink-0">
            <RescueFilter species={species} cities={cities} params={params} total={total} />
          </aside>

          <div className="flex-1 min-w-0">

            {/* Lokační banner */}
            {hasLoc && (
              <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-lg gap-3"
                style={{ background: '#E1F5EE', border: '1px solid #BDE8D0' }}>
                <span className="text-sm font-semibold" style={{ color: '#0F6E56' }}>
                  📍 Záchranné příběhy z vašeho okolí
                  {params.city && <> · <strong>{params.city}</strong></>}
                </span>
                <Link
                  href={buildUrl(params, { lat: undefined, lng: undefined, city: undefined, page: undefined })}
                  className="text-xs font-bold no-underline flex-shrink-0"
                  style={{ color: '#2E9E8F' }}>
                  × Zrušit
                </Link>
              </div>
            )}

            {/* Toolbar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-5 gap-3">
                <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
                  Strana {page} z {totalPages}
                </p>
              </div>
            )}

            {/* Grid / prázdný stav */}
            {cases.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">{hasLoc ? '📍' : '🔍'}</div>
                <p className="font-bold text-xl text-[#1A0F0A] mb-2">
                  {hasLoc ? 'V okolí nejsou žádné záchranné stanice' : 'Žádné výsledky'}
                </p>
                <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
                  {hasLoc ? 'Zkus rozšířit oblast nebo zobrazit všechny příběhy.' : 'Zkus upravit filtry.'}
                </p>
                <Link href="/rescue" className="inline-flex px-5 py-2.5 rounded-lg font-bold text-sm text-white no-underline"
                  style={{ background: '#2E9E8F' }}>
                  {hasLoc ? 'Zobrazit všechny příběhy' : 'Zrušit filtry'}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {cases.map((c: any) => <RescueCard key={c.id} c={c} />)}
              </div>
            )}

            {/* Stránkování */}
            {totalPages > 1 && (
              <Pagination current={page} total={totalPages} params={params} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Helpers ── */

function buildUrl(params: any, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/rescue${str ? `?${str}` : ''}`
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ── Karta záchranného případu ── */
function RescueCard({ c }: { c: any }) {
  const species     = c.species     as any
  const institution = c.institution as any
  const intakeDate  = c.intake_date
    ? new Date(c.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })
    : null

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    intake:         { label: '🚑 Příjem',       bg: '#FAECE7', color: '#993C1D' },
    treatment:      { label: '🩺 Léčba',        bg: '#FAEEDA', color: '#854F0B' },
    rehabilitation: { label: '💪 Rehabilitace', bg: '#E1F5EE', color: '#0F6E56' },
    released:       { label: '🌿 Propuštěno',   bg: '#EAF3DE', color: '#3B6D11' },
    transferred:    { label: '🚐 Přemístěno',   bg: '#F0EDE8', color: '#5F5E5A' },
  }
  const status     = statusConfig[c.status] ?? statusConfig.intake
  const isReleased = c.status === 'released'

  return (
    <div className="relative group">
      <Link href={`/rescue/${c.id}`} className="no-underline block h-full">
        <div className="bg-white rounded-lg overflow-hidden border border-[#F0EDE8] group-hover:border-[#2E9E8F]/40 group-hover:-translate-y-1 transition-all duration-200 h-full flex flex-col"
          style={{ borderTop: '3px solid #2E9E8F' }}>

          <div className="relative h-40 sm:h-44 overflow-hidden flex-shrink-0" style={{ background: '#E1F5EE' }}>
            {c.primary_photo
              ? <Image src={c.primary_photo} alt={c.name ?? c.case_number ?? ''}
                  fill sizes="(max-width:640px) 50vw,(max-width:1024px) 50vw,33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-5xl">
                  {species?.icon ?? '🐾'}
                </div>
            }
            <div className="absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: status.bg, color: status.color }}>
              {status.label}
            </div>
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
              <span className="text-[10px] font-bold text-[#1A0F0A]">
                {institution?.city ?? ''}
                {c._distance != null && ` · ${c._distance < 1 ? '< 1' : c._distance} km`}
              </span>
            </div>
          </div>

          <div className="p-3 flex flex-col flex-1">
            <div className="font-bold text-[#1A0F0A] text-sm sm:text-base mb-0.5 truncate">
              {c.name ?? c.case_number ?? 'Neznámé zvíře'}
            </div>
            <div className="text-xs mb-0.5 truncate" style={{ color: '#8B6550' }}>
              {[
                species?.name_cs,
                c.sex === 'male' ? '♂ Samec' : c.sex === 'female' ? '♀ Samice' : null,
                c.estimated_age,
                intakeDate ? `od ${intakeDate}` : null,
              ].filter(Boolean).join(' · ')}
            </div>
            {institution?.name && (
              <div className="text-[11px] mb-2 truncate font-medium" style={{ color: '#8B6550' }}>
                📍 {institution.name}
              </div>
            )}
            {c.cause_of_injury && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                  style={{ background: '#F0EDE8', color: '#6B4030' }}>
                  {c.cause_of_injury.slice(0, 40)}{c.cause_of_injury.length > 40 ? '…' : ''}
                </span>
              </div>
            )}
            {c.public_description && (
              <p className="text-xs line-clamp-2 leading-relaxed flex-1 mb-2" style={{ color: '#8B6550' }}>
                {c.public_description}
              </p>
            )}
            <div className="mt-auto pt-2.5 border-t border-[#F0EDE8]">
              <div className="w-full py-2 rounded-lg font-bold text-xs text-white text-center"
                style={{ background: isReleased ? '#3B6D11' : '#2E9E8F' }}>
                {isReleased ? '🎉 Příběh záchrany' : '💛 Podpořit léčbu'}
              </div>
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute top-2.5 right-2.5 z-10">
        <FavoriteButton type="animal" id={c.id} size="sm" />
      </div>
    </div>
  )
}

/* ── Stránkování ── */
function Pagination({ current, total, params }: { current: number; total: number; params: any }) {
  const pages = getPaginationRange(current, total)
  return (
    <nav aria-label="Stránkování" className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      {current > 1 && (
        <Link href={buildUrl(params, { page: String(current - 1) })}
          aria-label="Předchozí stránka"
          className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm border no-underline transition-all hover:opacity-80"
          style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>←</Link>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} aria-hidden="true"
            className="min-w-[44px] h-11 flex items-center justify-center text-sm" style={{ color: '#8B6550' }}>…</span>
        ) : (
          <Link key={p} href={buildUrl(params, { page: String(p) })}
            aria-label={`Stránka ${p}`}
            aria-current={p === current ? 'page' : undefined}
            className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm font-medium border no-underline transition-all"
            style={p === current
              ? { background: '#2E9E8F', color: 'white', borderColor: '#2E9E8F' }
              : { background: 'white', color: '#6B4030', borderColor: '#E0DDD8' }
            }>{p}</Link>
        )
      )}
      {current < total && (
        <Link href={buildUrl(params, { page: String(current + 1) })}
          aria-label="Další stránka"
          className="min-w-[44px] h-11 rounded-lg flex items-center justify-center text-sm border no-underline transition-all hover:opacity-80"
          style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>→</Link>
      )}
    </nav>
  )
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

/* ── Data ── */

async function getRescueCases(params: any, page: number) {
  const supabase = createServiceClient()
  const hasLoc   = !!(params.lat && params.lng)

  // GPS mode — pre-filter institutions by bounding box, sort cases by distance
  if (hasLoc) {
    const uLat = parseFloat(params.lat)
    const uLng = parseFloat(params.lng)

    const { data: nearbyInsts } = await supabase
      .from('institutions')
      .select('id, lat, lng')
      .eq('type', 'rescue_station')
      .gte('lat', uLat - 2.0).lte('lat', uLat + 2.0)
      .gte('lng', uLng - 3.0).lte('lng', uLng + 3.0)
      .not('lat', 'is', null).not('lng', 'is', null)

    if (!nearbyInsts || nearbyInsts.length === 0) return { cases: [], total: 0 }

    const sorted     = nearbyInsts
      .map(i => ({ id: i.id, dist: Math.round(haversineKm(uLat, uLng, Number(i.lat), Number(i.lng))) }))
      .sort((a, b) => a.dist - b.dist)
    const ids        = sorted.map(i => i.id)
    const distMap    = new Map(sorted.map(i => [i.id, i.dist]))

    let query = supabase
      .from('rescue_cases')
      .select(
        'id, name, case_number, status, sex, cause_of_injury, public_description, estimated_age, primary_photo, intake_date, institution_id, species:animal_species(name_cs,icon), institution:institutions(name,city,slug)',
        { count: 'exact' }
      )
      .eq('published', true)
      .not('status', 'in', '("deceased")')
      .in('institution_id', ids)

    if (params.species) query = query.eq('species_id', params.species)
    if (params.status)  query = query.eq('status', params.status)
    if (params.sex)     query = query.eq('sex', params.sex)

    const { data, count } = await query
    let cases = (data ?? []) as any[]
    cases = cases
      .map(c => ({ ...c, _distance: distMap.get(c.institution_id) ?? null }))
      .sort((a, b) => (a._distance ?? 999) - (b._distance ?? 999))

    const start = (page - 1) * PAGE_SIZE
    return { cases: cases.slice(start, start + PAGE_SIZE), total: count ?? cases.length }
  }

  // Normal mode
  const offset = (page - 1) * PAGE_SIZE

  let institutionIds: string[] | null = null
  if (params.city) {
    const { data: insts } = await supabase
      .from('institutions').select('id')
      .eq('city', params.city).eq('type', 'rescue_station')
    institutionIds = (insts ?? []).map((i: any) => i.id)
    if (institutionIds.length === 0) return { cases: [], total: 0 }
  }

  let query = supabase
    .from('rescue_cases')
    .select(
      'id, name, case_number, status, sex, cause_of_injury, public_description, estimated_age, primary_photo, intake_date, species:animal_species(name_cs,icon), institution:institutions(name,city,slug)',
      { count: 'exact' }
    )
    .eq('published', true)
    .not('status', 'in', '("deceased")')

  if (institutionIds) query = query.in('institution_id', institutionIds)
  if (params.species) query = query.eq('species_id', params.species)
  if (params.status)  query = query.eq('status', params.status)
  if (params.sex)     query = query.eq('sex', params.sex)

  query = query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1)

  const { data, count } = await query
  return { cases: (data ?? []) as any[], total: count ?? 0 }
}

async function getSpecies() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('animal_species').select('id, name_cs, icon')
    .eq('category', 'wild').order('name_cs')
  return data ?? []
}

async function getCities() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('institutions').select('city')
    .eq('type', 'rescue_station').eq('approval_status', 'approved')
  return [...new Set((data ?? []).map((d: any) => d.city).filter(Boolean))].sort() as string[]
}
