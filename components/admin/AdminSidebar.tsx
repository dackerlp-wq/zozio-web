'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { cn } from '@/lib/utils'

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

  const navItems = [
    { href: '/admin/dashboard',    icon: '📊', label: 'Dashboard' },
    { href: '/admin/animals',      icon: isShelter ? '🐾' : '🦉', label: isShelter ? 'Zvířata' : 'Pacienti' },
    ...(isShelter ? [{ href: '/admin/applications', icon: '📋', label: 'Žádosti o adopci' }] : []),
    { href: '/admin/fundraisers',  icon: '💛', label: 'Sbírky' },
    { href: '/admin/volunteers',   icon: '🙋', label: 'Dobrovolníci' },
    { href: '/admin/settings',     icon: '⚙️', label: 'Nastavení' },
  ]

  const superadminItems = [
    { href: '/superadmin',              icon: '🔐', label: 'Superadmin' },
    { href: '/superadmin/institutions', icon: '🏢', label: 'Instituce' },
    { href: '/superadmin/users',        icon: '👥', label: 'Uživatelé' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-espresso flex flex-col z-40">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
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
            {userRole} · {institution.approval_status === 'approved' ? '✓ Schváleno' : '⏳ Čeká na schválení'}
          </div>
        </div>
      )}

      {/* Navigace */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-white/15 text-white'
                  : 'text-gray-light hover:bg-white/8 hover:text-white'
              )}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* Superadmin sekce */}
        {isSuperadmin && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="text-[10px] font-bold text-gray uppercase tracking-widest px-3 mb-2">
              Superadmin
            </div>
            <div className="space-y-1">
              {superadminItems.map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-semibold transition-all no-underline',
                    pathname === href || pathname.startsWith(href + '/')
                      ? 'bg-amber/20 text-amber'
                      : 'text-gray-light hover:bg-white/8 hover:text-white'
                  )}
                >
                  <span className="text-base w-5 text-center">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-gray hover:text-white transition-colors no-underline font-semibold"
        >
          ← Zpět na web
        </Link>
      </div>
    </aside>
  )
}
