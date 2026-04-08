import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { FavoriteButton } from '@/components/public/FavoriteButton'
import type { Animal } from '@/types/database'

interface AnimalCardProps {
  animal: Animal
}

export function AnimalCard({ animal }: AnimalCardProps) {
  const bgGradient = animal.urgent
    ? 'from-coral-light to-sand'
    : 'from-sand to-amber-light'

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">

      {/* Obrázek */}
      <div className={`relative h-48 bg-gradient-to-br ${bgGradient} flex items-center justify-center text-[80px]`}>
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
          <Badge variant="urgent" className="absolute top-3 left-3" />
        )}

        <div className="absolute top-3 right-3">
          <FavoriteButton type="animal" id={animal.id} size="sm" />
        </div>

        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[10px] font-bold bg-shelter-bg text-shelter-dark">
          🏠 {animal.institution?.name ?? 'Útulek'}
        </span>
      </div>

      {/* Tělo */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display font-extrabold text-xl text-espresso">
            {animal.name}
          </h3>
          {!animal.urgent && <Badge variant="available" />}
        </div>

        <p className="text-xs text-gray mb-3">
          {[
            animal.species?.name_cs,
            animal.sex === 'male' ? 'Pes' : animal.sex === 'female' ? 'Fena' : null,
            animal.birth_year ? `${new Date().getFullYear() - animal.birth_year} let` : null,
            animal.size === 'small' ? 'Malý' : animal.size === 'medium' ? 'Střední' : animal.size === 'large' ? 'Velký' : null,
            animal.institution?.city,
          ].filter(Boolean).join(' · ')}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {animal.neutered    && <Tag label="Kastrovaný" variant="green" />}
          {animal.vaccinated  && <Tag label="Očkovaný"   variant="green" />}
          {animal.microchipped && <Tag label="Čipovaný"  variant="sand" />}
          {animal.good_with_kids && <Tag label="Miluje děti" variant="coral" />}
          {animal.good_with_dogs && <Tag label="Vychází se psy" variant="sand" />}
          {animal.good_with_cats && <Tag label="Vychází s kočkami" variant="sand" />}
        </div>

        <Link href={`/animals/${animal.id}`}>
          <Button variant="primary" size="sm" className="w-full justify-center">
            Adoptovat {animal.name}
          </Button>
        </Link>
      </div>
    </div>
  )
}
