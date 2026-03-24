'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-12 py-3.5
        flex items-center justify-between
        bg-warm/90 backdrop-blur-md
        border-b border-gray-pale/50">

        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <ZozLogo size="sm" />
          <span className="font-body text-xs font-semibold text-gray hidden sm:block">zozio.cz</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex gap-7 list-none m-0 p-0">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={cn(
                'font-body text-sm font-bold transition-colors no-underline',
                pathname === href ? 'text-coral' : 'text-brown-mid hover:text-coral'
              )}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden lg:flex gap-2.5 items-center">
          <Button variant="sand" size="sm">
            <Link href="/auth/login" className="no-underline text-inherit">Přihlásit</Link>
          </Button>
          <Button variant="primary" size="sm">
            <Link href="/auth/register" className="no-underline text-inherit">Registrovat instituci</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden flex flex-col gap-1.5 p-2 cursor-pointer bg-transparent border-none"
          aria-label="Menu"
        >
          <span className={cn('w-6 h-0.5 bg-espresso rounded transition-all', open && 'rotate-45 translate-y-2')} />
          <span className={cn('w-6 h-0.5 bg-espresso rounded transition-all', open && 'opacity-0')} />
          <span className={cn('w-6 h-0.5 bg-espresso rounded transition-all', open && '-rotate-45 -translate-y-2')} />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-40 bg-warm pt-16 px-6 pb-8 flex flex-col lg:hidden overflow-y-auto">
          <ul className="list-none space-y-1 mb-8 mt-4">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block py-3.5 px-4 rounded-md font-display font-bold text-xl no-underline transition-colors',
                    pathname === href
                      ? 'text-coral bg-coral-light'
                      : 'text-espresso hover:bg-sand'
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="space-y-3 mt-auto">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <Button variant="sand" className="w-full justify-center">Přihlásit se</Button>
            </Link>
            <Link href="/auth/register" onClick={() => setOpen(false)}>
              <Button variant="primary" className="w-full justify-center">Registrovat instituci</Button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
