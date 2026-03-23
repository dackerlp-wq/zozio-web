import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Načti instituci uživatele
  const { data: membership } = await supabase
    .from('institution_members')
    .select('role, institution:institutions(id, name, type, slug, approval_status)')
    .eq('user_id', user.id)
    .single()

  // Pokud nemá instituci a není superadmin — přesměruj
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperadmin = profile?.role === 'superadmin'

  if (!membership && !isSuperadmin) {
    redirect('/auth/register')
  }

  const institution = membership?.institution as {
    id: string; name: string; type: string; slug: string; approval_status: string
  } | null

  return (
    <div className="min-h-screen bg-gray-pale/30 flex">
      <AdminSidebar
        institution={institution}
        userRole={membership?.role ?? 'staff'}
        isSuperadmin={isSuperadmin}
      />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
