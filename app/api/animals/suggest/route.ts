import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json([], { status: 403 })

  const { data: institution } = await service
    .from('institutions')
    .select('id, type')
    .eq('id', membership.institution_id)
    .single()
  if (!institution) return NextResponse.json([])

  const isShelter = institution.type === 'shelter'

  if (isShelter) {
    const { data } = await service
      .from('animals')
      .select('id, name, breed, chip_number, species:animal_species(name_cs)')
      .eq('institution_id', institution.id)
      .or(`name.ilike.%${q}%,breed.ilike.%${q}%,chip_number.ilike.%${q}%`)
      .limit(6)

    return NextResponse.json(
      (data ?? []).map((a: any) => ({
        id: a.id,
        label: a.name ?? '—',
        sub: [a.species?.name_cs, a.breed].filter(Boolean).join(' · '),
      }))
    )
  } else {
    const { data } = await service
      .from('rescue_cases')
      .select('id, name, case_number, species:animal_species(name_cs)')
      .eq('institution_id', institution.id)
      .or(`name.ilike.%${q}%,case_number.ilike.%${q}%`)
      .limit(6)

    return NextResponse.json(
      (data ?? []).map((a: any) => ({
        id: a.id,
        label: a.name ?? a.case_number ?? '—',
        sub: [a.species?.name_cs, a.case_number].filter(Boolean).join(' · '),
      }))
    )
  }
}
