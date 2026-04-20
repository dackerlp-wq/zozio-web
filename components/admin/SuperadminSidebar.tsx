'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/superadmin',              icon: '📊', label: 'Dashboard' },
  { href: '/superadmin/institutions', icon: '🏢', label: 'Instituce' },
  { href: '/superadmin/users',        icon: '👥', label: 'Uživatelé' },
  { href: '/superadmin/breeds',       icon: '🐾', label: 'Rasy zvířat' },
  { href: '/superadmin/articles',     icon: '📝', label: 'Články' },
  { href: '/superadmin/newsletter',   icon: '📬', label: 'Newsletter' },
  { href: '/superadmin/ads',          icon: '📣', label: 'Reklamy' },
]

export function SuperadminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/superadmin'
      ? pathname === '/superadmin'
      : pathname.startsWith(href)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setOpen(false)}>
          <ZozLogo size="sm" variant="inverted" />
          <span className="font-body text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: '#D97706', color: 'white' }}>
            superadmin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          Správa platformy
        </div>
        <div className="space-y-0.5">
          {navItems.map(({ href, icon, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                isActive(href)
                  ? 'text-white'
                  : 'text-gray-light hover:bg-white/8 hover:text-white'
              )}
              style={isActive(href) ? { background: 'rgba(217,119,6,0.25)', color: '#FCD34D' } : {}}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <Link href="/admin/dashboard" onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-xs hover:text-white transition-colors no-underline font-semibold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          ← Běžný admin
        </Link>
        <Link href="/" onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-xs hover:text-white transition-colors no-underline font-semibold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          ← Zpět na web
        </Link>
        <form action="/auth/logout" method="POST">
          <button type="submit"
            className="flex items-center gap-2 text-xs hover:text-coral transition-colors font-semibold cursor-pointer bg-transparent border-none w-full text-left"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
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
        style={{ background: '#1C1007' }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-2 border-b border-white/10"
        style={{ background: '#1C1007' }}>
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <ZozLogo size="xs" variant="inverted" />
          <span className="font-body text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: '#D97706', color: 'white' }}>
            superadmin
          </span>
        </Link>
        <div className="flex-1" />
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1 p-2 cursor-pointer bg-transparent border-none"
          aria-label="Menu">
          <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && 'rotate-45 translate-y-1.5')} />
          <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && 'opacity-0')} />
          <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && '-rotate-45 -translate-y-1.5')} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col pt-14 overflow-y-auto"
          style={{ background: '#1C1007' }}>
          <SidebarContent />
        </div>
      )}
    </>
  )
}
