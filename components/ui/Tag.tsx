import { cn } from '@/lib/utils'

type TagVariant = 'sand' | 'coral' | 'amber' | 'green'

const styles: Record<TagVariant, string> = {
  sand:  'bg-sand text-brown-mid',
  coral: 'bg-coral-light text-coral-dark',
  amber: 'bg-amber-light text-[#8B6000]',
  green: 'bg-success-bg text-success',
}

interface TagProps {
  label: string
  variant?: TagVariant
  className?: string
}

export function Tag({ label, variant = 'sand', className }: TagProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-3 py-1 rounded-pill font-body text-xs font-bold',
      styles[variant],
      className
    )}>
      {label}
    </span>
  )
}
