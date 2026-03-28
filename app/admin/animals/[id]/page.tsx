import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import { AnimalForm } from '@/components/admin/AnimalForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAnimalPage({ params }: PageProps) {
  const { id } = await params
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
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const isShelter = institution.type === 'shelter'

  // Načti zvíře nebo záchranný případ
  const { data: animal } = isShelter
    ? await service.from('animals').select('*').eq('id', id).eq('institution_id', institution.id).single()
    : await service.from('rescue_cases').select('*').eq('id', id).eq('institution_id', institution.id).single()

  if (!animal) notFound()

  // Načti druhy
  const { data: species } = await service
    .from('animal_species')
    .select('id, name_cs, icon, category')
    .eq('category', isShelter ? 'domestic' : 'wild')
    .order('name_cs')

  // Načti historii stavů
  const { data: statusHistory } = await service
    .from('animal_status_history')
    .select('*')
    .eq(isShelter ? 'animal_id' : 'rescue_case_id', id)
    .order('changed_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/animals" className="text-sm text-gray hover:text-coral transition-colors font-semibold">
          ← Zpět na seznam
        </a>
        <span className="text-gray">·</span>
        <a href={isShelter ? `/animals/${id}` : `/rescue/${id}`} target="_blank"
          className="text-sm text-coral hover:text-coral-dark font-semibold transition-colors">
          Zobrazit na webu ↗
        </a>
      </div>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-8">
        {(animal as any).name ?? (animal as any).case_number}
      </h1>
      <AnimalForm
        institutionId={institution.id}
        institutionType={institution.type}
        species={species ?? []}
        mode="edit"
        animal={animal as any}
        statusHistory={statusHistory ?? []}
        currentUser={{ id: user.id, email: user.email ?? '' }}
      />
    </div>
  )
}
