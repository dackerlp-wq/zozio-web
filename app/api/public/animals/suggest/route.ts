import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const params    = new URL(req.url).searchParams
  const q         = params.get('q')?.trim()
  const speciesId = params.get('species') ?? ''

  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = createServiceClient()

  let query = supabase
    .from('animals')
    .select('id, name, breed, species:animal_species(name_cs, icon)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .or('in_quarantine.is.null,in_quarantine.eq.false')
    .or(`name.ilike.%${q}%,breed.ilike.%${q}%`)
    .limit(6) as any

  if (speciesId) query = query.eq('species_id', speciesId)

  const { data } = await query

  return NextResponse.json(
    (data ?? []).map((a: any) => ({
      id:    a.id,
      label: a.name ?? '—',
      sub:   [a.species?.name_cs, a.breed].filter(Boolean).join(' · '),
      icon:  a.species?.icon ?? null,
    }))
  )
}
