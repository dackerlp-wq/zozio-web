import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Zpracuje ověřovací odkaz z emailu (token_hash flow)
// Volán z: /api/auth/send-email → odkaz v emailu → sem

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (!error && data.session) {
      const role = data.session.user.user_metadata?.role

      let redirectTo = next
      if (role === 'visitor') {
        redirectTo = '/profil'
      } else if (role === 'institution') {
        redirectTo = '/admin/dashboard'
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
