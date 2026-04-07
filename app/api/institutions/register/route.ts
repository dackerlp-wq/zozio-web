import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      type, name, slug, city, street, postal_code,
      phone, website, description, short_description,
      email, password,
    } = body

    if (!type || !name || !city || !email || !password) {
      return NextResponse.json({ error: 'Chybí povinné údaje' }, { status: 400 })
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

    // Vytvoř uživatele
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
        name, slug, type, city,
        street:            street            || null,
        postal_code:       postal_code       || null,
        phone:             phone             || null,
        website:           website           || null,
        email,
        description:       description       || null,
        short_description: short_description || null,
        approval_status:   'pending',
        plan:              'free',
        country:           'CZ',
      })
      .select('id')
      .single()

    if (instError) throw instError

    // Přidej uživatele jako admina
    await service
      .from('institution_members')
      .insert({
        institution_id: institution.id,
        user_id:        userId,
        role:           'admin',
      })

    // ── FIX 3: Notifikace superadminovi ──────────────────────────────────
    try {
      // Najdi všechny superadminy
      const { data: superadmins } = await service
        .from('profiles')
        .select('id')
        .eq('role', 'superadmin')

      if (superadmins && superadmins.length > 0) {
        // Zjisti jejich e-maily
        const { data: usersData } = await service.auth.admin.listUsers()
        const superadminEmails = usersData?.users
          ?.filter(u => superadmins.some(s => s.id === u.id))
          ?.map(u => u.email)
          ?.filter(Boolean) ?? []

        // Pošli e-mail každému superadminovi
        const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        for (const superEmail of superadminEmails) {
          await resend.emails.send({
            from: 'Zozio <info@zozio.cz>',
            to:   superEmail as string,
            subject: `🏢 Nová registrace: ${name}`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
                <h2 style="color:#E8634A">Nová registrace instituce 🏢</h2>
                <p>Čeká na schválení:</p>
                <div style="background:#F5E6D3;border-radius:10px;padding:16px;margin:16px 0">
                  <strong>${name}</strong><br>
                  Typ: ${type === 'shelter' ? '🏠 Útulok' : '🚑 Záchranná stanice'}<br>
                  Město: ${city}<br>
                  E-mail: ${email}
                </div>
                <a href="${SITE}/superadmin/institutions?filter=pending"
                  style="display:inline-block;background:#E8634A;color:white;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:bold">
                  Schválit / zamítnout →
                </a>
              </div>
            `,
          })
        }
      }
    } catch (notifyError) {
      console.error('Superadmin notify error:', notifyError)
      // Neblokuj registraci kvůli e-mailu
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('POST /api/institutions/register error:', error)
    return NextResponse.json(
      { error: 'Registrace se nezdařila. Zkus to prosím znovu.' },
      { status: 500 }
    )
  }
}
