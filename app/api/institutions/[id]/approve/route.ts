import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()

    // Ověř superadmin roli
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    const { status } = await request.json()

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Neplatný stav' }, { status: 400 })
    }

    const { error } = await service
      .from('institutions')
      .update({
        approval_status: status,
        approved_at:     status === 'approved' ? new Date().toISOString() : null,
        approved_by:     status === 'approved' ? user.id : null,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('POST /api/institutions/[id]/approve error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
