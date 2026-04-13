import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AnimalForm } from '@/components/admin/AnimalForm'

export default async function EditAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  /* ── Auth ── */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/admin/animals/${id}/edit`)

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

  const institutionType = String(rawInstitution.type) as 'shelter' | 'rescue_station'

  /* ── Animal ── */
  const { data: animal } = await service
    .from('animals')
    .select('*')
    .eq('id', id)
    .eq('institution_id', String(rawInstitution.id))
    .single()

  if (!animal) notFound()

  /* ── Species ── */
  const { data: speciesRows } = await service
    .from('animal_species')
    .select('id, name_cs')
    .order('name_cs')

  const species = (speciesRows ?? []).map((s) => ({
    id:      String(s.id),
    name_cs: String(s.name_cs),
    icon:    null as string | null,
  }))

  /* ── Status history ── */
  const { data: historyRows } = await service
    .from('animal_status_history')
    .select('id, status, changed_at, note, changed_by')
    .eq('animal_id', id)
    .order('changed_at', { ascending: false })

  const statusHistory = (historyRows ?? []).map((h) => ({
    id:         String(h.id),
    status:     String(h.status ?? ''),
    changed_at: String(h.changed_at),
    note:       h.note ? String(h.note) : undefined,
    changed_by: h.changed_by ? String(h.changed_by) : undefined,
  }))

  return (
    <AnimalForm
      institutionId={String(rawInstitution.id)}
      institutionType={institutionType}
      species={species}
      mode="edit"
      animal={animal as Record<string, unknown>}
      statusHistory={statusHistory}
      currentUser={{ id: user.id, name: user.email ?? '' }}
    />
  )
}
