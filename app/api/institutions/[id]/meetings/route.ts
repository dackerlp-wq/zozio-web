import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Vrátí nadcházející potvrzené schůzky instituce (pro overlap check při plánování)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()

    // Ověř, že uživatel patří k instituci
    const { data: member } = await service
      .from('institution_members')
      .select('role')
      .eq('institution_id', id)
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })

    const { data: meetings } = await service
      .from('adoption_applications')
      .select('id, meeting_at, meeting_options, applicant_name, animal:animals(name)')
      .eq('institution_id', id)
      .eq('status', 'meeting_scheduled')
      .not('meeting_at', 'is', null)
      .gte('meeting_at', new Date().toISOString())
      .order('meeting_at', { ascending: true })

    return NextResponse.json({ meetings: meetings ?? [] })

  } catch (error) {
    console.error('GET /api/institutions/[id]/meetings error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
