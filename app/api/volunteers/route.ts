import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.institution_id || !body.name || !body.email) {
      return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 })
    }

    const service = createServiceClient()

    // Zkontroluj duplicitu
    const { data: existing } = await service
      .from('volunteers')
      .select('id')
      .eq('institution_id', body.institution_id)
      .eq('email', body.email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Tento e-mail je již zaregistrován jako dobrovolník' },
        { status: 409 }
      )
    }

    const { data, error } = await service
      .from('volunteers')
      .insert({
        institution_id: body.institution_id,
        name:           body.name,
        email:          body.email,
        phone:          body.phone    || null,
        activities:     body.activities ?? [],
        message:        body.message  || null,
        status:         'pending',
      })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/volunteers error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
