import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// PATCH /api/users/[id]/membership
// Body: { institutionId: string, role: 'admin' | 'staff' }  — přiřadit/změnit členství
// Body: { remove: true }                                     — odebrat členství
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: callerProfile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
  }

  const body = await request.json()

  // Odebrat členství
  if (body.remove) {
    const { error } = await service
      .from('institution_members')
      .delete()
      .eq('user_id', targetUserId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { institutionId, role } = body as { institutionId: string; role: 'admin' | 'staff' }

  if (!institutionId || !['admin', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'Neplatné parametry' }, { status: 400 })
  }

  // Zkus update existujícího záznamu
  const { data: existing } = await service
    .from('institution_members')
    .select('id')
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (existing) {
    const { error } = await service
      .from('institution_members')
      .update({ institution_id: institutionId, role })
      .eq('user_id', targetUserId)
    if (error) {
      console.error('Membership update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await service
      .from('institution_members')
      .insert({ user_id: targetUserId, institution_id: institutionId, role })
    if (error) {
      console.error('Membership insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
