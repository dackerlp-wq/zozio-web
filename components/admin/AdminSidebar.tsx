'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { cn } from '@/lib/utils'

interface NavGroupProps {
  icon: string
  label: string
  isActive: boolean
  children: React.ReactNode
  onClose: () => void
}

function NavGroup({ icon, label, isActive, children, onClose }: NavGroupProps) {
  const [expanded, setExpanded] = useState(isActive)
  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all bg-transparent border-none cursor-pointer',
          isActive ? 'text-white' : 'text-gray-light hover:bg-white/8 hover:text-white'
        )}>
        <span className="text-base w-5 text-center shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span className={cn('text-[10px] transition-transform', expanded ? 'rotate-90' : '')}>▶</span>
      </button>
      {expanded && (
        <div className="pl-8 mt-0.5 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  )
}

interface AdminSidebarProps {
  institution: {
    id: string
    name: string
    type: string
    slug: string
    approval_status: string
  } | null
  userRole: string
  isSuperadmin: boolean
}

export function AdminSidebar({ institution, userRole, isSuperadmin }: AdminSidebarProps) {
  const pathname = usePathname()
  const isShelter = institution?.type === 'shelter'
  const [open, setOpen] = useState(false)

  const isAdoptionActive  = pathname.startsWith('/admin/applications') || pathname.startsWith('/admin/calendar')
  const isSettingsActive  = pathname.startsWith('/admin/settings')

  const navItems = [
    { href: '/admin/dashboard',    icon: '📊', label: 'Dashboard' },
    { href: '/admin/statistics',   icon: '📈', label: 'Statistiky' },
    { href: '/admin/animals',      icon: isShelter ? '🐾' : '🦉', label: isShelter ? 'Zvířata' : 'Pacienti' },
    ...(!isShelter
      ? [{ href: '/admin/cases', icon: '🩺', label: 'Záznamy léčby' }]
      : []
    ),
    { href: '/admin/fundraisers',  icon: '💛', label: 'Sbírky' },
    { href: '/admin/volunteers',   icon: '🙋', label: 'Dobrovolníci' },
    { href: '/admin/articles',     icon: '📝', label: 'Články' },
    { href: '/admin/newsletter',   icon: '📬', label: 'Newsletter' },
    { href: '/admin/billing',      icon: '💳', label: 'Předplatné' },
  ]

  const adoptionSubItems = [
    { href: '/admin/applications', label: '📋 Žádosti o adopci' },
    { href: '/admin/calendar',     label: '📅 Kalendář schůzek' },
  ]

  const settingsSubItems = [
    { href: '/admin/settings/info',         label: '⚙️ Základní informace' },
    { href: '/admin/settings/hours',        label: '🕐 Provozní doba' },
    { href: '/admin/settings/coverage',     label: '🗺️ Dosah na mapě' },
    { href: '/admin/settings/widget',       label: '🔗 Widget' },
    { href: '/admin/settings/integrations', label: '🤝 Propojení' },
  ]

  const superadminItems = [
    { href: '/superadmin',              icon: '🔐', label: 'Superadmin' },
    { href: '/superadmin/institutions', icon: '🏢', label: 'Instituce' },
    { href: '/superadmin/users',        icon: '👥', label: 'Uživatelé' },
    { href: '/superadmin/newsletter',   icon: '📬', label: 'Newsletter' },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setOpen(false)}>
          <ZozLogo size="sm" variant="inverted" />
          <span className="font-body text-xs font-semibold text-gray-light">admin</span>
        </Link>
      </div>

      {/* Instituce info */}
      {institution && (
        <div className={`mx-4 mt-4 p-3 rounded-md ${institution.type === 'shelter' ? 'bg-coral/20' : 'bg-rescue/20'}`}>
          <div className="font-display font-bold text-sm text-white leading-tight">
            {institution.type === 'shelter' ? '🏠' : '🚑'} {institution.name}
          </div>
          <div className="text-xs text-gray-light mt-0.5 font-semibold capitalize">
            {userRole} · {institution.approval_status === 'approved' ? '✓ Schváleno' : '⏳ Čeká'}
          </div>
        </div>
      )}

      {/* Navigace */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {/* Dashboard, Statistiky, Zvířata — první 3 položky jsou stejné pro oba typy */}
          {navItems.slice(0, 3).map(({ href, icon, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-white/15 text-white'
                  : 'text-gray-light hover:bg-white/8 hover:text-white'
              )}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}

          {/* Adopce skupina (jen pro útulky) */}
          {isShelter && (
            <NavGroup icon="🏠" label="Adopce" isActive={isAdoptionActive} onClose={() => setOpen(false)}>
              {adoptionSubItems.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md font-body text-sm font-semibold transition-all no-underline',
                    pathname === href || pathname.startsWith(href + '/')
                      ? 'bg-white/15 text-white'
                      : 'text-gray-light hover:bg-white/8 hover:text-white'
                  )}>
                  {label}
                </Link>
              ))}
            </NavGroup>
          )}

          {/* Záznamy léčby (jen pro záchranné stanice) — navItems[3] = cases */}
          {!isShelter && navItems.slice(3, 4).map(({ href, icon, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-white/15 text-white'
                  : 'text-gray-light hover:bg-white/8 hover:text-white'
              )}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}

          {/* Zbytek navigace — shelter: od index 3 (Sbírky…), rescue: od index 4 (Sbírky…) */}
          {(isShelter ? navItems.slice(3) : navItems.slice(4)).map(({ href, icon, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-white/15 text-white'
                  : 'text-gray-light hover:bg-white/8 hover:text-white'
              )}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}

          {/* Nastavení skupina */}
          <NavGroup icon="⚙️" label="Nastavení" isActive={isSettingsActive} onClose={() => setOpen(false)}>
            {settingsSubItems.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md font-body text-sm font-semibold transition-all no-underline',
                  pathname === href
                    ? 'bg-white/15 text-white'
                    : 'text-gray-light hover:bg-white/8 hover:text-white'
                )}>
                {label}
              </Link>
            ))}
          </NavGroup>
        </div>

        {isSuperadmin && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="text-[10px] font-bold text-gray uppercase tracking-widest px-3 mb-2">Superadmin</div>
            <div className="space-y-1">
              {superadminItems.map(({ href, icon, label }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                    pathname === href || pathname.startsWith(href + '/')
                      ? 'bg-amber/20 text-amber'
                      : 'text-gray-light hover:bg-white/8 hover:text-white'
                  )}>
                  <span className="text-base w-5 text-center">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <Link href="/" onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-xs text-gray hover:text-white transition-colors no-underline font-semibold">
          ← Zpět na web
        </Link>
        <form action="/auth/logout" method="POST">
          <button type="submit"
            className="flex items-center gap-2 text-xs text-gray hover:text-coral transition-colors font-semibold cursor-pointer bg-transparent border-none w-full text-left">
            🚪 Odhlásit se
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-espresso flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-espresso px-4 py-3 flex items-center gap-2 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <ZozLogo size="xs" variant="inverted" />
          <span className="font-body text-xs font-semibold text-gray-light">admin</span>
        </Link>
        {institution && (
          <span className="font-display font-bold text-xs text-white truncate flex-1 mx-1">
            {institution.type === 'shelter' ? '🏠' : '🚑'} {institution.name}
          </span>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            className="w-9 h-9 flex items-center justify-center text-base cursor-pointer bg-transparent border-none text-gray-light hover:text-white transition-colors"
            title="Oznámení"
          >
            🔔
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="flex flex-col gap-1 p-2 cursor-pointer bg-transparent border-none"
            aria-label="Menu"
          >
            <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && 'rotate-45 translate-y-1.5')} />
            <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && 'opacity-0')} />
            <span className={cn('w-5 h-0.5 bg-white rounded transition-all', open && '-rotate-45 -translate-y-1.5')} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-espresso flex flex-col pt-14 overflow-y-auto">
          <SidebarContent />
        </div>
      )}
    </>
  )
}
