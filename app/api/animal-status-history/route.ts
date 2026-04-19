import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const body = await request.json()
    const service = createServiceClient()

    await service.from('animal_status_history').insert({
      animal_id:  body.animal_id  ?? null,
      old_status: body.old_status ?? null,
      new_status: body.new_status,
      note:       body.note       ?? null,
      action:     body.action     ?? 'update',
      changed_by: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/animal-status-history error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
