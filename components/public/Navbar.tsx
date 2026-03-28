'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const mainLinks = [
  {
    href: '/adopt',
    label: '🐾 Zvířata k adopci',
    desc: 'Psi, kočky a další hledají domov',
  },
  {
    href: '/rescue',
    label: '🦉 Záchranné stanice',
    desc: 'Volně žijící zvířata v léčbě',
  },
  {
    href: '/institutions',
    label: '🏠 Útulky a stanice',
    desc: 'Adresář všech institucí v ČR/SR',
  },
  {
    href: '/fundraisers',
    label: '💛 Sbírky',
    desc: 'Přispěj konkrétnímu zvířeti',
  },
  {
    href: '/articles',
    label: '📖 Příběhy',
    desc: 'Úspěšné adopce a záchranné příběhy',
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-warm/92 backdrop-blur-md border-b border-gray-pale/50">
        <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <ZozLogo size="sm" />
            <span className="font-body text-xs font-semibold text-gray hidden sm:block">zozio.cz</span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1 list-none m-0 p-0 flex-1 justify-center">
            {mainLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'inline-flex items-center px-3 py-2 rounded-md font-body text-sm font-bold transition-colors no-underline whitespace-nowrap',
                    isActive(href)
                      ? 'bg-coral-light text-coral-dark'
                      : 'text-brown-mid hover:bg-sand hover:text-espresso'
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <Link href="/auth/login">
              <Button variant="sand" size="sm">Přihlásit</Button>
            </Link>
            <Link href="/pro-instituce">
              <Button variant="primary" size="sm">Pro útulky</Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden flex flex-col gap-1.5 p-2 cursor-pointer bg-transparent border-none"
            aria-label="Menu"
          >
            <span className={cn('w-6 h-0.5 bg-espresso rounded transition-all duration-200', open && 'rotate-45 translate-y-2')} />
            <span className={cn('w-6 h-0.5 bg-espresso rounded transition-all duration-200', open && 'opacity-0')} />
            <span className={cn('w-6 h-0.5 bg-espresso rounded transition-all duration-200', open && '-rotate-45 -translate-y-2')} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-40 bg-warm flex flex-col pt-16 overflow-y-auto lg:hidden">
          <div className="px-4 py-4 flex-1">

            {/* Hlavní sekce */}
            <div className="mb-6">
              <div className="text-xs font-bold text-gray uppercase tracking-widest mb-3 px-2">Adopce a záchrana</div>
              <ul className="list-none space-y-1">
                {mainLinks.map(({ href, label, desc }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex flex-col px-3 py-3 rounded-md no-underline transition-colors',
                        isActive(href) ? 'bg-coral-light' : 'hover:bg-sand'
                      )}
                    >
                      <span className={cn('font-display font-bold text-lg', isActive(href) ? 'text-coral-dark' : 'text-espresso')}>
                        {label}
                      </span>
                      <span className="text-xs text-gray mt-0.5">{desc}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro instituce */}
            <div className="border-t border-gray-pale pt-5 mb-5">
              <div className="text-xs font-bold text-gray uppercase tracking-widest mb-3 px-2">Instituce</div>
              <Link href="/pro-instituce" onClick={() => setOpen(false)}
                className="flex flex-col px-3 py-3 rounded-md no-underline hover:bg-sand transition-colors">
                <span className="font-display font-bold text-lg text-espresso">🏢 Pro útulky a stanice</span>
                <span className="text-xs text-gray mt-0.5">Registrace, ceník a funkce platformy</span>
              </Link>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="px-4 py-5 border-t border-gray-pale space-y-3">
            <Link href="/auth/register" onClick={() => setOpen(false)}>
              <Button variant="primary" className="w-full justify-center">Registrovat instituci</Button>
            </Link>
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <Button variant="sand" className="w-full justify-center">Přihlásit se</Button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
