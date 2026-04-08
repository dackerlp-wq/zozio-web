import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    const service = createServiceClient()

    const { data: app } = await service
      .from('adoption_applications')
      .select('id, status, cancel_token, applicant_email, user_id, animal_id, institution_id')
      .eq('id', id)
      .single()

    if (!app) return NextResponse.json({ error: 'Žádost nenalezena' }, { status: 404 })

    if (['rejected', 'adopted', 'cancelled'].includes(app.status)) {
      return NextResponse.json({ error: 'Žádost je již uzavřena' }, { status: 400 })
    }

    // Autorizace: platný token (e-mail odkaz) nebo přihlášený žadatel
    let authorized = false

    if (token && token === app.cancel_token) {
      authorized = true
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (app.user_id === user.id || app.applicant_email === user.email) {
          authorized = true
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Neoprávněný přístup' }, { status: 403 })
    }

    const { error } = await service
      .from('adoption_applications')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('POST /api/applications/[id]/cancel error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
