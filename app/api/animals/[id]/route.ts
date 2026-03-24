import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function checkAccess(userId: string, animalId: string, service: ReturnType<typeof createServiceClient>) {
  const { data: animal } = await service
    .from('animals')
    .select('institution_id')
    .eq('id', animalId)
    .single()

  if (!animal) return null

  const { data: membership } = await service
    .from('institution_members')
    .select('role')
    .eq('user_id', userId)
    .eq('institution_id', animal.institution_id)
    .single()

  return membership ? animal : null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    const animal = await checkAccess(user.id, id, service)
    if (!animal) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const body = await request.json()
    const { error } = await service
      .from('animals')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/animals/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    const animal = await checkAccess(user.id, id, service)
    if (!animal) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { error } = await service.from('animals').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/animals/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
