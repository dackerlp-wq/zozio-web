import { cn } from '@/lib/utils'

type BadgeVariant = 'available' | 'reserved' | 'adopted' | 'urgent' | 'rescue' | 'released'

const styles: Record<BadgeVariant, string> = {
  available: 'bg-success-bg text-success',
  reserved:  'bg-amber-light text-warning',
  adopted:   'bg-gray-pale text-gray',
  urgent:    'bg-coral text-white',
  rescue:    'bg-rescue-bg text-rescue-dark',
  released:  'bg-success-bg text-success',
}

const labels: Record<BadgeVariant, string> = {
  available: '✓ K adopci',
  reserved:  '⏳ Rezervováno',
  adopted:   'Adoptováno',
  urgent:    '🆘 Urgentní',
  rescue:    '🚑 V léčbě',
  released:  '✓ Propuštěn',
}

interface BadgeProps {
  variant: BadgeVariant
  className?: string
}

export function Badge({ variant, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-pill font-body text-xs font-bold',
      styles[variant],
      className
    )}>
      {labels[variant]}
    </span>
  )
}
