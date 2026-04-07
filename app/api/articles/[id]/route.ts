import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function checkAccess(userId: string, articleId: string, service: any) {
  const { data: a } = await service.from('articles').select('institution_id').eq('id', articleId).single()
  if (!a) return false
  const { data: m } = await service.from('institution_members').select('role').eq('user_id', userId).eq('institution_id', a.institution_id).single()
  return !!m
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    if (!await checkAccess(user.id, id, service)) {
      return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })
    }

    const body = await request.json()
    const { error } = await service
      .from('articles')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/articles/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    if (!await checkAccess(user.id, id, service)) {
      return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })
    }

    const { error } = await service.from('articles').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/articles/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
