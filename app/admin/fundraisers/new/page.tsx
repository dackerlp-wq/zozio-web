import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { FundraiserForm } from '@/components/admin/FundraiserForm'

export default async function NewFundraiserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, type, darujme_api_id')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/fundraisers" className="text-sm text-gray hover:text-coral transition-colors font-semibold">
          ← Zpět na sbírky
        </a>
      </div>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-8">
        💛 Nová sbírka
      </h1>
      <FundraiserForm
        institutionId={institution.id}
        institutionType={institution.type}
        mode="create"
        hasDarujmeCredentials={!!institution.darujme_api_id}
      />
    </div>
  )
}
