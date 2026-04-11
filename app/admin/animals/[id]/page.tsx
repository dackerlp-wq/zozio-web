import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import AnimalWorkflowCard, { type Animal, type Institution } from '@/components/admin/AnimalWorkflowCard'
import ExitModalTrigger from '@/components/admin/ExitModalTrigger'

export default async function AnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ exit?: string; scan?: string }>
}) {
  const { id }    = await params
  const { exit }  = await searchParams

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

  const institution: Institution = {
    id:   String(rawInstitution.id),
    name: String(rawInstitution.name),
    type: String(rawInstitution.type),
  }

  /* ── Animal ── */
  const { data: rawAnimal } = await service
    .from('animals')
    .select('*')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!rawAnimal) notFound()

  const animal = rawAnimal as unknown as Animal

  return (
    <>
      <AnimalWorkflowCard animal={animal} institution={institution} />
      {exit === '1' && (
        <ExitModalTrigger
          animalId={id}
          animalName={String(animal.name ?? 'Zvíře')}
          evidenceNumber={String(animal.evidence_number ?? '—')}
        />
      )}
    </>
  )
}
