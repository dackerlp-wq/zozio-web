import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import NewAnimalWizard from '@/components/admin/NewAnimalWizard'

export default async function NewAnimalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/animals/new')

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

  const { data: speciesRows } = await service
    .from('animal_species')
    .select('id, name_cs')
    .order('name_cs')

  const species = (speciesRows ?? []).map(s => ({ id: String(s.id), name_cs: String(s.name_cs) }))

  return <NewAnimalWizard institutionId={String(institution.id)} species={species} />
}
