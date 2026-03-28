import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      type, name, slug, city, street, postal_code,
      phone, website, description, short_description,
      email, password,
    } = body

    // Validace
    if (!type || !name || !city || !email || !password) {
      return NextResponse.json(
        { error: 'Chybí povinné údaje' },
        { status: 400 }
      )
    }

    if (!['shelter', 'rescue_station'].includes(type)) {
      return NextResponse.json({ error: 'Neplatný typ instituce' }, { status: 400 })
    }

    const service = createServiceClient()

    // Zkontroluj duplicitní slug
    const { data: existing } = await service
      .from('institutions')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Instituce s tímto názvem již existuje' },
        { status: 409 }
      )
    }

    // Vytvoř uživatele v Supabase Auth
    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Účet s tímto e-mailem již existuje' },
          { status: 409 }
        )
      }
      throw authError
    }

    const userId = authData.user.id

    // Vytvoř instituci
    const { data: institution, error: instError } = await service
      .from('institutions')
      .insert({
        name,
        slug,
        type,
        city,
        street:            street || null,
        postal_code:       postal_code || null,
        phone:             phone || null,
        website:           website || null,
        email,
        description:       description || null,
        short_description: short_description || null,
        approval_status:   'pending',
        plan:              'free',
        country:           'CZ',
      })
      .select('id')
      .single()

    if (instError) throw instError

    // Přidej uživatele jako admina instituce
    await service
      .from('institution_members')
      .insert({
        institution_id: institution.id,
        user_id:        userId,
        role:           'admin',
      })

    // Pošli vítací email (fire & forget)
    sendWelcomeEmail({
      to:              email,
      contactName:     name,
      institutionName: name,
      institutionType: type,
      email:           email,
    }).catch(err => console.error('sendWelcomeEmail failed:', err))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('POST /api/institutions/register error:', error)
    return NextResponse.json(
      { error: 'Registrace se nezdařila. Zkus to prosím znovu.' },
      { status: 500 }
    )
  }
}
