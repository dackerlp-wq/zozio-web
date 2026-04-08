import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

    // Ověř přístup
    const { data: volunteer } = await service
      .from('volunteers')
      .select('institution_id')
      .eq('id', id)
      .single()

    if (!volunteer) return NextResponse.json({ error: 'Nenalezeno' }, { status: 404 })

    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', volunteer.institution_id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const body = await request.json()
    const validStatuses = ['pending', 'active', 'inactive', 'rejected']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Neplatný stav' }, { status: 400 })
    }

    const { error } = await service
      .from('volunteers')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/volunteers/[id] error:', error)
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

    const { data: volunteer } = await service
      .from('volunteers')
      .select('institution_id')
      .eq('id', id)
      .single()

    if (!volunteer) return NextResponse.json({ error: 'Nenalezeno' }, { status: 404 })

    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', volunteer.institution_id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { error } = await service.from('volunteers').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/volunteers/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
