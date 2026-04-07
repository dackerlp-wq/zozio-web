import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()

    const { data: membership } = await service
      .from('institution_members')
      .select('institution_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })
    if (!['admin', 'institution_admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Pouze admin může měnit integraci' }, { status: 403 })
    }

    const body = await request.json()
    const { darujme_api_id, darujme_api_secret } = body

    const { error } = await service
      .from('institutions')
      .update({
        darujme_api_id:     darujme_api_id     || null,
        darujme_api_secret: darujme_api_secret || null,
        updated_at:         new Date().toISOString(),
      })
      .eq('id', membership.institution_id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('PUT /api/institutions/darujme-credentials error:', err)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
