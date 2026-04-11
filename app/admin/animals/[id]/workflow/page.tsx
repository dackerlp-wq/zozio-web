import { notFound } from 'next/navigation'
import AnimalWorkflowDashboard from '@/components/admin/AnimalWorkflowDashboard'

// Placeholder data-fetching helpers.
// Replace these with real Supabase queries once auth + DB is wired up.
async function getAnimal(id: string): Promise<Record<string, unknown> | null> {
  // TODO: replace with createClient() from @/lib/supabase/server
  // const supabase = createClient()
  // const { data } = await supabase.from('animals').select('*').eq('id', id).single()
  // return data
  void id
  return null
}

async function getInstitution(_animalInstitutionId: string): Promise<{ id: string; name: string; type: string } | null> {
  // TODO: replace with real query
  return null
}

export default async function AnimalWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const animal = await getAnimal(id)

  if (!animal) {
    notFound()
  }

  const institutionId = String(animal.institution_id ?? '')
  const rawInstitution = await getInstitution(institutionId)
  const institution = rawInstitution ?? { id: institutionId, name: 'Neznámá instituce', type: 'shelter' }

  return (
    <div>
      <AnimalWorkflowDashboard animal={animal} institution={institution} />
    </div>
  )
}
