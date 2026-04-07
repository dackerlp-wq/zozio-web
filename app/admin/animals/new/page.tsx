import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { AnimalForm } from '@/components/admin/AnimalForm'

export default async function NewAnimalPage() {
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

  const { data: species } = await service
    .from('animal_species')
    .select('id, name_cs, icon, category')
    .eq('category', institution.type === 'shelter' ? 'domestic' : 'wild')
    .order('name_cs')

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <a href="/admin/animals" className="text-sm text-gray hover:text-coral transition-colors font-semibold">
          ← Zpět na seznam
        </a>
      </div>
      <h1 className="font-display font-extrabold text-4xl text-espresso mb-8">
        {institution.type === 'shelter' ? '🐾 Přidat zvíře' : '🦉 Nový pacient'}
      </h1>
      <AnimalForm
        institutionId={institution.id}
        institutionType={institution.type}
        species={species ?? []}
        mode="create"
      />
    </div>
  )
}
