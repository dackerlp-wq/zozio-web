import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const service = createServiceClient()

    // Ověř superadmin roli
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    const { status } = await request.json()

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Neplatný stav' }, { status: 400 })
    }

    // Načti instituci pro email
    const { data: institution, error: instError } = await service
      .from('institutions')
      .select('id, name, email, type, plan')
      .eq('id', id)
      .single()

    if (instError || !institution) {
      return NextResponse.json({ error: 'Instituce nenalezena' }, { status: 404 })
    }

    // Aktualizuj stav
    const { error: updateError } = await service
      .from('institutions')
      .update({
        approval_status: status,
        approved_at:     status === 'approved' ? new Date().toISOString() : null,
        approved_by:     status === 'approved' ? user.id : null,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Institution update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Pošli email
    if (institution.email) {
      try {
        if (status === 'approved') {
          const { sendApprovalEmail } = await import('@/lib/email/send')
          await sendApprovalEmail({
            to:              institution.email,
            contactName:     institution.name,
            institutionName: institution.name,
            plan:            institution.plan ?? 'free',
            adminUrl:        `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login`,
          })
        } else {
          const { sendRejectionEmail } = await import('@/lib/email/send')
          await sendRejectionEmail({
            to:              institution.email,
            contactName:     institution.name,
            institutionName: institution.name,
            reason:          'Vaše registrace nesplňuje podmínky platformy Zozio.',
            editUrl:         `${process.env.NEXT_PUBLIC_SITE_URL}/auth/register`,
          })
        }
      } catch (emailError) {
        // Email selhal — neblokuj response, jen zaloguj
        console.error('Email send error:', emailError)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('POST /api/institutions/[id]/approve error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
