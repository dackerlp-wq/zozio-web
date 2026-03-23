import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import type { Institution } from '@/types/database'

export const metadata: Metadata = {
  title: 'Adresář útulků a záchranných stanic | Zozio',
  description: 'Najdi útulky a záchranné stanice ve svém okolí. Mapa institucí po celé ČR a SR.',
}

export default async function InstitutionsPage() {
  const { shelters, rescueStations } = await getInstitutions()

  return (
    <main className="min-h-screen bg-warm pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Hlavička */}
        <div className="text-center mb-12">
          <h1 className="font-display font-extrabold text-5xl text-espresso mb-3">
            Adresář institucí
          </h1>
          <p className="text-lg text-brown-mid max-w-[520px] mx-auto leading-relaxed">
            Útulky a záchranné stanice po celé České republice a Slovensku.
          </p>
        </div>

        {/* Útulky */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-extrabold text-3xl text-espresso">
                🏠 Útulky
              </h2>
              <p className="text-sm text-gray mt-1">
                Zachraňme opuštěná zvířata — {shelters.length} institucí
              </p>
            </div>
            <Link href="/adopt">
              <Button variant="primary" size="sm">Zvířata k adopci →</Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {shelters.map(inst => (
              <InstitutionCard key={inst.id} institution={inst} />
            ))}
          </div>
        </section>

        {/* Záchranné stanice */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-extrabold text-3xl text-espresso">
                🚑 Záchranné stanice
              </h2>
              <p className="text-sm text-gray mt-1">
                Zachraňme ohrožená zvířata — {rescueStations.length} institucí
              </p>
            </div>
            <Link href="/rescue">
              <Button variant="rescue" size="sm">Záchranné případy →</Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {rescueStations.map(inst => (
              <InstitutionCard key={inst.id} institution={inst} />
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}

function InstitutionCard({ institution: inst }: { institution: Institution }) {
  const isShelter = inst.type === 'shelter'

  return (
    <Link href={`/institutions/${inst.slug}`} className="no-underline">
      <div className={`bg-white rounded-lg p-6 shadow-sm border-2 border-transparent
        hover:border-${isShelter ? 'shelter' : 'rescue'}-bg hover:-translate-y-1 hover:shadow-md
        transition-all duration-300 h-full`}>

        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[10px] font-bold mb-3
          ${isShelter ? 'bg-shelter-bg text-shelter-dark' : 'bg-rescue-bg text-rescue-dark'}`}>
          {isShelter ? '🏠 Útulok' : '🚑 Záchranná stanice'}
        </div>

        <h3 className="font-display font-extrabold text-xl text-espresso mb-1">
          {inst.name}
        </h3>

        <p className="text-xs text-gray mb-3 font-semibold">
          📍 {inst.city}{inst.country !== 'CZ' ? `, ${inst.country}` : ''}
        </p>

        {inst.short_description && (
          <p className="text-sm text-brown-mid leading-relaxed line-clamp-2 mb-4">
            {inst.short_description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className={`text-xs font-bold ${isShelter ? 'text-coral' : 'text-rescue'}`}>
            Zobrazit profil →
          </span>
          {inst.email && (
            <span className="text-xs text-gray truncate max-w-[140px]">{inst.email}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

async function getInstitutions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('approval_status', 'approved')
    .order('name')

  if (error || !data) return { shelters: [], rescueStations: [] }

  const institutions = data as Institution[]
  return {
    shelters:       institutions.filter(i => i.type === 'shelter'),
    rescueStations: institutions.filter(i => i.type === 'rescue_station'),
  }
}
