import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { password } = await request.json()
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Heslo musí mít alespoň 6 znaků' }, { status: 400 })
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
