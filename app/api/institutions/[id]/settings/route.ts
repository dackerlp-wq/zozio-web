import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()

    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const body = await request.json()

    const { error } = await service
      .from('institutions')
      .update({
        name:              body.name,
        short_description: body.short_description || null,
        description:       body.description       || null,
        email:             body.email,
        phone:             body.phone             || null,
        website:           body.website           || null,
        street:            body.street            || null,
        city:              body.city,
        postal_code:       body.postal_code       || null,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/institutions/[id]/settings error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
