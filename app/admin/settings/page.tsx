import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('*')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">
          ⚙️ Nastavení instituce
        </h1>
        <p className="text-gray mt-1 font-semibold text-sm">{institution.name}</p>
      </div>
      <SettingsForm institution={institution} userRole={membership.role} />
    </div>
  )
}
