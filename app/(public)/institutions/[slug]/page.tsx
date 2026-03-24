import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AnimalCard } from '@/components/public/AnimalCard'
import { RescueCard } from '@/components/public/RescueCard'
import { FundraiserBar } from '@/components/public/FundraiserBar'
import { Button } from '@/components/ui/Button'
import type { Institution, Animal, RescueCase, Fundraiser } from '@/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const inst = await getInstitution(slug)
  if (!inst) return { title: 'Instituce nenalezena | Zozio' }
  return { title: `${inst.name} | Zozio`, description: inst.short_description ?? '' }
}

export default async function InstitutionProfilePage({ params }: PageProps) {
  const { slug } = await params
  const inst = await getInstitution(slug)
  if (!inst) notFound()

  const isShelter = inst.type === 'shelter'

  const [animals, rescueCases, fundraisers] = await Promise.all([
    isShelter ? getAnimals(inst.id) : Promise.resolve([]),
    !isShelter ? getRescueCases(inst.id) : Promise.resolve([]),
    getFundraisers(inst.id),
  ])

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray mb-6 font-semibold">
          <Link href="/" className="hover:text-coral transition-colors">Domů</Link>
          <span>·</span>
          <Link href="/institutions" className="hover:text-coral transition-colors">Instituce</Link>
          <span>·</span>
          <span className="text-espresso truncate">{inst.name}</span>
        </nav>

        {/* Hero */}
        <div className={`rounded-lg p-5 md:p-8 mb-8 md:mb-10 ${isShelter ? 'bg-shelter-bg' : 'bg-rescue-bg'}`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold mb-4
                ${isShelter ? 'bg-white text-shelter-dark' : 'bg-white text-rescue-dark'}`}>
                {isShelter ? '🏠 Útulok' : '🚑 Záchranná stanice'}
              </span>
              <h1 className="font-display font-extrabold text-3xl md:text-5xl text-espresso mb-2">{inst.name}</h1>
              <p className={`font-display font-bold text-base md:text-lg mb-4 ${isShelter ? 'text-coral' : 'text-rescue'}`}>
                {isShelter ? 'Zachraňme opuštěná zvířata' : 'Zachraňme ohrožená zvířata'}
              </p>
              {inst.description && (
                <p className="text-sm md:text-base text-brown-mid leading-relaxed max-w-[600px]">{inst.description}</p>
              )}
            </div>

            {/* Kontakt */}
            <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm w-full md:w-auto md:min-w-[240px]">
              <h3 className="font-display font-bold text-sm text-espresso mb-3 uppercase tracking-wider">Kontakt</h3>
              {inst.city && (
                <div className="flex items-center gap-2 text-sm text-brown-mid mb-2">
                  <span>📍</span>
                  <span>{inst.street ? `${inst.street}, ` : ''}{inst.city}</span>
                </div>
              )}
              {inst.phone && (
                <div className="flex items-center gap-2 text-sm text-brown-mid mb-2">
                  <span>📞</span>
                  <a href={`tel:${inst.phone}`} className="hover:text-coral transition-colors">{inst.phone}</a>
                </div>
              )}
              {inst.email && (
                <div className="flex items-center gap-2 text-sm text-brown-mid mb-2">
                  <span>✉️</span>
                  <a href={`mailto:${inst.email}`} className="hover:text-coral transition-colors truncate">{inst.email}</a>
                </div>
              )}
              {inst.website && (
                <div className="flex items-center gap-2 text-sm text-brown-mid">
                  <span>🌐</span>
                  <a href={inst.website} target="_blank" rel="noopener noreferrer" className="hover:text-coral transition-colors truncate">
                    {inst.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sbírky */}
        {fundraisers.length > 0 && (
          <section className="mb-10 md:mb-12">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-5">💛 Aktivní sbírky</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {fundraisers.map(f => (
                <FundraiserBar key={f.id} fundraiser={f} variant={isShelter ? 'shelter' : 'rescue'} />
              ))}
            </div>
          </section>
        )}

        {/* Zvířata */}
        {isShelter && animals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso">🐾 Zvířata k adopci</h2>
              <span className="text-sm text-gray font-semibold">{animals.length} zvířat</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {animals.map(animal => <AnimalCard key={animal.id} animal={animal} />)}
            </div>
          </section>
        )}

        {/* Záchranné případy */}
        {!isShelter && rescueCases.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso">🦉 Záchranné případy</h2>
              <span className="text-sm text-gray font-semibold">{rescueCases.length} případů</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {rescueCases.map(c => <RescueCard key={c.id} rescueCase={c} />)}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className={`mt-12 md:mt-16 rounded-lg p-6 md:p-8 text-center ${isShelter ? 'bg-coral' : 'bg-rescue'}`}>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mb-3">Jsi z tohoto útulku?</h2>
          <p className="text-white/80 mb-6 text-sm md:text-base">Přidej se k Zozio a spravuj profil, zvířata a adopce online.</p>
          <Link href="/auth/login">
            <Button variant="dark" size="lg">Přihlásit se</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

async function getInstitution(slug: string): Promise<Institution | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('institutions').select('*').eq('slug', slug).eq('approval_status','approved').single()
  return data as Institution | null
}

async function getAnimals(id: string): Promise<Animal[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('animals').select('*, institution:institutions(id,name,city,type,slug), species:animal_species(id,name_cs,icon)').eq('institution_id',id).eq('published',true).in('adoption_status',['available','reserved']).order('urgent',{ascending:false})
  return (data as Animal[]) ?? []
}

async function getRescueCases(id: string): Promise<RescueCase[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('rescue_cases').select('*, institution:institutions(id,name,city,type,slug), species:animal_species(id,name_cs,icon)').eq('institution_id',id).eq('published',true).not('status','eq','deceased')
  return (data as RescueCase[]) ?? []
}

async function getFundraisers(id: string): Promise<Fundraiser[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('fundraisers').select('*').eq('institution_id',id).eq('active',true)
  return data ?? []
}
