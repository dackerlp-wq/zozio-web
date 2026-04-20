import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'

export async function NavbarWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  let institutionSlug: string | null = null

  let isAdvertiser = false

  if (user) {
    const service = createServiceClient()

    // Zjisti roli z profiles (service role kvůli RLS)
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'superadmin') {
      role = 'superadmin'
    } else {
      // Zjisti membership v instituci
      const { data: member } = await service
        .from('institution_members')
        .select('role, institution:institutions(slug)')
        .eq('user_id', user.id)
        .maybeSingle()

      role = member?.role ?? null
      institutionSlug = (member?.institution as any)?.slug ?? null
    }

    // Zjisti zda je inzerent (má záznam v ad_companies)
    const { data: adCompany } = await service
      .from('ad_companies')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    isAdvertiser = !!adCompany
  }

  return (
    <Navbar
      user={user ? {
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
        role,
        institutionSlug,
        isAdvertiser,
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
