'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { cn } from '@/lib/utils'

const mainLinks = [
  { href: '/adopt',        label: 'Zvířata k adopci' },
  { href: '/rescue',       label: 'Záchranné stanice' },
  { href: '/institutions', label: 'Útulky' },
  { href: '/fundraisers',  label: 'Sbírky' },
  { href: '/articles',     label: 'Příběhy' },
]

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  const [open,       setOpen]       = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal,  setSearchVal]  = useState('')
  const [scrolled,   setScrolled]   = useState(false)

  // Navbar je průhledný jen na homepage
  const isHome = pathname === '/'

  useEffect(() => {
    if (!isHome) { setScrolled(true); return }
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const transparent = isHome && !scrolled && !open && !searchOpen

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchOpen(false)
      setSearchVal('')
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Barvy pro transparentní vs. světlý navbar
  const linkColor    = transparent ? 'rgba(255,255,255,0.80)' : '#6B4030'
  const linkActive   = transparent ? 'white'                  : '#1A0F0A'
  const iconColor    = transparent ? 'rgba(255,255,255,0.70)' : '#8B6550'
  const borderColor  = transparent ? 'rgba(255,255,255,0.15)' : '#F0EDE8'

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background:   transparent ? 'transparent' : 'rgba(255,252,248,0.94)',
          backdropFilter: transparent ? 'none' : 'blur(12px)',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-3.5 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
            <ZozLogo size="sm" />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-0.5 list-none m-0 p-0 flex-1 justify-center">
            {mainLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold no-underline transition-all"
                  style={{
                    color:      isActive(href) ? linkActive : linkColor,
                    background: isActive(href)
                      ? (transparent ? 'rgba(255,255,255,0.12)' : 'rgba(232,99,74,0.08)')
                      : 'transparent',
                    fontWeight: isActive(href) ? 700 : 600,
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop akce */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border-none bg-transparent"
              style={{ color: iconColor }}
              aria-label="Hledat"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M13 13l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>

            <Link href="/auth/login">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none transition-all"
                style={{
                  background: transparent ? 'rgba(255,255,255,0.12)' : '#F5EDE8',
                  color:      transparent ? 'white' : '#6B4030',
                }}
              >
                Přihlásit
              </button>
            </Link>

            <Link href="/pro-instituce">
              <button
                className="px-4 py-2 rounded-lg text-sm font-bold text-white cursor-pointer border-none transition-all hover:opacity-90"
                style={{ background: '#E8634A' }}
              >
                Pro útulky
              </button>
            </Link>
          </div>

          {/* Mobile — search + burger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer border-none bg-transparent transition-all"
              style={{ color: iconColor }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M13 13l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="flex flex-col gap-1.5 p-2 cursor-pointer bg-transparent border-none"
              aria-label="Menu"
            >
              <span className={cn('w-5 h-0.5 rounded transition-all duration-200', open && 'rotate-45 translate-y-2')}
                style={{ background: transparent ? 'white' : '#1A0F0A' }} />
              <span className={cn('w-5 h-0.5 rounded transition-all duration-200', open && 'opacity-0')}
                style={{ background: transparent ? 'white' : '#1A0F0A' }} />
              <span className={cn('w-5 h-0.5 rounded transition-all duration-200', open && '-rotate-45 -translate-y-2')}
                style={{ background: transparent ? 'white' : '#1A0F0A' }} />
            </button>
          </div>
        </div>

        {/* Search dropdown */}
        {searchOpen && (
          <div className="border-t px-5 md:px-10 py-3" style={{ borderColor, background: 'rgba(255,252,248,0.98)' }}>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-[560px] mx-auto">
              <input
                type="search"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Hledat zvíře, útulok, město..."
                autoFocus
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm text-[#1A0F0A] outline-none"
                style={{ borderColor: '#E0DDD8', background: 'white' }}
              />
              <button type="submit"
                className="px-5 py-2.5 rounded-lg font-bold text-sm text-white cursor-pointer border-none"
                style={{ background: '#E8634A' }}>
                Hledat
              </button>
              <button type="button" onClick={() => setSearchOpen(false)}
                className="px-3 text-[#8B6550] cursor-pointer bg-transparent border-none font-bold text-lg">
                ✕
              </button>
            </form>
          </div>
        )}
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col pt-16 overflow-y-auto lg:hidden" style={{ background: '#FFFCF8' }}>
          <div className="px-5 py-5 flex-1">
            <ul className="list-none space-y-1">
              {mainLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center px-4 py-3.5 rounded-xl no-underline font-bold text-lg transition-all"
                    style={{
                      color:      isActive(href) ? '#E8634A' : '#1A0F0A',
                      background: isActive(href) ? '#FAECE7' : 'transparent',
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t mt-5 pt-5" style={{ borderColor: '#F0EDE8' }}>
              <Link href="/pro-instituce" onClick={() => setOpen(false)}
                className="flex items-center px-4 py-3.5 rounded-xl no-underline font-bold text-lg text-[#1A0F0A] transition-all hover:bg-[#F5EDE8]">
                Pro útulky a stanice
              </Link>
            </div>
          </div>

          <div className="px-5 py-5 border-t space-y-3" style={{ borderColor: '#F0EDE8' }}>
            <Link href="/auth/register" onClick={() => setOpen(false)}>
              <button className="w-full py-3.5 rounded-xl font-bold text-base text-white cursor-pointer border-none" style={{ background: '#E8634A' }}>
                Registrovat instituci
              </button>
            </Link>
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <button className="w-full py-3.5 rounded-xl font-bold text-base cursor-pointer border" style={{ background: 'white', color: '#1A0F0A', borderColor: '#E0DDD8' }}>
                Přihlásit se
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
