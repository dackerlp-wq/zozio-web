import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import { FundraiserForm } from '@/components/admin/FundraiserForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditFundraiserPage({ params }: PageProps) {
  const { id } = await params
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

  const { data: fundraiser } = await service
    .from('fundraisers')
    .select('*')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!fundraiser) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/fundraisers" className="text-sm text-gray hover:text-coral transition-colors font-semibold">
          ← Zpět na sbírky
        </a>
      </div>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-8">
        Upravit sbírku
      </h1>
      <FundraiserForm
        institutionId={institution.id}
        institutionType={institution.type}
        mode="edit"
        fundraiser={fundraiser}
        hasDarujmeCredentials={!!institution.darujme_api_id}
      />
    </div>
  )
}
