import { cn } from '@/lib/utils'

type LogoSize = 'xs' | 'sm' | 'md' | 'lg'
type LogoVariant = 'default' | 'inverted'

const sizes: Record<LogoSize, string> = {
  xs: 'text-xl',
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
}

const colorZ: Record<LogoVariant, string> = {
  default:  'text-coral',
  inverted: 'text-white',
}

interface ZozLogoProps {
  size?: LogoSize
  variant?: LogoVariant
  className?: string
}

export function ZozLogo({ size = 'md', variant = 'default', className }: ZozLogoProps) {
  return (
    <span className={cn(
      'font-display font-extrabold tracking-tight leading-none',
      sizes[size],
      className
    )}>
      <span className={colorZ[variant]}>Z</span>
      <span className="text-amber">O</span>
      <span className={colorZ[variant]}>Z</span>
    </span>
  )
}
