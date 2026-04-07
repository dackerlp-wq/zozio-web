import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Zjisti instituci přihlášeného uživatele
  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'No institution' }, { status: 403 })

  const body = await request.json()
  const cities: string[] = Array.isArray(body.coverage_cities)
    ? body.coverage_cities.map((c: string) => c.trim()).filter(Boolean)
    : []

  const { error } = await service
    .from('institutions')
    .update({ coverage_cities: cities })
    .eq('id', membership.institution_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, coverage_cities: cities })
}
