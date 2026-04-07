import {
  ADOPTION_STATUS_LABEL, ADOPTION_STATUS_BADGE, ADOPTION_STATUS_ICON,
  RESCUE_STATUS_LABEL, RESCUE_STATUS_BADGE, RESCUE_STATUS_ICON,
  HEALTH_STATUS_LABEL, HEALTH_STATUS_BADGE,
} from '@/lib/animal-labels'

interface BadgeProps {
  variant:
    | 'available' | 'reserved' | 'adopted' | 'foster' | 'not_for_adoption'
    | 'intake' | 'treatment' | 'rehabilitation' | 'released' | 'transferred' | 'deceased'
    | 'healthy' | 'sick' | 'injured' | 'recovering' | 'chronic'
    | 'urgent'
    | 'rescue'
  className?: string
  size?: 'sm' | 'md'
}

export function Badge({ variant, className = '', size = 'md' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'

  if (variant === 'urgent') {
    return (
      <span className={`inline-flex items-center gap-1 font-body font-bold rounded-pill bg-coral text-white ${sizeClass} ${className}`}>
        🆘 Volám ZOZ
      </span>
    )
  }

  if (variant === 'rescue') {
    return (
      <span className={`inline-flex items-center gap-1 font-body font-bold rounded-pill bg-rescue-bg text-rescue-dark ${sizeClass} ${className}`}>
        🚑 Záchrana
      </span>
    )
  }

  // Stav adopce
  if (variant in ADOPTION_STATUS_LABEL) {
    return (
      <span className={`inline-flex items-center gap-1 font-body font-bold rounded-pill ${ADOPTION_STATUS_BADGE[variant] ?? 'bg-gray-pale text-gray'} ${sizeClass} ${className}`}>
        {ADOPTION_STATUS_ICON[variant]} {ADOPTION_STATUS_LABEL[variant]}
      </span>
    )
  }

  // Stav záchranného případu
  if (variant in RESCUE_STATUS_LABEL) {
    return (
      <span className={`inline-flex items-center gap-1 font-body font-bold rounded-pill ${RESCUE_STATUS_BADGE[variant] ?? 'bg-gray-pale text-gray'} ${sizeClass} ${className}`}>
        {RESCUE_STATUS_ICON[variant]} {RESCUE_STATUS_LABEL[variant]}
      </span>
    )
  }

  // Zdravotní stav
  if (variant in HEALTH_STATUS_LABEL) {
    return (
      <span className={`inline-flex items-center gap-1 font-body font-bold rounded-pill ${HEALTH_STATUS_BADGE[variant] ?? 'bg-gray-pale text-gray'} ${sizeClass} ${className}`}>
        {HEALTH_STATUS_LABEL[variant]}
      </span>
    )
  }

  return null
}
