import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import { AnimalForm } from '@/components/admin/AnimalForm'
import { ScanRedirect } from '@/components/admin/ScanRedirect'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scan?: string }>
}

export default async function EditAnimalPage({ params, searchParams }: PageProps) {
  const { id }   = await params
  const { scan } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Pokud přišel přes QR a není přihlášen → přihlašovací stránka s redirect
  if (!user) {
    redirect(`/auth/login?next=/admin/animals/${id}`)
  }

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

  const { data: animal } = await service
    .from('animals')
    .select('*')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!animal) notFound()

  const { data: species } = await service
    .from('animal_species')
    .select('id, name_cs, icon, category')
    .eq('category', isShelter ? 'domestic' : 'wild')
    .order('name_cs')

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: statusHistory } = await service
    .from('animal_status_history')
    .select('*')
    .eq('animal_id', id)
    .gte('changed_at', threeMonthsAgo.toISOString())
    .order('changed_at', { ascending: false })

  const a = animal as any

  return (
    <div>
      {/* Pokud přišlo přes QR → zobraz flash banner */}
      {scan === '1' && <ScanRedirect animalName={a.name ?? a.case_number} />}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/admin/animals" className="text-sm text-gray hover:text-coral transition-colors font-semibold">
            ← Zpět
          </a>
          <span className="text-gray">·</span>
          <a
            href={isShelter ? `/animals/${id}` : `/rescue/${id}`}
            target="_blank"
            className="text-sm text-coral hover:text-coral-dark font-semibold transition-colors"
          >
            Web ↗
          </a>
        </div>

        {/* QR tlačítko */}
        <a
          href={`/admin/animals/${id}/qr`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-espresso text-white font-display font-bold text-sm rounded-sm hover:bg-brown transition-colors no-underline"
        >
          <span>▣</span> QR karta
        </a>
      </div>

      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-8">
        {a.name ?? a.case_number}
      </h1>

      <AnimalForm
        institutionId={institution.id}
        institutionType={institution.type}
        species={species ?? []}
        mode="edit"
        animal={animal as any}
        statusHistory={statusHistory ?? []}
        currentUser={{ id: user.id, name: user.email ?? '' }}
      />
    </div>
  )
}
