import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

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

    const { status, reason } = await request.json()

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Neplatný stav' }, { status: 400 })
    }

    // Načti instituci PŘED updatem (potřebujeme email a jméno)
    const { data: institution } = await service
      .from('institutions')
      .select('id, name, email, contact_name, plan, type')
      .eq('id', id)
      .single()

    if (!institution) {
      return NextResponse.json({ error: 'Instituce nenalezena' }, { status: 404 })
    }

    // Ulož nový stav
    const { error } = await service
      .from('institutions')
      .update({
        approval_status: status,
        approved_at:     status === 'approved' ? new Date().toISOString() : null,
        approved_by:     status === 'approved' ? user.id : null,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    // Odešli email (fire & forget — nechceme blokovat response kvůli emailu)
    if (institution.email) {
      if (status === 'approved') {
        sendApprovalEmail({
          to: institution.email,
          contactName: institution.contact_name ?? institution.name,
          institutionName: institution.name,
          plan: institution.plan ?? 'Free',
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/dashboard`,
        }).catch(err => console.error('sendApprovalEmail failed:', err))
      } else {
        sendRejectionEmail({
          to: institution.email,
          contactName: institution.contact_name ?? institution.name,
          institutionName: institution.name,
          reason: reason ?? 'Uvedené údaje nebylo možné ověřit. Prosím zkontrolujte vyplněné informace.',
          editUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/register`,
        }).catch(err => console.error('sendRejectionEmail failed:', err))
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('POST /api/institutions/[id]/approve error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
