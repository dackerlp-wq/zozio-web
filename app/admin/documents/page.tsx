import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import DocumentsPage from '@/components/admin/DocumentsPage'

export default async function AdminDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/documents')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const { data: rawAnimals } = await service
    .from('animals')
    .select('id, name, intake_date, adoption_status')
    .eq('institution_id', institution.id)
    .order('intake_date', { ascending: false })

  const animals = (rawAnimals ?? []).map(a => ({
    id: String(a.id),
    name: String(a.name ?? 'Bez jména'),
    intake_date: a.intake_date ? String(a.intake_date) : null,
    adoption_status: a.adoption_status ? String(a.adoption_status) : null,
  }))

  return (
    <DocumentsPage
      animals={animals}
      institutionType={institution.type as 'shelter' | 'rescue_station'}
      institutionName={institution.name}
      institutionId={String(institution.id)}
    />
  )
}
