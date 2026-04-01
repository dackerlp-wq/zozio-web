import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const body = await request.json()
    if (!body.name || !body.institution_id) {
      return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 })
    }

    const service = createServiceClient()

    // Ověř přístup
    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', body.institution_id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { data, error } = await service
      .from('animals')
      .insert(body)
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/animals error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
