import { redirect } from 'next/navigation'

// /admin/animals/[id]/workflow was consolidated into /admin/animals/[id]
export default async function WorkflowRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/animals/${id}`)
}
