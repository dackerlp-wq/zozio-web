import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.institution_id || !body.name || !body.email) {
      return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 })
    }

    // Zjisti přihlášeného uživatele (nepovinné — lze se přihlásit i bez účtu z profilu instituce)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const service = createServiceClient()

    // Zkontroluj duplicitu (podle emailu nebo user_id)
    let duplicateQuery = service
      .from('volunteers')
      .select('id')
      .eq('institution_id', body.institution_id)

    if (user) {
      duplicateQuery = duplicateQuery.or(`email.eq.${body.email},user_id.eq.${user.id}`)
    } else {
      duplicateQuery = duplicateQuery.eq('email', body.email)
    }

    const { data: existing } = await duplicateQuery.maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Přihláška pro tuto organizaci již existuje' },
        { status: 409 }
      )
    }

    const { data, error } = await service
      .from('volunteers')
      .insert({
        institution_id:    body.institution_id,
        user_id:           user?.id ?? null,
        name:              body.name,
        email:             body.email,
        phone:             body.phone     || null,
        activities:        body.activities ?? [],
        availability_data: body.availability_data ?? null,
        message:           body.message   || null,
        status:            'pending',
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
