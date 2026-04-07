import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const body = await request.json()
    if (!body.title || !body.institution_id) {
      return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', body.institution_id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { data, error } = await service
      .from('articles')
      .insert(body)
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        // Duplicitní slug — přidej timestamp
        body.slug = body.slug + '-' + Date.now().toString(36)
        const { data: d2, error: e2 } = await service.from('articles').insert(body).select('id').single()
        if (e2) throw e2
        revalidatePath('/articles')
      return NextResponse.json({ success: true, id: d2.id })
      }
      throw error
    }

    revalidatePath('/articles')
    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/articles error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
