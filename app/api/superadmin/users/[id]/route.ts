import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function getSuperadminUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') return null
  return user
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const adminUser = await getSuperadminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    const validRoles = ['institution_admin', 'staff', 'public']
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Neplatná role' }, { status: 400 })
    }

    const service = createServiceClient()

    const { error } = await service
      .from('profiles')
      .update({ role })
      .eq('id', id)

    if (error) {
      console.error('PATCH /api/superadmin/users/[id] profile error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PATCH /api/superadmin/users/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const adminUser = await getSuperadminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    // Prevent self-deletion
    if (adminUser.id === id) {
      return NextResponse.json({ error: 'Nelze smazat vlastní účet' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    if (body.confirm !== true) {
      return NextResponse.json({ error: 'Potvrzení smazání je povinné' }, { status: 400 })
    }

    const service = createServiceClient()

    const { error } = await service.auth.admin.deleteUser(id)

    if (error) {
      console.error('DELETE /api/superadmin/users/[id] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/superadmin/users/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
