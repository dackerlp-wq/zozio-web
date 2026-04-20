import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { DarujmeForm } from '@/components/admin/DarujmeForm'

export const metadata = { title: 'Propojení — Nastavení — Zozio Admin' }

export default async function SettingsIntegrationsPage() {
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
    .select('id, name, type, darujme_api_id, darujme_api_secret')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm text-[#A09890] mb-5 font-semibold">
        <span>Nastavení</span>
        <span>·</span>
        <span className="text-[#2C1810]">Propojení</span>
      </nav>
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-[#2C1810]">🔗 Propojení</h1>
        <p className="text-sm text-[#8B6550] mt-1 font-semibold">{institution.name}</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <DarujmeForm institution={institution} />

        {/* Placeholder pro další propojení */}
        <div className="bg-white rounded-lg border border-[#F0EDE8] shadow-sm p-6">
          <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-2">
            Další propojení
          </h2>
          <p className="text-sm text-[#A09890] font-semibold">
            Brzy přidáme další integrace.
          </p>
        </div>
      </div>
    </div>
  )
}
