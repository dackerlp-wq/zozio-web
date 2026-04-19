'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { cn } from '@/lib/utils'

interface PortalSidebarProps {
  companyName: string
}

const navItems = [
  { href: '/portal/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/portal/ads',       icon: '📣', label: 'Moje reklamy' },
  { href: '/portal/ads/new',   icon: '➕', label: 'Nová reklama' },
  { href: '/portal/settings',  icon: '⚙️', label: 'Nastavení firmy' },
  { href: '/portal/info',      icon: '📘', label: 'Jak to funguje' },
]

export function PortalSidebar({ companyName }: PortalSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setOpen(false)}>
          <ZozLogo size="sm" variant="inverted" />
          <span className="font-body text-xs font-semibold" style={{ color: '#C5A882' }}>inzerce</span>
        </Link>
      </div>

      {/* Firma info */}
      <div className="mx-4 mt-4 p-3 rounded-md" style={{ background: 'rgba(240,165,0,0.15)' }}>
        <div className="font-display font-bold text-sm text-white leading-tight">
          📣 {companyName}
        </div>
        <div className="text-xs mt-0.5 font-semibold" style={{ color: '#C5A882' }}>
          Reklamní účet
        </div>
      </div>

      {/* Navigace */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(({ href, icon, label }) => {
            // "Moje reklamy" is active for /portal/ads but not /portal/ads/new
            const isActive = href === '/portal/ads'
              ? (pathname === '/portal/ads' || (pathname.startsWith('/portal/ads/') && !pathname.startsWith('/portal/ads/new')))
              : href === '/portal/ads/new'
                ? pathname === '/portal/ads/new'
                : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'hover:bg-white/8 hover:text-white'
                )}
                style={{ color: isActive ? '#ffffff' : '#C5A882' }}>
                <span className="text-base w-5 text-center shrink-0">{icon}</span>
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <Link href="/" onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-xs hover:text-white transition-colors no-underline font-semibold"
          style={{ color: '#9E8070' }}>
          ← Zpět na web
        </Link>
        <form action="/auth/logout" method="POST">
          <button type="submit"
            className="flex items-center gap-2 text-xs hover:text-white transition-colors font-semibold cursor-pointer bg-transparent border-none w-full text-left"
            style={{ color: '#9E8070' }}>
            🚪 Odhlásit se
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40"
        style={{ background: '#2C1810' }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 border-b border-white/10"
        style={{ background: '#2C1810' }}>
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <ZozLogo size="xs" variant="inverted" />
          <span className="font-body text-xs font-semibold" style={{ color: '#C5A882' }}>inzerce</span>
        </Link>
        <span className="font-display font-bold text-xs text-white truncate flex-1 mx-1">
          📣 {companyName}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1 p-2 cursor-pointer bg-transparent border-none shrink-0"
          aria-label="Menu">
          <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && 'rotate-45 translate-y-1.5')} />
          <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && 'opacity-0')} />
          <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && '-rotate-45 -translate-y-1.5')} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col pt-14 overflow-y-auto"
          style={{ background: '#2C1810' }}>
          <SidebarContent />
        </div>
      )}
    </>
  )
}
