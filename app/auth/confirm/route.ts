import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Zpracuje ověřovací odkaz z emailu (token_hash flow)
// Volán z: /api/auth/send-email → odkaz v emailu → sem

function redirectForRole(role?: string | null): string {
  if (role === 'institution_admin' || role === 'institution') return '/admin/dashboard'
  if (role === 'advertiser') return '/portal'
  if (role === 'visitor' || role === 'public') return '/profil'
  return '/profil'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth`)
  }

  // Reset hesla vždy směruje na reset-password, bez ohledu na roli
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  // Signup / email_change — prioritizuj explicitní `next`, jinak odvod z role
  const role = data.session.user.user_metadata?.role as string | undefined
  const redirectTo = next && next.startsWith('/') ? next : redirectForRole(role)

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
