import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Útulky a záchranné stanice | Zozio',
  description: 'Adresář útulků a záchranných stanic v ČR a SR. Najdi instituci ve svém okolí.',
}

interface PageProps {
  searchParams: Promise<{ type?: string; city?: string; q?: string }>
}

export default async function InstitutionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const type   = params.type ?? 'all'

  const [institutions, cities] = await Promise.all([
    getInstitutions(params),
    getCities(),
  ])

  const shelters  = institutions.filter((i: any) => i.type === 'shelter')
  const rescues   = institutions.filter((i: any) => i.type === 'rescue_station')

  const tabs = [
    { id: 'all',            label: 'Všechny',            count: institutions.length },
    { id: 'shelter',        label: 'Útulky',             count: shelters.length },
    { id: 'rescue_station', label: 'Záchranné stanice',  count: rescues.length },
  ]

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8634A' }}>Adresář</p>
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-3"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Útulky a záchranné stanice
          </h1>

          {/* Search */}
          <form method="GET" action="/institutions" className="flex gap-2 max-w-[480px]">
            <input type="hidden" name="type" value={type !== 'all' ? type : ''} />
            <input
              type="search" name="q"
              defaultValue={params.q ?? ''}
              placeholder="Hledat název, město..."
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E0DDD8', background: 'white', color: '#1A0F0A' }}
            />
            <button type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90"
              style={{ background: '#E8634A' }}>
              Hledat
            </button>
            {params.q && (
              <Link href={`/institutions${type !== 'all' ? `?type=${type}` : ''}`}
                className="px-3 py-2.5 rounded-xl font-bold text-sm border no-underline hover:opacity-80"
                style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}>
                ✕
              </Link>
            )}
          </form>
        </div>

        {/* Taby */}
        <div className="flex gap-0 border-b border-[#F0EDE8] mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <Link key={tab.id}
              href={`/institutions?type=${tab.id}${params.q ? `&q=${params.q}` : ''}${params.city ? `&city=${params.city}` : ''}`}
              className="no-underline flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all"
              style={type === tab.id
                ? { color: '#E8634A', borderBottomColor: '#E8634A' }
                : { color: '#8B6550', borderBottomColor: 'transparent' }
              }>
              {tab.label}
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                style={type === tab.id
                  ? { background: '#E8634A', color: 'white' }
                  : { background: '#F0EDE8', color: '#8B6550' }
                }>
                {tab.count}
              </span>
            </Link>
          ))}
        </div>

        {/* Filtry měst */}
        {cities.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <Link href={`/institutions?type=${type}${params.q ? `&q=${params.q}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold no-underline border transition-all
                ${!params.city ? 'border-[#E8634A] text-[#993C1D] bg-[#FAECE7]' : 'border-[#F0EDE8] text-[#6B4030] bg-white hover:border-[#E8634A]/40'}`}>
              Celá ČR/SR
            </Link>
            {cities.map(city => (
              <Link key={city}
                href={`/institutions?type=${type}&city=${city}${params.q ? `&q=${params.q}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold no-underline border transition-all
                  ${params.city === city ? 'border-[#E8634A] text-[#993C1D] bg-[#FAECE7]' : 'border-[#F0EDE8] text-[#6B4030] bg-white hover:border-[#E8634A]/40'}`}>
                {city}
              </Link>
            ))}
          </div>
        )}

        {/* Výsledky */}
        {institutions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <p className="font-bold text-xl text-[#1A0F0A] mb-2">Žádné instituce nenalezeny</p>
            <p className="text-sm mb-6" style={{ color: '#8B6550' }}>Zkus jiné hledání nebo filtr.</p>
            <Link href="/institutions" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline"
              style={{ background: '#E8634A' }}>
              Zobrazit vše
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutions.map((inst: any) => (
              <InstitutionCard key={inst.id} inst={inst} />
            ))}
          </div>
        )}

        {/* CTA pro nové instituce */}
        <div className="mt-14 p-6 rounded-2xl text-center border border-dashed border-[#E0DDD8]"
          style={{ background: '#FAFAF8' }}>
          <p className="font-bold text-[#1A0F0A] mb-1">Chybí zde vaše instituce?</p>
          <p className="text-sm mb-4" style={{ color: '#8B6550' }}>
            Registrace je zdarma a trvá 5 minut.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register?type=shelter">
              <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 transition-all"
                style={{ background: '#E8634A' }}>
                Registrovat útulek →
              </button>
            </Link>
            <Link href="/auth/register?type=rescue_station">
              <button className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border hover:opacity-80 transition-all"
                style={{ background: 'white', color: '#1A0F0A', borderColor: '#E0DDD8' }}>
                Záchrannou stanici →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Karta instituce ── */
