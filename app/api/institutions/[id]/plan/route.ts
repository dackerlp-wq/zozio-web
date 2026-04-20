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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

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

    const { plan, months } = await request.json()

    if (!['free', 'standard', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Neplatný plán' }, { status: 400 })
    }

    // plan_expires_at: free = null, jinak now + měsíce
    let plan_expires_at: string | null = null
    if (plan !== 'free') {
      const exp = new Date()
      exp.setMonth(exp.getMonth() + Number(months ?? 12))
      plan_expires_at = exp.toISOString()
    }

    const { error: updateError } = await service
      .from('institutions')
      .update({ plan, plan_expires_at, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, plan, plan_expires_at })

  } catch (error) {
    console.error('POST /api/institutions/[id]/plan error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
