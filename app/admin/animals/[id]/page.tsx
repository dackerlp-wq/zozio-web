import { notFound } from 'next/navigation'
import AnimalWorkflowCard, { type Animal, type Institution } from '@/components/admin/AnimalWorkflowCard'
import ExitModalTrigger from '@/components/admin/ExitModalTrigger'

/* ─── Data fetching (placeholder — swap in Supabase later) ── */
async function getAnimal(id: string): Promise<Animal | null> {
  // TODO: const supabase = createClient(); const { data } = await supabase.from('animals').select('*').eq('id', id).single(); return data
  void id
  return null
}

async function getInstitution(institutionId: string): Promise<Institution | null> {
  // TODO: real query
  void institutionId
  return null
}

export default async function AnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ exit?: string }>
}) {
  const { id } = await params
  const { exit } = await searchParams

  const animal = await getAnimal(id)

  if (!animal) {
    notFound()
  }

  const institutionId = String(animal.institution_id ?? '')
  const rawInstitution = await getInstitution(institutionId)
  const institution: Institution = rawInstitution ?? { id: institutionId, name: 'Neznámá instituce', type: 'shelter' }

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
