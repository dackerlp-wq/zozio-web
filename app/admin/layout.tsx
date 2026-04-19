import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminBottomNav } from '@/components/admin/AdminBottomNav'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperadmin = profile?.role === 'superadmin'

  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership && !isSuperadmin) redirect('/auth/register')

  let institution = null
  if (membership?.institution_id) {
    const { data: inst } = await service
      .from('institutions')
      .select('id, name, type, slug, approval_status')
      .eq('id', membership.institution_id)
      .single()
    institution = inst
  }

  return (
    <div className="min-h-screen bg-gray-pale/30 flex">
      <AdminSidebar
        institution={institution}
        userRole={membership?.role ?? 'staff'}
        isSuperadmin={isSuperadmin}
      />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <AdminTopbar
          institutionName={institution?.name ?? null}
          isShelter={institution ? institution.type === 'shelter' : null}
          isSuperadmin={isSuperadmin}
        />
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-8 pb-[76px] lg:pb-8">
          {children}
        </div>
      </main>
      <AdminBottomNav
        isSuperadmin={isSuperadmin}
      />
    </div>
  )
}
