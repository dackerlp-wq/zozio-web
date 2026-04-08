import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/breeds?species_id=xxx
export async function GET(request: NextRequest) {
  const speciesId = request.nextUrl.searchParams.get('species_id')
  const q         = request.nextUrl.searchParams.get('q') ?? ''

  const service = createServiceClient()

  let query = service
    .from('animal_breeds')
    .select('id, name_cs, size_category, energy_level, hypoallergenic, description, is_custom, institution_id')
    .order('name_cs')

  if (speciesId) query = query.eq('species_id', speciesId)
  if (q)         query = query.ilike('name_cs', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/breeds — přidá vlastní plemeno k instituci
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

  const body = await request.json()
  const { species_id, name_cs, name_sk, origin_country, size_category, energy_level, hypoallergenic, description, profile } = body

  if (!species_id || !name_cs?.trim()) {
    return NextResponse.json({ error: 'Chybí species_id nebo name_cs' }, { status: 400 })
  }

  const { data, error } = await service
    .from('animal_breeds')
    .insert({
      species_id,
      name_cs: name_cs.trim(),
      name_sk: name_sk?.trim() || null,
      origin_country: origin_country?.trim() || null,
      size_category: size_category || null,
      energy_level: energy_level || null,
      hypoallergenic: hypoallergenic ?? false,
      description: description?.trim() || null,
      profile: profile ?? null,
      institution_id: membership.institution_id,
      is_custom: true,
    })
    .select('id, name_cs')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
