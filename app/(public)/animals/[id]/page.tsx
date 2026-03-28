import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { AdoptionForm } from '@/components/public/AdoptionForm'
import { PhotoGallery } from '@/components/public/PhotoGallery'
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
    description: animal.description?.slice(0, 155) ?? `Adoptuj ${animal.name}.`,
    openGraph: {
      title:       `${animal.name} hledá domov | Zozio`,
      description: animal.description?.slice(0, 155) ?? '',
      images:      animal.primary_photo ? [{ url: animal.primary_photo }] : [],
    },
  }
}

export default async function AnimalDetailPage({ params }: PageProps) {
  const { id } = await params
  const animal = await getAnimal(id)
  if (!animal) notFound()

  const institution = animal.institution as any
  const species     = animal.species as any

  // Načti propojený článek
  const linkedArticle = await getLinkedArticle(id)

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6">

        <nav className="flex items-center gap-2 text-sm text-gray mb-6 font-semibold">
          <Link href="/" className="hover:text-coral transition-colors">Domů</Link>
          <span>·</span>
          <Link href="/adopt" className="hover:text-coral transition-colors">Adopce</Link>
          <span>·</span>
          <span className="text-espresso">{animal.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">

          {/* Galerie */}
          <div>
            <PhotoGallery
              photos={animal.photos ?? []}
              primaryPhoto={animal.primary_photo}
              animalName={animal.name}
              icon={species?.icon}
            />
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="font-display font-extrabold text-4xl md:text-5xl text-espresso">
                {animal.name}
              </h1>
              <Badge variant={animal.adoption_status === 'available' ? 'available' : 'reserved'} />
            </div>

            <p className="text-sm text-gray mb-5 font-semibold">
              {[
                species?.name_cs,
                animal.breed,
                animal.birth_year ? `${new Date().getFullYear() - animal.birth_year} let` : null,
                animal.sex === 'male' ? '♂ Samec' : animal.sex === 'female' ? '♀ Samice' : null,
                animal.size === 'small' ? 'Malý' : animal.size === 'medium' ? 'Střední' : animal.size === 'large' ? 'Velký' : null,
              ].filter(Boolean).join(' · ')}
            </p>

            {animal.description && (
              <p className="text-sm md:text-base text-brown-mid leading-relaxed mb-5">
                {animal.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-5">
              {animal.vaccinated     && <Tag label="✓ Očkovaný"          variant="green" />}
              {animal.neutered       && <Tag label="✓ Kastrovaný"        variant="green" />}
              {animal.microchipped   && <Tag label="✓ Čipovaný"          variant="green" />}
              {animal.good_with_kids && <Tag label="🧒 Miluje děti"      variant="coral" />}
              {animal.good_with_dogs && <Tag label="🐕 Vychází se psy"   variant="sand"  />}
              {animal.good_with_cats && <Tag label="🐈 Vychází s kočkami" variant="sand"  />}
              {animal.special_needs  && <Tag label={`⚠️ ${animal.special_needs}`} variant="amber" />}
            </div>

            {animal.adoption_fee > 0 && (
              <div className="bg-sand rounded-md px-4 py-3 mb-5 inline-flex items-center gap-2">
                <span className="text-sm font-bold text-brown">Adopční poplatek:</span>
                <span className="font-display font-extrabold text-lg text-coral">{animal.adoption_fee} Kč</span>
              </div>
            )}

            {institution && (
              <div className="bg-shelter-bg rounded-md px-4 py-3 mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-display font-bold text-sm text-shelter-dark">🏠 {institution.name}</div>
                  <div className="text-xs text-gray mt-0.5">📍 {institution.city}</div>
                </div>
                <Link href={`/institutions/${institution.slug}`}>
                  <Button variant="ghost" size="sm">Profil útulku</Button>
                </Link>
              </div>
            )}

            {/* Propojený článek */}
            {linkedArticle && (
              <div className="bg-coral-light rounded-lg p-4 mb-5 flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">📖</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-coral-dark uppercase tracking-wider mb-1">
                    Příběh {animal.name}
                  </div>
                  <div className="font-display font-bold text-sm text-espresso leading-tight mb-2">
                    {linkedArticle.title}
                  </div>
                  {linkedArticle.perex && (
                    <p className="text-xs text-brown-mid line-clamp-2 mb-2">{linkedArticle.perex}</p>
                  )}
                  <Link href={`/articles/${linkedArticle.slug}`}>
                    <span className="text-xs font-bold text-coral hover:text-coral-dark transition-colors">
                      Přečíst celý příběh →
                    </span>
                  </Link>
                </div>
              </div>
            )}

            {animal.adoption_status === 'available' && (
              <div className="bg-white rounded-lg border border-gray-pale p-5 md:p-6">
                <h2 className="font-display font-extrabold text-xl md:text-2xl text-espresso mb-1">
                  Chci adoptovat {animal.name}
                </h2>
                <p className="text-sm text-gray mb-5">Vyplň žádost a útulok tě bude kontaktovat.</p>
                <AdoptionForm animalId={animal.id} animalName={animal.name} institutionId={animal.institution_id} />
              </div>
            )}

            {animal.adoption_status === 'reserved' && (
              <div className="bg-amber-light rounded-lg p-5 text-center">
                <div className="text-3xl mb-2">⏳</div>
                <p className="font-display font-bold text-lg text-espresso">{animal.name} je momentálně rezervovaný</p>
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
  const { data } = await supabase
    .from('animals')
    .select('*, institution:institutions(id,name,city,type,slug,email,phone), species:animal_species(id,name_cs,icon)')
    .eq('id', id)
    .eq('published', true)
    .single()
  return data as Animal | null
}

async function getLinkedArticle(animalId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, perex')
    .eq('animal_id', animalId)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}
