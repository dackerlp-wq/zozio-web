import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    // Ověř superadmin roli přes service client
    const service = createServiceClient()
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Chyba načtení profilu' }, { status: 500 })
    }

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    // Načti status z body
    const body = await request.json()
    const { status } = body

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Neplatný stav' }, { status: 400 })
    }

    // Aktualizuj instituci
    const { error: updateError } = await service
      .from('institutions')
      .update({
        approval_status: status,
        approved_at:     status === 'approved' ? new Date().toISOString() : null,
        approved_by:     status === 'approved' ? user.id : null,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Institution update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('POST /api/institutions/[id]/approve error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
