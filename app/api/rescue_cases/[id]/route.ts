import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function checkAccess(userId: string, caseId: string, service: ReturnType<typeof createServiceClient>) {
  const { data: rc } = await service
    .from('rescue_cases')
    .select('institution_id')
    .eq('id', caseId)
    .single()

  if (!rc) return null

  const { data: membership } = await service
    .from('institution_members')
    .select('role')
    .eq('user_id', userId)
    .eq('institution_id', rc.institution_id)
    .single()

  return membership ? rc : null
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
    const rc = await checkAccess(user.id, id, service)
    if (!rc) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const body = await request.json()
    const { error } = await service
      .from('rescue_cases')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/rescue_cases/[id] error:', error)
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
    const rc = await checkAccess(user.id, id, service)
    if (!rc) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { error } = await service.from('rescue_cases').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/rescue_cases/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
