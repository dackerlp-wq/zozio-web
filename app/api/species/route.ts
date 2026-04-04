import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// POST /api/species — přidá vlastní druh zvířete
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const body = await request.json()
  const { name_cs, category } = body

  if (!name_cs?.trim()) {
    return NextResponse.json({ error: 'Chybí název druhu' }, { status: 400 })
  }
  if (!category || !['domestic','wild'].includes(category)) {
    return NextResponse.json({ error: 'Neplatná kategorie' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check if already exists
  const { data: existing } = await service
    .from('animal_species')
    .select('id, name_cs')
    .ilike('name_cs', name_cs.trim())
    .eq('category', category)
    .single()

  if (existing) {
    return NextResponse.json(existing)
  }

  const { data, error } = await service
    .from('animal_species')
    .insert({ name_cs: name_cs.trim(), category, icon: '🐾' })
    .select('id, name_cs')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
