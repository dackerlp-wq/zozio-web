import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { institution_id } = await request.json()
  if (!institution_id) return NextResponse.json({ error: 'Chybí institution_id' }, { status: 400 })

  const { count } = await supabase
    .from('institution_favorites')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)
    .eq('institution_id', institution_id)

  if (count && count > 0) return NextResponse.json({ favorited: false })

  await supabase.from('institution_favorites').insert({ user_id: user.id, institution_id })
  return NextResponse.json({ favorited: true })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ favorited: false })

  const institution_id = request.nextUrl.searchParams.get('institution_id')
  if (!institution_id) return NextResponse.json({ favorited: false })

  const { data } = await supabase
    .from('institution_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('institution_id', institution_id)
    .maybeSingle()

  return NextResponse.json({ favorited: !!data })
}
