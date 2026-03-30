import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Zkontroluj roli uživatele a přesměruj správně
      const user     = data.session.user
      const role     = user.user_metadata?.role
      const instType = user.user_metadata?.institution_type

      let redirectTo = next

      if (role === 'visitor') {
        redirectTo = '/profil'
      } else if (role === 'institution' && next === '/admin/dashboard') {
        redirectTo = '/admin/dashboard'
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
