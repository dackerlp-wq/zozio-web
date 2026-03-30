import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'

// Server Component — načte user + roli a předá do client Navbar
export async function NavbarWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  let institutionSlug: string | null = null

  if (user) {
    // Zjisti superadmin z profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'superadmin') {
      role = 'superadmin'
    } else {
      // Zjisti institution_admin nebo staff
      const { data: member } = await supabase
        .from('institution_members')
        .select('role, institution:institutions(slug)')
        .eq('user_id', user.id)
        .maybeSingle()
      role = member?.role ?? null
      institutionSlug = (member?.institution as any)?.slug ?? null
    }
  }

  return (
    <Navbar
      user={user ? {
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
        role,
        institutionSlug,
      } : null}
    />
  )
}

export async function FooterWrapper() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin')
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAdminRoute || isAuthRoute) return null

  return <Footer />
}