function InstitutionCard({ inst }: { inst: any }) {
  const isShelter = inst.type === 'shelter'
  const accent    = isShelter ? '#E8634A' : '#2E9E8F'
  const accentBg  = isShelter ? '#FAECE7' : '#E1F5EE'
  const accentText = isShelter ? '#993C1D' : '#0F6E56'

  return (
    <Link href={`/institutions/${inst.slug}`} className="no-underline group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:-translate-y-1 transition-all duration-200 h-full flex flex-col"
        style={{ borderTop: `3px solid ${accent}` }}>

        {/* Cover / logo oblast */}
        <div className="relative h-28 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accentBg}, white)` }}>
          {inst.cover_url ? (
            <Image src={inst.cover_url} alt={inst.name} fill className="object-cover opacity-50" />
          ) : null}
          {/* Logo */}
          <div className="relative z-10 w-16 h-16 rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-2xl overflow-hidden"
            style={{ background: accentBg }}>
            {inst.logo_url
              ? <Image src={inst.logo_url} alt={inst.name} width={64} height={64} className="object-cover" />
              : <span>{isShelter ? '🏠' : '🚑'}</span>
            }
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          {/* Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: accentBg, color: accentText }}>
              {isShelter ? '🏠 Útulek' : '🚑 Záchranná stanice'}
            </span>
            {inst.approval_status === 'approved' && (
              <span className="text-[10px] font-bold" style={{ color: '#3B6D11' }}>✓ Ověřeno</span>
            )}
          </div>

          <div className="font-bold text-[#1A0F0A] leading-tight mb-1 group-hover:opacity-80 transition-opacity">
            {inst.name}
          </div>
          <div className="text-xs mb-3" style={{ color: '#8B6550' }}>
            📍 {inst.city}{inst.street ? `, ${inst.street}` : ''}
          </div>

          {/* Statistiky */}
          <div className="flex gap-4 mt-auto pt-3 border-t border-[#F0EDE8]">
            {isShelter ? (
              <Stat num={inst.animals_count ?? 0} label="zvířat" />
            ) : (
              <Stat num={inst.rescue_count ?? 0} label="případů" />
            )}
            <Stat num={inst.active_fundraisers ?? 0} label="sbírek" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <div>
      <div className="font-bold text-base text-[#1A0F0A]">{num}</div>
      <div className="text-[10px]" style={{ color: '#8B6550' }}>{label}</div>
    </div>
  )
}

/* ── Data ── */
async function getInstitutions(params: { type?: string; city?: string; q?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('institutions')
    .select(`
      id, name, slug, type, city, street, logo_url, cover_url, approval_status,
      animals_count:animals(count),
      rescue_count:rescue_cases(count),
      active_fundraisers:fundraisers(count)
    `)
    .eq('approval_status', 'approved')
    .order('name', { ascending: true })

  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type)
  }
  if (params.city) {
    query = query.eq('city', params.city)
  }
  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,city.ilike.%${params.q}%`)
  }

  const { data } = await query

  // Přepočítej počty z nested response
  return (data ?? []).map((inst: any) => ({
    ...inst,
    animals_count:      inst.animals_count?.[0]?.count ?? 0,
    rescue_count:       inst.rescue_count?.[0]?.count ?? 0,
    active_fundraisers: inst.active_fundraisers?.[0]?.count ?? 0,
  }))
}

async function getCities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('institutions')
    .select('city')
    .eq('approval_status', 'approved')
  return [...new Set((data ?? []).map((d: any) => d.city).filter(Boolean))].sort() as string[]
}
