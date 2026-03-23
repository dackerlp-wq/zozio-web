'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const links = [
  { href: '/adopt',        label: 'Adopce' },
  { href: '/rescue',       label: 'Záchranné stanice' },
  { href: '/institutions', label: 'Útulky' },
  { href: '/fundraisers',  label: 'Sbírky' },
  { href: '/pricing',      label: 'Ceník' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-12 py-3.5
      flex items-center justify-between
      bg-warm/90 backdrop-blur-md
      border-b border-gray-pale/50">

      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <ZozLogo size="sm" />
        <span className="font-body text-xs font-semibold text-gray">zozio.cz</span>
      </Link>

      <ul className="flex gap-7 list-none m-0 p-0">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'font-body text-sm font-bold transition-colors no-underline',
                pathname === href ? 'text-coral' : 'text-brown-mid hover:text-coral'
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex gap-2.5 items-center">
        <Button variant="sand" size="sm">
          <Link href="/auth/login" className="no-underline text-inherit">Přihlásit</Link>
        </Button>
        <Button variant="primary" size="sm">
          <Link href="/auth/register" className="no-underline text-inherit">Registrovat instituci</Link>
        </Button>
      </div>
    </nav>
  )
}
