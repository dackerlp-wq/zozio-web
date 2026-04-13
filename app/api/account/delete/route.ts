import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()

  // Smaž uživatelská data
  await Promise.allSettled([
    service.from('animal_favorites').delete().eq('user_id', user.id),
    service.from('institution_favorites').delete().eq('user_id', user.id),
    service.from('volunteers').update({ user_id: null }).eq('user_id', user.id),
    service.from('newsletter_subscribers').delete().eq('email', user.email!),
  ])

  // Smaž auth účet (admin API)
  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
