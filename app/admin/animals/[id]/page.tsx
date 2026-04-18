import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import AnimalWorkflowDashboard from '@/components/admin/AnimalWorkflowDashboard'

export default async function AnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ exit?: string }>
}) {
  const { id } = await params

  /* ── Auth ── */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/admin/animals/${id}`)

  const service = createServiceClient()

  /* ── Membership & institution ── */
  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: rawInstitution } = await service
    .from('institutions')
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()

  if (!rawInstitution) redirect('/admin/dashboard')

  /* ── Animal ── */
  const { data: animal } = await service
    .from('animals')
    .select('*')
    .eq('id', id)
    .eq('institution_id', String(rawInstitution.id))
    .single()

  if (!animal) notFound()

  /* ── Medical records ── */
  const { data: medRecords } = await service
    .from('animal_medical_records')
    .select('*')
    .eq('animal_id', id)
    .order('record_date', { ascending: false })

  return (
    <AnimalWorkflowDashboard
      animal={animal as Record<string, unknown>}
      institution={{
        id:   String(rawInstitution.id),
        name: String(rawInstitution.name),
        type: String(rawInstitution.type),
      }}
      medicalRecords={(medRecords ?? []) as Record<string, unknown>[]}
    />
  )
}
