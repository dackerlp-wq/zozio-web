import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { PortalLogout } from './PortalLogout'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/portal')

  const displayName = user.user_metadata?.full_name ?? user.email ?? 'Inzerent'

  // Načteme název firmy pokud existuje
  const { data: company } = await supabase
    .from('ad_companies')
    .select('company_name')
    .eq('user_id', user.id)
    .single()

  const companyName = company?.company_name ?? displayName

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      {/* Top nav */}
      <header className="bg-white border-b" style={{ borderColor: '#F0EDE8' }}>
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/portal" className="no-underline flex items-center">
              <ZozLogo size="sm" />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/portal/dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold no-underline transition-colors hover:bg-[#F0EDE8]"
                style={{ color: '#2C1810' }}>
                Dashboard
              </Link>
              <Link href="/portal/ads"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold no-underline transition-colors hover:bg-[#F0EDE8]"
                style={{ color: '#2C1810' }}>
                Moje reklamy
              </Link>
              <Link href="/portal/settings"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold no-underline transition-colors hover:bg-[#F0EDE8]"
                style={{ color: '#2C1810' }}>
                Nastavení
              </Link>
            </nav>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold hidden sm:block" style={{ color: '#8B6550' }}>
              {companyName}
            </span>
            <PortalLogout />
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          <Link href="/portal/dashboard"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold no-underline whitespace-nowrap transition-colors hover:bg-[#F0EDE8]"
            style={{ color: '#2C1810' }}>
            Dashboard
          </Link>
          <Link href="/portal/ads"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold no-underline whitespace-nowrap transition-colors hover:bg-[#F0EDE8]"
            style={{ color: '#2C1810' }}>
            Moje reklamy
          </Link>
          <Link href="/portal/settings"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold no-underline whitespace-nowrap transition-colors hover:bg-[#F0EDE8]"
            style={{ color: '#2C1810' }}>
            Nastavení
          </Link>
        </nav>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
