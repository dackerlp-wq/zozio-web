import { notFound } from 'next/navigation'

// Placeholder data-fetching helpers.
// Replace these with real Supabase queries once auth + DB is wired up.
async function getAnimal(id: string): Promise<Record<string, unknown> | null> {
  // TODO: implement
  void id
  return null
}

export default async function AnimalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const animal = await getAnimal(id)

  if (!animal) {
    notFound()
  }

  return (
    <div className="min-h-screen p-6">
      {/* Link to workflow view */}
      <a
        href={`/admin/animals/${id}/workflow`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-4 hover:opacity-75"
        style={{ color: '#185FA5' }}
      >
        ← Zpět na přehled
      </a>

      {/* TODO: AnimalForm component goes here */}
      <div>
        <p>Karta zvířete (id: {id})</p>
      </div>
    </div>
  )
}
