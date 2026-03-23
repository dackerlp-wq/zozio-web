'use client'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/public/Navbar'

export function NavbarWrapper() {
  const pathname = usePathname()
  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/superadmin')
  if (isAdminRoute) return null
  return <Navbar />
}
