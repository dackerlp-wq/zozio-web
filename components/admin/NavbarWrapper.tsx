'use client'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'

export function NavbarWrapper() {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin')
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAdminRoute) return null

  return (
    <>
      <Navbar />
      {/* Footer se renderuje přes layout — viz níže */}
    </>
  )
}

export function FooterWrapper() {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin')
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAdminRoute || isAuthRoute) return null

  return <Footer />
}
