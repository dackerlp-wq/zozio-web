import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import NewAnimalWizard from '@/components/admin/NewAnimalWizard'
import { UpgradePrompt } from '@/components/admin/UpgradePrompt'
import { canAddAnimal, FREE_ANIMALS_LIMIT } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

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
    .select('id, name, type, plan, plan_expires_at')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const plan       = (institution as any).plan as SubscriptionPlan ?? 'free'
  const expiresAt  = (institution as any).plan_expires_at as string | null

  // Počet aktivních zvířat (ne archiv)
  const { count: activeCount } = await service
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institution.id)
    .not('adoption_status', 'in', '(adopted,deceased)')

  const count = activeCount ?? 0

  if (!canAddAnimal(plan, expiresAt, count)) {
    return (
      <UpgradePrompt
        feature="unlimited_animals"
        title={`Dosáhli jste limitu ${FREE_ANIMALS_LIMIT} zvířat`}
        description={`Plán Free umožňuje evidovat maximálně ${FREE_ANIMALS_LIMIT} aktivních zvířat. Upgradujte na Standard nebo Pro a přidávejte neomezené množství zvířat.`}
      />
    )
  }

  const { data: speciesRows } = await service
    .from('animal_species')
    .select('id, name_cs')
    .order('name_cs')

  const species = (speciesRows ?? []).map(s => ({ id: String(s.id), name_cs: String(s.name_cs) }))

  return <NewAnimalWizard institutionId={String(institution.id)} species={species} />
}
