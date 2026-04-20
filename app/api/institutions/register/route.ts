import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendWelcomeEmail } from '@/lib/email/send'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function uniqueSlug(service: ReturnType<typeof createServiceClient>, base: string): Promise<string> {
  const start = base || 'utulek'
  let slug = start
  for (let i = 1; i <= 50; i++) {
    const { data } = await service.from('institutions').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${start}-${i}`
  }
  return `${start}-${Date.now().toString(36)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id, email, name, city,
      phone, website, short_description,
    } = body

    if (!user_id || !email || !name || !city) {
      return NextResponse.json(
        { error: 'Chybí povinné údaje (jméno, město, e-mail).' },
        { status: 400 },
      )
    }

    const service = createServiceClient()

    // Ověř že user_id skutečně patří k tomuto e-mailu (anti-spoofing)
    const { data: userLookup, error: lookupError } = await service.auth.admin.getUserById(user_id)
    if (lookupError || !userLookup?.user || userLookup.user.email?.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json({ error: 'Neplatný uživatel.' }, { status: 403 })
    }

    // Pokud user už má instituci, vrať existující (idempotence)
    const { data: existingMember } = await service
      .from('institution_members')
      .select('institution_id')
      .eq('user_id', user_id)
      .maybeSingle()

    if (existingMember?.institution_id) {
      return NextResponse.json({ success: true, institution_id: existingMember.institution_id, existed: true })
    }

    const slug = await uniqueSlug(service, slugify(name))

    const { data: institution, error: instError } = await service
      .from('institutions')
      .insert({
        name,
        slug,
        type:              'shelter',
        city,
        phone:             phone || null,
        website:           website || null,
        email,
        short_description: short_description || null,
        approval_status:   'pending',
        plan:              'free',
        country:           'CZ',
      })
      .select('id, name, slug, city')
      .single()

    if (instError || !institution) {
      console.error('institution insert failed:', instError)
      return NextResponse.json({ error: 'Nelze vytvořit instituci. Zkuste to prosím později.' }, { status: 500 })
    }

    const { error: memberError } = await service
      .from('institution_members')
      .insert({
        institution_id: institution.id,
        user_id,
        role:           'admin',
      })

    if (memberError) {
      await service.from('institutions').delete().eq('id', institution.id)
      console.error('member insert failed:', memberError)
      return NextResponse.json({ error: 'Nelze dokončit registraci. Zkuste to prosím později.' }, { status: 500 })
    }

    // Welcome email útulku
    try {
      await sendWelcomeEmail({
        to:              email,
        contactName:     name,
        institutionName: name,
        email,
      })
    } catch (err) {
      console.error('Welcome email failed:', err)
    }

    // Notifikace superadminům
    try {
      const { data: superadmins } = await service
        .from('profiles')
        .select('id')
        .eq('role', 'superadmin')

      if (superadmins && superadmins.length > 0) {
        const { data: usersData } = await service.auth.admin.listUsers()
        const superadminEmails = (usersData?.users ?? [])
          .filter(u => superadmins.some(s => s.id === u.id))
          .map(u => u.email)
          .filter((e): e is string => !!e)

        if (superadminEmails.length > 0) {
          const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.zozio.cz'
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)

          await Promise.all(superadminEmails.map(to =>
            resend.emails.send({
              from: 'Zozio <info@zozio.cz>',
              to,
              subject: `🏢 Nová registrace: ${name}`,
              html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
                  <h2 style="color:#E8634A">Nová registrace instituce 🏢</h2>
                  <p>Čeká na schválení:</p>
                  <div style="background:#F5E6D3;border-radius:10px;padding:16px;margin:16px 0">
                    <strong>${name}</strong><br>
                    Typ: 🏠 Útulek<br>
                    Město: ${city}<br>
                    E-mail: ${email}
                    ${phone ? `<br>Telefon: ${phone}` : ''}
                    ${website ? `<br>Web: ${website}` : ''}
                  </div>
                  <a href="${SITE}/superadmin/institutions?filter=pending"
                    style="display:inline-block;background:#E8634A;color:white;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:bold">
                    Schválit / zamítnout →
                  </a>
                </div>
              `,
            }),
          ))
        }
      }
    } catch (notifyError) {
      console.error('Superadmin notify error:', notifyError)
    }

    return NextResponse.json({
      success:        true,
      institution_id: institution.id,
      slug:           institution.slug,
    })

  } catch (error) {
    console.error('POST /api/institutions/register error:', error)
    return NextResponse.json(
      { error: 'Registrace se nezdařila. Zkuste to prosím znovu.' },
      { status: 500 },
    )
  }
}
