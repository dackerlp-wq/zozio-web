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

    // Připrav payload — pouze povolená pole
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Textová pole
    if (body.name              !== undefined) payload.name              = body.name
    if (body.short_description !== undefined) payload.short_description = body.short_description || null
    if (body.description       !== undefined) payload.description       = body.description       || null
    if (body.email             !== undefined) payload.email             = body.email
    if (body.phone             !== undefined) payload.phone             = body.phone             || null
    if (body.website           !== undefined) payload.website           = body.website           || null
    if (body.street            !== undefined) payload.street            = body.street            || null
    if (body.city              !== undefined) payload.city              = body.city
    if (body.postal_code       !== undefined) payload.postal_code       = body.postal_code       || null

    // Obrázky
    if (body.logo_url          !== undefined) payload.logo_url          = body.logo_url          || null
    if (body.cover_url         !== undefined) payload.cover_url         = body.cover_url         || null

    // GPS souřadnice s validací rozsahu
    if (body.lat !== undefined) {
      const lat = body.lat ? parseFloat(body.lat) : NaN
      payload.lat = !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : null
    }
    if (body.lng !== undefined) {
      const lng = body.lng ? parseFloat(body.lng) : NaN
      payload.lng = !isNaN(lng) && lng >= -180 && lng <= 180 ? lng : null
    }

    const { error } = await service
      .from('institutions')
      .update(payload)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/institutions/[id]/settings error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
