'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface AdminTopbarProps {
  institutionName: string | null
  isShelter: boolean | null
  isSuperadmin: boolean
}

function getPageTitle(pathname: string, isShelter: boolean | null): string {
  if (pathname === '/admin/dashboard' || pathname.startsWith('/admin/dashboard/')) return 'Dashboard'
  if (pathname === '/admin/animals' || pathname.startsWith('/admin/animals/')) return isShelter ? 'Zvířata' : 'Pacienti'
  if (pathname === '/admin/applications' || pathname.startsWith('/admin/applications/')) return 'Žádosti o adopci'
  if (pathname === '/admin/cases' || pathname.startsWith('/admin/cases/')) return 'Záznamy léčby'
  if (pathname === '/admin/articles' || pathname.startsWith('/admin/articles/')) return 'Články'
  if (pathname === '/admin/fundraisers' || pathname.startsWith('/admin/fundraisers/')) return 'Sbírky'
  if (pathname === '/admin/volunteers' || pathname.startsWith('/admin/volunteers/')) return 'Dobrovolníci'
  if (pathname === '/admin/newsletter' || pathname.startsWith('/admin/newsletter/')) return 'Newsletter'
  if (pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')) return 'Nastavení'
  if (pathname === '/admin/billing' || pathname.startsWith('/admin/billing/')) return 'Předplatné'
  return 'Admin'
}

export function AdminTopbar({ institutionName, isShelter, isSuperadmin }: AdminTopbarProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname, isShelter)

  const showCta = !isSuperadmin || institutionName !== null
  const ctaLabel = isShelter ? '+ Přidat zvíře' : '+ Přijmout pacienta'
  const ctaBg = isShelter ? '#E8634A' : '#2E9E8F'

  return (
    <div className="h-14 bg-white border-b border-[#F0EDE8] flex items-center gap-3 px-5">
      <span className="font-bold text-base text-[#1A0F0A] flex-1">{title}</span>

      {showCta && !isSuperadmin && (
        <Link
          href="/admin/animals/new"
          className="hidden md:flex px-4 py-2 rounded-full font-bold text-sm text-white no-underline items-center gap-1.5"
          style={{ backgroundColor: ctaBg }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
