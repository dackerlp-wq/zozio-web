import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Sbírky | Zozio',
  description: 'Podpořte útulky. Přispějte přímo institucím, které zachraňují zvířata.',
}

export default async function FundraisersPage() {
  const fundraisers = await getFundraisers()

  const active   = fundraisers.filter((f: any) => f.active)
  const finished = fundraisers.filter((f: any) => !f.active)

  const totalRaised = fundraisers.reduce((sum: number, f: any) => sum + (f.current_amount ?? 0), 0)
  const totalGoal   = fundraisers.reduce((sum: number, f: any) => sum + (f.goal_amount   ?? 0), 0)
  const totalDonors = fundraisers.reduce((sum: number, f: any) => sum + (f.darujme_donors_count ?? 0), 0)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">

        {/* Hero */}
        <div className="py-8 md:py-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#F0A500' }}>Sbírky</p>
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-3" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Podpořte útulky
          </h1>
          <p className="text-sm max-w-xl leading-relaxed mb-6" style={{ color: '#8B6550' }}>
            Každá koruna putuje přímo instituci. Pomoz útulkům a záchranným stanicím,
            které se starají o opuštěná a ohrožená zvířata každý den.
          </p>

          {fundraisers.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2.5 rounded-lg bg-white border border-[#F0EDE8]">
                <span className="font-extrabold" style={{ color: '#E8634A' }}>{active.length}</span>
                <span className="text-sm ml-1.5" style={{ color: '#8B6550' }}>aktivních sbírek</span>
              </div>
              {totalRaised > 0 && (
                <div className="px-4 py-2.5 rounded-lg bg-white border border-[#F0EDE8]">
                  <span className="font-extrabold text-[#1A0F0A]">{totalRaised.toLocaleString('cs-CZ')} Kč</span>
                  <span className="text-sm ml-1.5" style={{ color: '#8B6550' }}>celkem vybráno</span>
                </div>
              )}
              {totalDonors > 0 && (
                <div className="px-4 py-2.5 rounded-lg bg-white border border-[#F0EDE8]">
                  <span className="font-extrabold text-[#1A0F0A]">{totalDonors}</span>
                  <span className="text-sm ml-1.5" style={{ color: '#8B6550' }}>dárců</span>
                </div>
              )}
              {totalGoal > 0 && (
                <div className="px-4 py-2.5 rounded-lg bg-white border border-[#F0EDE8]">
                  <span className="font-extrabold text-[#1A0F0A]">{Math.round((totalRaised / totalGoal) * 100)}%</span>
                  <span className="text-sm ml-1.5" style={{ color: '#8B6550' }}>průměrně splněno</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Aktivní sbírky */}
        {active.length > 0 && (
          <section className="mb-12">
            <h2 className="font-bold text-lg text-[#1A0F0A] mb-5 pb-3 border-b border-[#F0EDE8]">
              Aktivní sbírky
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {active.map((f: any) => <FundraiserCard key={f.id} f={f} />)}
            </div>
          </section>
        )}

        {/* Ukončené */}
        {finished.length > 0 && (
          <section>
            <h2 className="font-bold text-lg text-[#1A0F0A] mb-5 pb-3 border-b border-[#F0EDE8]">
              Ukončené sbírky
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {finished.map((f: any) => <FundraiserCard key={f.id} f={f} finished />)}
            </div>
          </section>
        )}

        {fundraisers.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💛</div>
            <p className="font-bold text-xl text-[#1A0F0A] mb-2">Zatím žádné sbírky</p>
            <p className="text-sm" style={{ color: '#8B6550' }}>Brzy tu budou sbírky od útulků.</p>
          </div>
        )}
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
    label: `Do ${new Date(deadline).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}`,
    color: '#8B6550', urgent: false,
  }
}

function FundraiserCard({ f, finished = false }: { f: any; finished?: boolean }) {
  const institution = f.institution as any
  const isShelter   = institution?.type === 'shelter'
  const accent      = isShelter ? '#E8634A' : '#2E9E8F'

  const pct        = f.goal_amount > 0 ? Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100) : 0
  const isComplete = pct >= 100
  const isNearGoal = pct >= 80 && !isComplete

  const coverPhoto = f.image_url ?? institution?.cover_url ?? null
  const deadlineInfo = getDeadlineInfo(f.deadline)
  const hasDarujme   = !!f.darujme_project_id

  return (
    <Link href={`/fundraisers/${f.id}`} className="no-underline block group">
      <div
        className={`bg-white rounded-xl border overflow-hidden h-full flex flex-col transition-all duration-200 ${finished ? 'opacity-70' : 'hover:-translate-y-1 hover:shadow-md'}`}
        style={{ borderColor: finished ? '#F0EDE8' : `${accent}22` }}>

        {/* Cover */}
        {coverPhoto ? (
          <div className="relative h-28 sm:h-36 overflow-hidden flex-shrink-0">
            <Image
              src={coverPhoto} alt={f.title} fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {/* Darujme badge */}
            {hasDarujme && (
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#F0A500] border border-[#F0A500]/30">
                  darujme.cz
                </span>
              </div>
            )}
            <div className="absolute top-2 left-2 flex gap-1">
              {deadlineInfo?.urgent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: deadlineInfo.color }}>
                  ⏰ {deadlineInfo.label}
                </span>
              )}
              {isComplete && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-green-600">
                  ✓ Cíl splněn!
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="h-20 sm:h-24 flex-shrink-0 relative flex items-center justify-center"
            style={{ background: isShelter ? '#FDEAE6' : '#E4F7F5' }}>
            {/* Logo instituce */}
            {institution?.logo_url ? (
              <Image src={institution.logo_url} alt={institution.name} fill className="object-contain p-4" sizes="200px" />
            ) : (
              <span className="text-4xl">{isShelter ? '🏠' : '🚑'}</span>
            )}
            {hasDarujme && (
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#F0A500] border border-[#F0A500]/30">
                  darujme.cz
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          {/* Instituce */}
          {institution && (
            <span className="text-[11px] font-semibold mb-1 truncate block" style={{ color: accent }}>
              {institution.name}
            </span>
          )}

          <div className="font-bold text-[#1A0F0A] leading-tight mb-2 text-sm line-clamp-2">{f.title}</div>

          {f.description && (
            <p className="text-xs line-clamp-2 mb-3 leading-relaxed flex-1" style={{ color: '#8B6550' }}>
              {f.description}
            </p>
          )}

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-[#1A0F0A]">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
              <span style={{ color: '#8B6550' }}>z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: '#F0EDE8' }}>
              <div className="h-full rounded-full" style={{
                width: `${pct}%`,
                background: isComplete ? '#16a34a' : isNearGoal ? '#F0A500' : accent,
              }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold" style={{
                color: isComplete ? '#16a34a' : isNearGoal ? '#F0A500' : accent,
              }}>
                {isComplete ? '🎉 Cíl splněn!' : isNearGoal ? `🔥 ${pct}%` : `${pct}% vybráno`}
              </span>
              {finished && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#F0EDE8', color: '#5F5E5A' }}>Ukončena</span>
              )}
              {!finished && deadlineInfo && !deadlineInfo.urgent && (
                <span className="text-[10px]" style={{ color: deadlineInfo.color }}>📅 {deadlineInfo.label}</span>
              )}
            </div>
            {/* Donors */}
            {(f.darujme_donors_count ?? 0) > 0 && (
              <div className="text-[11px] mt-1" style={{ color: '#8B6550' }}>
                👥 {f.darujme_donors_count} dárců
              </div>
            )}
          </div>

          {!finished && (
            <div className="mt-3 py-2 rounded-lg font-bold text-xs text-white text-center"
              style={{ background: accent }}>
              {f.darujme_url ? 'Přispět na darujme.cz →' : 'Přispět →'}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

async function getFundraisers() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fundraisers')
    .select(`
      id, title, description, goal_amount, current_amount, active, deadline,
      image_url, darujme_project_id, darujme_url, darujme_donors_count, darujme_synced_at,
      institution:institutions(name, slug, type, logo_url, cover_url)
    `)
    .order('active',     { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}
