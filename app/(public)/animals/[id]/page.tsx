import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { AdoptionForm } from '@/components/public/AdoptionForm'
import type { Animal } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const animal = await getAnimal(id)
  if (!animal) return { title: 'Zvíře nenalezeno | Zozio' }
  return {
    title: `${animal.name} — Adopce | Zozio`,
    description: animal.description?.slice(0, 155) ?? `Adoptuj ${animal.name} z útulku ${animal.institution?.name}.`,
    openGraph: {
      images: animal.primary_photo ? [animal.primary_photo] : ['/og-default.jpg'],
    },
  }
}

export default async function AnimalDetailPage({ params }: PageProps) {
  const { id } = await params
  const animal = await getAnimal(id)
  if (!animal) notFound()

  return (
    <main className="min-h-screen bg-warm pt-24 pb-20">
      <div className="max-w-[1100px] mx-auto px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray mb-8 font-semibold">
          <Link href="/" className="hover:text-coral transition-colors">Domů</Link>
          <span>·</span>
          <Link href="/adopt" className="hover:text-coral transition-colors">Adopce</Link>
          <span>·</span>
          <span className="text-espresso">{animal.name}</span>
        </nav>

        <div className="grid grid-cols-2 gap-12 items-start">

          {/* Levá strana — fotky */}
          <div>
            <div className="relative w-full h-[420px] rounded-lg overflow-hidden bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-[120px] mb-4">
              {animal.primary_photo ? (
                <Image
                  src={animal.primary_photo}
                  alt={animal.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span>{animal.species?.icon ?? '🐾'}</span>
              )}
              {animal.urgent && (
                <Badge variant="urgent" className="absolute top-4 left-4" />
              )}
            </div>

            {/* Galerie */}
            {animal.photos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {animal.photos.slice(0, 5).map((photo, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden bg-sand">
                    <Image src={photo} alt={`${animal.name} ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pravá strana — info */}
          <div>
            {/* Hlavička */}
            <div className="flex items-start justify-between mb-2">
              <h1 className="font-display font-extrabold text-5xl text-espresso">
                {animal.name}
              </h1>
              <Badge variant={animal.adoption_status === 'available' ? 'available' : 'reserved'} />
            </div>

            <p className="text-sm text-gray mb-5 font-semibold">
              {[
                animal.species?.name_cs,
                animal.breed,
                animal.birth_year ? `${new Date().getFullYear() - animal.birth_year} let` : null,
                animal.sex === 'male' ? '♂ Samec' : animal.sex === 'female' ? '♀ Samice' : null,
                animal.size === 'small' ? 'Malý' : animal.size === 'medium' ? 'Střední' : animal.size === 'large' ? 'Velký' : null,
                animal.weight_kg ? `${animal.weight_kg} kg` : null,
              ].filter(Boolean).join(' · ')}
            </p>

            {/* Popis */}
            {animal.description && (
              <p className="text-base text-brown-mid leading-relaxed mb-6">
                {animal.description}
              </p>
            )}

            {/* Zdraví */}
            <div className="flex flex-wrap gap-2 mb-6">
              {animal.vaccinated   && <Tag label="✓ Očkovaný"    variant="green" />}
              {animal.neutered     && <Tag label="✓ Kastrovaný"  variant="green" />}
              {animal.microchipped && <Tag label="✓ Čipovaný"    variant="green" />}
              {animal.good_with_kids && <Tag label="🧒 Miluje děti"      variant="coral" />}
              {animal.good_with_dogs && <Tag label="🐕 Vychází se psy"   variant="sand" />}
              {animal.good_with_cats && <Tag label="🐈 Vychází s kočkami" variant="sand" />}
              {animal.special_needs && <Tag label={`⚠️ ${animal.special_needs}`} variant="amber" />}
            </div>

            {/* Adopční poplatek */}
            {animal.adoption_fee > 0 && (
              <div className="bg-sand rounded-md px-4 py-3 mb-6 inline-flex items-center gap-2">
                <span className="text-sm font-bold text-brown">Adopční poplatek:</span>
                <span className="font-display font-extrabold text-lg text-coral">{animal.adoption_fee} Kč</span>
              </div>
            )}

            {/* Útulok info */}
            {animal.institution && (
              <div className="bg-shelter-bg rounded-md px-4 py-3 mb-6 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-sm text-shelter-dark">
                    🏠 {animal.institution.name}
                  </div>
                  <div className="text-xs text-gray mt-0.5">
                    📍 {animal.institution.city}
                  </div>
                </div>
                <Link href={`/institutions/${animal.institution.slug}`}>
                  <Button variant="ghost" size="sm">Profil útulku</Button>
                </Link>
              </div>
            )}

            {/* CTA */}
            {animal.adoption_status === 'available' && (
              <div className="bg-white rounded-lg border border-gray-pale p-6">
                <h2 className="font-display font-extrabold text-2xl text-espresso mb-1">
                  Chci adoptovat {animal.name}
                </h2>
                <p className="text-sm text-gray mb-5">
                  Vyplň žádost o adopci a útulok tě bude kontaktovat.
                </p>
                <AdoptionForm animalId={animal.id} animalName={animal.name} institutionId={animal.institution_id} />
              </div>
            )}

            {animal.adoption_status === 'reserved' && (
              <div className="bg-amber-light rounded-lg p-5 text-center">
                <div className="text-3xl mb-2">⏳</div>
                <p className="font-display font-bold text-lg text-espresso">
                  {animal.name} je momentálně rezervovaný
                </p>
                <p className="text-sm text-gray mt-1">
                  Podívej se na další zvířata čekající na domov.
                </p>
                <Link href="/adopt" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">Zobrazit další zvířata</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

async function getAnimal(id: string): Promise<Animal | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('animals')
    .select(`
      *,
      institution:institutions(id, name, city, type, slug, email, phone),
      species:animal_species(id, name_cs, icon)
    `)
    .eq('id', id)
    .eq('published', true)
    .single()

  if (error || !data) return null
  return data as Animal
}
