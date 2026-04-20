import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalSidebar } from '@/components/portal/PortalSidebar'

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
    <div className="min-h-screen flex" style={{ background: '#FAFAF8' }}>
      <PortalSidebar companyName={companyName} />

      {/* Main content — offset by sidebar width on desktop, topbar on mobile */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
