import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  const service = createServiceClient()

  // Ověř superadmin roli volajícího
  const { data: callerProfile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
  }

  // Nelze odebrat vlastní superadmin roli
  if (id === user.id) {
    return NextResponse.json({ error: 'Nemůžeš změnit vlastní roli' }, { status: 400 })
  }

  const { superadmin } = await request.json() as { superadmin: boolean }

  // profiles.role může být pouze 'superadmin' nebo null — jiné hodnoty porušují constraint
  const { error } = await service
    .from('profiles')
    .upsert(
      { id, role: superadmin ? 'superadmin' : null },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('User role update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
