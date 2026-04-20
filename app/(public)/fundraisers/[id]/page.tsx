import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const f = await getFundraiser(id)
  if (!f) return { title: 'Sbírka | Zozio' }
  return {
    title: `${f.title} | Sbírky | Zozio`,
    description: f.description ?? undefined,
    openGraph: f.image_url ? { images: [f.image_url] } : undefined,
  }
}

export default async function FundraiserDetailPage({ params }: PageProps) {
  const { id } = await params
  const f = await getFundraiser(id)
  if (!f) notFound()

  const institution = f.institution as any
  const isShelter   = institution?.type === 'shelter'
  const accent      = isShelter ? '#E8634A' : '#2E9E8F'

  const pct        = f.goal_amount > 0 ? Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100) : 0
  const isComplete = pct >= 100
  const isNearGoal = pct >= 80 && !isComplete

  const coverPhoto  = f.image_url ?? institution?.cover_url ?? null
  const deadlineInfo = getDeadlineInfo(f.deadline)
  const hasDarujme   = !!f.darujme_project_id

  // Sync timestamp
  const syncedAgo = f.darujme_synced_at
    ? getSyncedAgo(f.darujme_synced_at)
    : null

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[900px] mx-auto px-5 md:px-10 pb-16">

        {/* Breadcrumb */}
        <div className="py-4 md:py-6">
          <Link href="/fundraisers" className="text-sm font-semibold no-underline hover:opacity-70 transition-colors"
            style={{ color: accent }}>
            ← Zpět na sbírky
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10 items-start">

          {/* Left — content */}
          <div className="md:col-span-3">
            {coverPhoto ? (
              <div className="relative rounded-2xl overflow-hidden mb-6" style={{ height: 260 }}>
                <Image src={coverPhoto} alt={f.title} fill loading="eager" className="object-cover"
                  sizes="(max-width: 768px) 100vw, 520px" />
              </div>
            ) : (
              <div className="rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden"
                style={{ height: 180, background: isShelter ? '#FDEAE6' : '#E4F7F5' }}>
                {institution?.logo_url ? (
                  <Image src={institution.logo_url} alt={institution.name} fill className="object-contain p-8" sizes="520px" />
                ) : (
                  <span className="text-7xl">{isShelter ? '🏠' : '🚑'}</span>
                )}
              </div>
            )}

            {/* Institution row */}
            {institution && (
              <div className="flex items-center gap-3 mb-4">
                {institution.logo_url && (
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-[#F0EDE8]">
                    <Image src={institution.logo_url} alt={institution.name} fill className="object-cover" sizes="32px" />
                  </div>
                )}
                <Link href={`/institutions/${institution.slug}`}
                  className="text-sm font-bold no-underline hover:opacity-70 transition-opacity"
                  style={{ color: accent }}>
                  {institution.name} →
                </Link>
              </div>
            )}

            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-[#1A0F0A] mb-4 leading-tight">
              {f.title}
            </h1>

            {f.description && (
              <p className="leading-relaxed whitespace-pre-line text-sm md:text-base" style={{ color: '#4A3728' }}>
                {f.description}
              </p>
            )}

            {/* Darujme badge */}
            {hasDarujme && (
              <div className="mt-6 flex items-center gap-2 text-xs p-3 rounded-lg border"
                style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                <span>💛</span>
                <span>Tato sbírka je provozována přes platformu <strong>darujme.cz</strong> — platby probíhají přímo tam.</span>
              </div>
            )}
          </div>

          {/* Right — donate box */}
          <div className="md:col-span-2">
            <div className="sticky top-24 bg-white rounded-2xl border p-5 md:p-6"
              style={{ borderColor: '#F0EDE8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

              {isComplete && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm font-bold text-green-700 bg-green-50">
                  🎉 Cíl byl splněn! Děkujeme!
                </div>
              )}
              {!f.active && !isComplete && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm font-bold"
                  style={{ background: '#F0EDE8', color: '#5F5E5A' }}>
                  Sbírka byla ukončena
                </div>
              )}
              {deadlineInfo?.urgent && f.active && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm font-bold text-white"
                  style={{ background: deadlineInfo.color }}>
                  ⏰ {deadlineInfo.label}
                </div>
              )}

              {/* Amounts */}
              <div className="mb-2">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-extrabold text-2xl text-[#1A0F0A]">
                    {f.current_amount.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <span className="text-sm" style={{ color: '#8B6550' }}>
                  vybráno z {f.goal_amount.toLocaleString('cs-CZ')} Kč
                </span>
              </div>

              {/* Donors */}
              {(f.darujme_donors_count ?? 0) > 0 && (
                <div className="text-sm mb-2" style={{ color: '#8B6550' }}>
                  👥 <strong className="text-[#1A0F0A]">{f.darujme_donors_count}</strong> dárců
                </div>
              )}

              {/* Progress */}
              <div className="h-3 rounded-full overflow-hidden mb-2 mt-3" style={{ background: '#F0EDE8' }}>
                <div className="h-full rounded-full" style={{
                  width: `${pct}%`,
                  background: isComplete ? '#16a34a' : isNearGoal ? '#F0A500' : accent,
                }} />
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-bold" style={{
                  color: isComplete ? '#16a34a' : isNearGoal ? '#F0A500' : accent,
                }}>
                  {isComplete ? '🎉 100% — Cíl splněn!' : isNearGoal ? `🔥 ${pct}% vybráno` : `${pct}% vybráno`}
                </span>
                {deadlineInfo && !deadlineInfo.urgent && (
                  <span className="text-xs" style={{ color: deadlineInfo.color }}>📅 {deadlineInfo.label}</span>
                )}
              </div>

              {/* CTA */}
              {f.active && !isComplete && (
                f.darujme_url ? (
                  <a
                    href={f.darujme_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-base text-white no-underline hover:opacity-90 transition-opacity"
                    style={{ background: accent }}>
                    💛 Přispět na darujme.cz
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ) : (
                  <>
                    <div className="w-full py-3 rounded-xl font-bold text-base text-white text-center"
                      style={{ background: accent, cursor: 'default' }}>
                      💛 Přispět
                    </div>
                    <p className="text-center text-xs mt-3 mb-1" style={{ color: '#8B6550' }}>
                      Kontaktuj instituci přímo:
                    </p>
                    {institution?.email && (
                      <a href={`mailto:${institution.email}`}
                        className="block text-center text-xs font-semibold no-underline hover:opacity-70 transition-opacity"
                        style={{ color: accent }}>
                        ✉ {institution.email}
                      </a>
                    )}
                    {institution?.phone && (
                      <a href={`tel:${institution.phone}`}
                        className="block text-center text-xs font-semibold mt-1 no-underline hover:opacity-70 transition-opacity"
                        style={{ color: '#8B6550' }}>
                        📞 {institution.phone}
                      </a>
                    )}
                  </>
                )
              )}

              {/* Sync info */}
              {hasDarujme && syncedAgo && (
                <p className="text-center text-[11px] mt-3" style={{ color: '#B0A89E' }}>
                  🔄 Aktualizováno {syncedAgo}
                </p>
              )}

              {institution && (
                <Link href={`/institutions/${institution.slug}`}
                  className="block text-center text-xs font-semibold mt-4 no-underline hover:opacity-70 transition-opacity"
                  style={{ color: '#8B6550' }}>
                  Navštívit profil instituce →
                </Link>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}

function getDeadlineInfo(deadline: string | null) {
  if (!deadline) return null
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (days < 0)   return { label: 'Ukončena',              color: '#8B6550', urgent: false }
  if (days === 0) return { label: 'Dnes končí!',           color: '#E8634A', urgent: true  }
  if (days <= 3)  return { label: `Zbývají ${days} dny!`, color: '#E8634A', urgent: true  }
  if (days <= 7)  return { label: `Zbývá ${days} dní`,    color: '#F0A500', urgent: true  }
  return {
    label: new Date(deadline).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' }),
    color: '#8B6550', urgent: false,
  }
}

function getSyncedAgo(syncedAt: string): string {
  const mins = Math.floor((Date.now() - new Date(syncedAt).getTime()) / 60_000)
  if (mins < 1)  return 'právě teď'
  if (mins < 60) return `před ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `před ${hrs} h`
  return `před ${Math.floor(hrs / 24)} dny`
}

async function getFundraiser(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fundraisers')
    .select(`
      id, title, description, goal_amount, current_amount, active, deadline,
      image_url, darujme_project_id, darujme_url, darujme_donors_count, darujme_synced_at,
      institution:institutions(name, slug, type, email, phone, logo_url, cover_url)
    `)
    .eq('id', id)
    .single()
  return data
}
