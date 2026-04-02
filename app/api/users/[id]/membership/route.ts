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

  // Upsert — změní instituci i roli najednou
  const { error } = await service
    .from('institution_members')
    .upsert(
      { user_id: targetUserId, institution_id: institutionId, role },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('Membership upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
