import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const service = createServiceClient()

    const { data: membership } = await service
      .from('institution_members')
      .select('institution_id')
      .eq('user_id', user.id)
      .single()
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: institution } = await service
      .from('institutions')
      .select('name, plan, plan_expires_at')
      .eq('id', membership.institution_id)
      .single()

    const { subject, message, category } = await request.json()

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Vyplňte předmět a zprávu' }, { status: 400 })
    }

    const plan = (institution as any)?.plan ?? 'free'
    const planLabel = plan === 'pro' ? '[PRO]' : plan === 'standard' ? '[Standard]' : '[Free]'
    const instName = (institution as any)?.name ?? '—'

    // Odeslání e-mailu přes Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Zozio Support <noreply@zozio.cz>',
      to: 'team@zozio.cz',
      replyTo: user.email ?? undefined,
      subject: `${planLabel} ${subject} — ${instName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#2C1810">Nový support ticket</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr><td style="padding:4px 8px;font-weight:bold;color:#8B6550;width:140px">Instituce</td><td style="padding:4px 8px">${instName}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold;color:#8B6550">Plán</td><td style="padding:4px 8px">${plan.toUpperCase()}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold;color:#8B6550">Odesílatel</td><td style="padding:4px 8px">${user.email}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold;color:#8B6550">Kategorie</td><td style="padding:4px 8px">${category ?? '—'}</td></tr>
          </table>
          <h3 style="color:#2C1810">${subject}</h3>
          <div style="background:#FFFCF8;border-left:3px solid #E8634A;padding:12px 16px;border-radius:4px;white-space:pre-wrap">${message}</div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Support ticket error:', error)
    return NextResponse.json({ error: 'Nepodařilo se odeslat zprávu' }, { status: 500 })
  }
}
