import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Pouze superadmin' }, { status: 403 })
    }

    const { articleId, pin } = await request.json()
    if (!articleId) return NextResponse.json({ error: 'Chybí articleId' }, { status: 400 })

    // Unpin all first, then pin the selected one
    if (pin) {
      await service.from('articles').update({ pinned: false }).eq('pinned', true)
    }

    const { error } = await service
      .from('articles')
      .update({ pinned: !!pin })
      .eq('id', articleId)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('POST /api/superadmin/pin-article error:', err)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
