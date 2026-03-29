import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sbírky | Zozio',
  description: 'Podpořte záchranné stanice a útulky. Přispějte konkrétnímu zvířeti nebo instituci.',
}

export default async function FundraisersPage() {
  const fundraisers = await getFundraisers()

  const active   = fundraisers.filter((f: any) => f.active)
  const finished = fundraisers.filter((f: any) => !f.active)

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#F0A500' }}>Sbírky</p>
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-1" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Přispěj konkrétnímu zvířeti
          </h1>
          <p className="text-sm" style={{ color: '#8B6550' }}>
            {active.length} aktivních sbírek · {finished.length} ukončených
          </p>
        </div>

        {/* Aktivní sbírky */}
        {active.length > 0 && (
          <section className="mb-12">
            <h2 className="font-bold text-lg text-[#1A0F0A] mb-5 pb-3 border-b border-[#F0EDE8]">
              Aktivní sbírky
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {finished.map((f: any) => <FundraiserCard key={f.id} f={f} finished />)}
            </div>
          </section>
        )}

        {fundraisers.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💛</div>
            <p className="font-bold text-xl text-[#1A0F0A] mb-2">Zatím žádné sbírky</p>
            <p className="text-sm" style={{ color: '#8B6550' }}>Brzy tu budou sbírky od útulků a záchranných stanic.</p>
          </div>
        )}
      </div>
    </main>
  )
}

function FundraiserCard({ f, finished = false }: { f: any; finished?: boolean }) {
  const institution = f.institution as any
  const isShelter   = institution?.type === 'shelter'
  const pct         = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
  const accent      = isShelter ? '#E8634A' : '#2E9E8F'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${finished ? 'opacity-70' : 'hover:-translate-y-1 transition-all'}`}
      style={{ borderColor: finished ? '#F0EDE8' : 'rgba(232,99,74,0.15)' }}>

      <div className="p-5">
        {/* Hlavička */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[#1A0F0A] leading-tight mb-1">{f.title}</div>
            {institution && (
              <Link href={`/institutions/${institution.slug}`}
                className="text-xs no-underline hover:opacity-70 font-medium"
                style={{ color: accent }}>
                {institution.name}
              </Link>
            )}
          </div>
          <span className="text-2xl flex-shrink-0">{isShelter ? '🐾' : '🦉'}</span>
        </div>

        {/* Popis */}
        {f.description && (
          <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: '#8B6550' }}>
            {f.description}
          </p>
        )}

        {/* Progress */}
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-bold text-[#1A0F0A]">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
          <span style={{ color: '#8B6550' }}>z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#F0EDE8' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accent }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold" style={{ color: accent }}>{pct}% vybráno</span>
          {finished && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#5F5E5A' }}>Ukončena</span>}
        </div>

        {/* CTA */}
        {!finished && (
          <button className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none hover:opacity-90 transition-all"
            style={{ background: accent }}>
            Přispět →
          </button>
        )}
      </div>
    </div>
  )
}

async function getFundraisers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('id, title, description, goal_amount, current_amount, active, institution:institutions(name, slug, type)')
    .order('active', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}
