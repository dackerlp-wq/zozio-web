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

  const isShelter = institution.type === 'shelter'

  return (
    <>
      {/* ── Akční tlačítka ── */}
      <div className="max-w-[900px] mx-auto px-4 pt-4 pb-0 flex flex-wrap gap-2">
        <a
          href={`/admin/animals/${id}/pdf`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-[#6B4030] font-bold text-sm hover:border-[#E8634A] transition-colors"
          style={{ textDecoration: 'none' }}
        >
          📄 PDF karta
        </a>
        <a
          href={`/admin/animals/${id}/pdf/records`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-[#6B4030] font-bold text-sm hover:border-[#E8634A] transition-colors"
          style={{ textDecoration: 'none' }}
        >
          📋 Zákonná evidence
        </a>
        {isShelter && (
          <a
            href={`/admin/animals/${id}/pdf/adoption`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-[#6B4030] font-bold text-sm hover:border-[#E8634A] transition-colors"
            style={{ textDecoration: 'none' }}
          >
            🤝 Adopční smlouva
          </a>
        )}
        <a
          href={`/admin/animals/${id}/qr`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-[#6B4030] font-bold text-sm hover:border-[#E8634A] transition-colors"
          style={{ textDecoration: 'none' }}
        >
          ▣ QR karta
        </a>
        <a
          href={`/admin/animals/${id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-[#6B4030] font-bold text-sm hover:border-[#E8634A] transition-colors"
          style={{ textDecoration: 'none' }}
        >
          ✏️ Upravit info
        </a>
        <a
          href="/admin/animals"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-[#6B4030] font-bold text-sm hover:border-[#E8634A] transition-colors"
          style={{ textDecoration: 'none' }}
        >
          ← Zpět
        </a>
      </div>

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
