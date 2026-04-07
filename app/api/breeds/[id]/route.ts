import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// PUT /api/breeds/[id] — superadmin nebo vlastník instituce
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const { data: membership } = await service.from('institution_members').select('institution_id').eq('user_id', user.id).single()

  const body = await request.json()
  const allowed = ['name_cs','name_sk','origin_country','size_category','energy_level','hypoallergenic','description','profile']
  const payload: Record<string,unknown> = {}
  for (const key of allowed) {
    if (key in body) payload[key] = body[key]
  }

  // Check ownership: superadmin can edit global, staff can edit their own
  const { data: breed } = await service.from('animal_breeds').select('institution_id').eq('id', id).single()
  if (!breed) return NextResponse.json({ error: 'Nenalezeno' }, { status: 404 })

  const isSuperadmin = profile?.role === 'superadmin'
  const isOwner = breed.institution_id && breed.institution_id === membership?.institution_id

  if (!isSuperadmin && !isOwner) {
    return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })
  }

  const { data, error } = await service.from('animal_breeds').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/breeds/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const { data: membership } = await service.from('institution_members').select('institution_id').eq('user_id', user.id).single()

  const { data: breed } = await service.from('animal_breeds').select('institution_id').eq('id', id).single()
  if (!breed) return NextResponse.json({ error: 'Nenalezeno' }, { status: 404 })

  const isSuperadmin = profile?.role === 'superadmin'
  const isOwner = breed.institution_id && breed.institution_id === membership?.institution_id

  if (!isSuperadmin && !isOwner) {
    return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })
  }

  const { error } = await service.from('animal_breeds').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
