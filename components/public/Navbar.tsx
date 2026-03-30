'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const mainLinks = [
  { href: '/adopt',        label: '🐾 Zvířata k adopci',  desc: 'Psi, kočky a další hledají domov' },
  { href: '/rescue',       label: '🦉 Záchranné stanice',  desc: 'Volně žijící zvířata v léčbě' },
  { href: '/institutions', label: '🏠 Útulky a stanice',   desc: 'Adresář všech institucí v ČR/SR' },
  { href: '/fundraisers',  label: '💛 Sbírky',             desc: 'Přispěj konkrétnímu zvířeti' },
  { href: '/articles',     label: '📖 Příběhy',            desc: 'Úspěšné adopce a záchranné příběhy' },
]

interface NavUser {
  email: string
  name: string
  role: string | null
  institutionSlug: string | null
}

interface NavbarProps {
  user?: NavUser | null
}

export function Navbar({ user }: NavbarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open,    setOpen]    = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  // Skrýt na admin routách
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin')
  if (isAdminRoute) return null

  // Zavři dropdown při kliknutí mimo
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  // Initiály pro avatar
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

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
            {user ? (
              /* Přihlášený uživatel — avatar dropdown */
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E0DDD8] bg-white hover:bg-sand transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#E8634A] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-espresso max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cn('transition-transform', dropdown && 'rotate-180')}>
                    <path d="M2 4l4 4 4-4" stroke="#8B6550" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {dropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-[#F0EDE8] overflow-hidden z-50">
                    {/* Hlavička */}
                    <div className="px-4 py-3 border-b border-[#F0EDE8]">
                      <div className="font-bold text-sm text-espresso truncate">{user.name}</div>
                      <div className="text-xs text-gray truncate">{user.email}</div>
                    </div>

                    {/* Menu položky */}
                    <div className="py-1">
                      <Link href="/profil" onClick={() => setDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-espresso no-underline hover:bg-sand transition-colors">
                        <span>👤</span> Můj profil
                      </Link>

                      {user.role === 'institution_admin' && user.institutionSlug && (
                        <Link href={`/admin/dashboard`} onClick={() => setDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-espresso no-underline hover:bg-sand transition-colors">
                          <span>🏠</span> Administrace instituce
                        </Link>
                      )}

                      {user.role === 'staff' && (
                        <Link href="/admin/dashboard" onClick={() => setDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-espresso no-underline hover:bg-sand transition-colors">
                          <span>🏠</span> Admin panel
                        </Link>
                      )}

                      {user.role === 'superadmin' && (
                        <Link href="/superadmin" onClick={() => setDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-espresso no-underline hover:bg-sand transition-colors">
                          <span>⚡</span> Superadmin
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-[#F0EDE8] py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#993C1D] hover:bg-[#FAECE7] transition-colors cursor-pointer bg-transparent border-none text-left"
                      >
                        <span>↩</span> Odhlásit se
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Nepřihlášený */
              <Link href="/auth/login">
                <Button variant="sand" size="sm">Přihlásit</Button>
              </Link>
            )}
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

            {/* Přihlášený user info */}
            {user && (
              <div className="mb-5 flex items-center gap-3 px-3 py-3 bg-sand rounded-xl">
                <div className="w-9 h-9 rounded-full bg-[#E8634A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-espresso truncate">{user.name}</div>
                  <div className="text-xs text-gray truncate">{user.email}</div>
                </div>
              </div>
            )}

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

            {/* Přihlášený — admin linky */}
            {user && (
              <div className="border-t border-gray-pale pt-5 mb-5">
                <div className="text-xs font-bold text-gray uppercase tracking-widest mb-3 px-2">Můj účet</div>
                <Link href="/profil" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-md no-underline hover:bg-sand transition-colors">
                  <span>👤</span>
                  <span className="font-bold text-espresso">Můj profil</span>
                </Link>
                {(user.role === 'institution_admin' || user.role === 'staff') && (
                  <Link href="/admin/dashboard" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md no-underline hover:bg-sand transition-colors">
                    <span>🏠</span>
                    <span className="font-bold text-espresso">Admin panel</span>
                  </Link>
                )}
                {user.role === 'superadmin' && (
                  <Link href="/superadmin" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md no-underline hover:bg-sand transition-colors">
                    <span>⚡</span>
                    <span className="font-bold text-espresso">Superadmin</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile CTA */}
          <div className="px-4 py-5 border-t border-gray-pale space-y-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold border border-[#E0DDD8] text-[#993C1D] bg-white cursor-pointer hover:bg-[#FAECE7] transition-colors"
              >
                ↩ Odhlásit se
              </button>
            ) : (
              <>
                <Link href="/auth/register" onClick={() => setOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">Registrovat instituci</Button>
                </Link>
                <Link href="/auth/login" onClick={() => setOpen(false)}>
                  <Button variant="sand" className="w-full justify-center">Přihlásit se</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
