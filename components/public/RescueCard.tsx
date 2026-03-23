import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import type { RescueCase } from '@/types/database'

interface RescueCardProps {
  rescueCase: RescueCase
}

const statusLabel: Record<string, string> = {
  intake:         '🚑 Příjem',
  treatment:      '🩺 Léčba',
  rehabilitation: '💪 Rehabilitace',
  released:       '✓ Propuštěn',
  transferred:    '🚐 Přemístěn',
}

const statusVariant: Record<string, 'rescue' | 'available' | 'reserved'> = {
  intake:         'rescue',
  treatment:      'rescue',
  rehabilitation: 'reserved',
  released:       'available',
  transferred:    'reserved',
}

export function RescueCard({ rescueCase: c }: RescueCardProps) {
  const intakeDate = c.intake_date
    ? new Date(c.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border-t-[3px] border-rescue hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">

      {/* Obrázek */}
      <div className="relative h-48 bg-gradient-to-br from-rescue-bg to-rescue-light/40 flex items-center justify-center text-[80px]">
        {c.primary_photo ? (
          <Image
            src={c.primary_photo}
            alt={c.name ?? c.case_number ?? 'Záchranný případ'}
            fill
            className="object-cover"
          />
        ) : (
          <span>{c.species?.icon ?? '🐾'}</span>
        )}

        <Badge
          variant={statusVariant[c.status] ?? 'rescue'}
          className="absolute top-3 left-3"
        />

        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[10px] font-bold bg-rescue-bg text-rescue-dark">
          🚑 {c.institution?.name ?? 'Záchranná stanice'}
        </span>
      </div>

      {/* Tělo */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display font-extrabold text-xl text-espresso">
            {c.name ?? c.case_number ?? 'Neznámé zvíře'}
          </h3>
        </div>

        <p className="text-xs text-gray mb-3">
          {[
            c.species?.name_cs,
            c.estimated_age,
            c.institution?.city,
            intakeDate ? `od ${intakeDate}` : null,
          ].filter(Boolean).join(' · ')}
        </p>

        {/* Příčina zranění */}
        {c.cause_of_injury && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Tag label={c.cause_of_injury.slice(0, 40)} variant="rescue" />
          </div>
        )}

        {/* Krátký popis */}
        {c.public_description && (
          <p className="text-sm text-brown-mid leading-relaxed mb-4 line-clamp-2">
            {c.public_description}
          </p>
        )}

        <Link href={`/rescue/${c.id}`}>
          <Button variant="rescue" size="sm" className="w-full justify-center">
            {c.status === 'released' ? '🎉 Příběh záchrany' : '💛 Podpořit léčbu'}
          </Button>
        </Link>
      </div>
    </div>
  )
}
