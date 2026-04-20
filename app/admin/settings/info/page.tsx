import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const metadata = { title: 'Základní informace — Nastavení — Zozio Admin' }

export default async function SettingsInfoPage() {
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
      <nav className="flex items-center gap-2 text-sm text-[#A09890] mb-5 font-semibold">
        <span>Nastavení</span>
        <span>·</span>
        <span className="text-[#2C1810]">Základní informace</span>
      </nav>
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-[#2C1810]">⚙️ Základní informace</h1>
        <p className="text-sm text-[#8B6550] mt-1 font-semibold">{institution.name}</p>
      </div>
      <SettingsForm institution={institution} userRole={membership.role} />
    </div>
  )
}
