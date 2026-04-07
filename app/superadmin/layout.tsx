import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SuperadminSidebar } from '@/components/admin/SuperadminSidebar'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F4F0' }}>
      <SuperadminSidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Amber topbar */}
        <div className="hidden lg:flex fixed top-0 left-64 right-0 z-30 h-14 items-center justify-end px-6 border-b"
          style={{ background: '#FFFCF8', borderColor: '#F0EDE8' }}>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(217,119,6,0.12)', color: '#D97706' }}>
            Superadmin konzole
          </span>
        </div>
        <div className="pt-0 lg:pt-14">
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
