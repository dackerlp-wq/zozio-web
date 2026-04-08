'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminBottomNavProps {
  institutionType: 'shelter' | 'rescue_station' | null
  isSuperadmin: boolean
}

export function AdminBottomNav({ institutionType, isSuperadmin }: AdminBottomNavProps) {
  const pathname = usePathname()
  const isShelter = institutionType === 'shelter'
  const activeColor = isShelter ? '#E8634A' : '#2E9E8F'
  const defaultColor = '#8B6550'

  const shelterItems = [
    { href: '/admin/dashboard',     icon: '📊', label: 'Dashboard' },
    { href: '/admin/animals',       icon: '🐾', label: 'Zvířata' },
    { href: '/admin/applications',  icon: '📋', label: 'Žádosti' },
    { href: '/admin/newsletter',    icon: '📬', label: 'Newsletter' },
    { href: '/admin/settings',      icon: '⚙️', label: 'Nastavení' },
  ]

  const rescueItems = [
    { href: '/admin/dashboard',  icon: '📊', label: 'Dashboard' },
    { href: '/admin/animals',    icon: '🦉', label: 'Pacienti' },
    { href: '/admin/cases',      icon: '🩺', label: 'Záznamy' },
    { href: '/admin/newsletter', icon: '📬', label: 'Newsletter' },
    { href: '/admin/settings',   icon: '⚙️', label: 'Nastavení' },
  ]

  const items = isShelter ? shelterItems : rescueItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden h-[60px] bg-[#2C1810] border-t border-white/10 flex items-center justify-around px-2">
      {items.map(({ href, icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center flex-1 h-full no-underline"
            style={{ color: isActive ? activeColor : defaultColor }}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[10px] font-bold mt-0.5 leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
