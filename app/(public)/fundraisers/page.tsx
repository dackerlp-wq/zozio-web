import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { InstitutionType } from '@/types/database'

/* ── Query-specific types ── */
interface FundraiserListItem {
  id: string
  title: string
  description: string | null
  goal_amount: number
  current_amount: number
  active: boolean
  image_url: string | null
  institution: { name: string; slug: string; type: InstitutionType } | null
}

export const metadata: Metadata = {
  title: 'Sbírky | Zozio',
  description: 'Podpořte záchranné stanice a útulky. Přispějte konkrétnímu zvířeti nebo instituci.',
}

export default async function FundraisersPage() {
  const fundraisers = await getFundraisers()

  const active   = fundraisers.filter((f) => f.active)
  const finished = fundraisers.filter((f) => !f.active)

  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-16">

        {/* Header */}
        <div className="py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-amber">Sbírky</p>
          <h1 className="font-display font-extrabold text-text-primary mb-1" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Přispěj konkrétnímu zvířeti
          </h1>
          <p className="text-sm text-text-muted">
            {active.length} aktivních sbírek · {finished.length} ukončených
          </p>
        </div>

        {/* Aktivní sbírky */}
        {active.length > 0 && (
          <section className="mb-12">
            <h2 className="font-bold text-lg text-text-primary mb-5 pb-3 border-b border-border">
              Aktivní sbírky
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.map((f) => <FundraiserCard key={f.id} f={f} />)}
            </div>
          </section>
        )}

        {/* Ukončené */}
        {finished.length > 0 && (
          <section>
            <h2 className="font-bold text-lg text-text-primary mb-5 pb-3 border-b border-border">
              Ukončené sbírky
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {finished.map((f) => <FundraiserCard key={f.id} f={f} finished />)}
            </div>
          </section>
        )}

        {fundraisers.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💛</div>
            <p className="font-bold text-xl text-text-primary mb-2">Zatím žádné sbírky</p>
            <p className="text-sm text-text-muted">Brzy tu budou sbírky od útulků a záchranných stanic.</p>
          </div>
        )}
      </div>
    </main>
  )
}

function FundraiserCard({ f, finished = false }: { f: FundraiserListItem; finished?: boolean }) {
  const institution = f.institution
  const isShelter   = institution?.type === 'shelter'
  const pct         = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
  const accent      = isShelter ? 'var(--coral)' : 'var(--rescue)'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${finished ? 'opacity-70' : 'hover:-translate-y-1 transition-all'}`}
      style={{ borderColor: finished ? 'var(--border)' : 'rgba(232,99,74,0.15)' }}>

      {/* Cover image */}
      <div className="relative h-[180px] w-full">
        {f.image_url ? (
          <Image
            src={f.image_url}
            alt={f.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 15%, var(--warm)), color-mix(in srgb, ${accent} 30%, var(--warm)))` }}
          >
            {isShelter ? '🐾' : '💰'}
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Hlavička */}
        <div className="mb-4">
          <div className="font-bold text-text-primary leading-tight mb-1">{f.title}</div>
          {institution && (
            <Link href={`/institutions/${institution.slug}`}
              className="text-xs no-underline hover:opacity-70 font-medium"
              style={{ color: accent }}>
              {institution.name}
            </Link>
          )}
        </div>

        {/* Popis */}
        {f.description && (
          <p className="text-sm line-clamp-2 mb-4 leading-relaxed text-text-muted">
            {f.description}
          </p>
        )}

        {/* Progress */}
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-bold text-text-primary">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
          <span className="text-text-muted">z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-2 bg-border">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accent }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold" style={{ color: accent }}>{pct}% vybráno</span>
          {finished && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-border text-text-neutral">Ukončena</span>}
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
    .select('id, title, description, goal_amount, current_amount, active, image_url, institution:institutions(name, slug, type)')
    .order('active', { ascending: false })
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as FundraiserListItem[]
}
