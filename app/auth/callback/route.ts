import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextRaw = searchParams.get('next') ?? '/admin/dashboard'
  // Validace redirect URL — pouze interní relativní cesty
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/admin/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const user     = data.session.user
      const role     = user.user_metadata?.role

      let redirectTo = next

      if (role === 'public') {
        redirectTo = '/profil'
      } else if (role === 'institution_admin' && next === '/admin/dashboard') {
        redirectTo = '/admin/dashboard'
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
