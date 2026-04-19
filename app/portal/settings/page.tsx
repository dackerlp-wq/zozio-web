import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'
import type { AdCompany } from '@/types/database'

export const revalidate = 0

export default async function PortalSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: company } = await supabase
    .from('ad_companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl mb-2" style={{ color: '#1A0F0A' }}>
        Nastavení firmy
      </h1>
      <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
        Tyto informace slouží pro fakturaci a komunikaci s Zozio týmem.
      </p>

      {!company?.approved && company && (
        <div className="mb-6 px-4 py-3 rounded-xl border" style={{ background: '#FEF9E7', borderColor: '#FDE68A', color: '#854F0B' }}>
          <p className="text-sm font-semibold">
            Váš účet čeká na schválení od Zozio týmu. Budeme vás kontaktovat na {company.contact_email}.
          </p>
        </div>
      )}

      <SettingsForm initial={company as AdCompany | null} />
    </div>
  )
}
