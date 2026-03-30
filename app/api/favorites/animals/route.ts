import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/favorites/animals  { animal_id }  → toggle
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { animal_id } = await request.json()
  if (!animal_id) return NextResponse.json({ error: 'Chybí animal_id' }, { status: 400 })

  // Zkus smazat — pokud existuje, odstraní. Pokud ne, vrátí 0 rows.
  const { count } = await supabase
    .from('animal_favorites')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)
    .eq('animal_id', animal_id)

  if (count && count > 0) {
    return NextResponse.json({ favorited: false })
  }

  // Přidat
  await supabase.from('animal_favorites').insert({ user_id: user.id, animal_id })
  return NextResponse.json({ favorited: true })
}

// GET /api/favorites/animals?animal_id=xxx  → { favorited: bool }
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ favorited: false })

  const animal_id = request.nextUrl.searchParams.get('animal_id')
  if (!animal_id) return NextResponse.json({ favorited: false })

  const { data } = await supabase
    .from('animal_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('animal_id', animal_id)
    .maybeSingle()

  return NextResponse.json({ favorited: !!data })
}
