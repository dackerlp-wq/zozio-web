import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'rescue' | 'amber' | 'ghost' | 'ghost-rescue' | 'dark' | 'sand'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:        'bg-coral text-white shadow-[0_4px_18px_rgba(232,99,74,.32)] hover:bg-coral-dark',
  rescue:         'bg-rescue text-white shadow-[0_4px_18px_rgba(46,158,143,.28)] hover:bg-rescue-dark',
  amber:          'bg-amber text-espresso hover:brightness-95',
  ghost:          'bg-transparent text-coral border-2 border-coral hover:bg-coral-light',
  'ghost-rescue': 'bg-transparent text-rescue border-2 border-rescue hover:bg-rescue-bg',
  dark:           'bg-espresso text-white hover:bg-brown',
  sand:           'bg-sand text-brown hover:bg-gray-pale',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-[18px] py-[9px] text-sm',
  md: 'px-[26px] py-[13px] text-base',
  lg: 'px-10 py-[17px] text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill font-display font-bold',
        'transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
