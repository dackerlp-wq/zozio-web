import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Předej pathname do server components přes header (pro FooterWrapper)
  supabaseResponse.headers.set('x-pathname', path)

  // Chráněné routes — přesměruj nepřihlášeného na login
  const isProtected =
    path.startsWith('/admin') ||
    path.startsWith('/superadmin') ||
    path.startsWith('/profil')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Přihlášený na login/register → přesměruj pryč
  const isAuthPage =
    path === '/auth/login' ||
    path === '/auth/register'

  if (user && isAuthPage) {
    const next = request.nextUrl.searchParams.get('next')
    if (next) return NextResponse.redirect(new URL(next, request.url))
    const role = user.user_metadata?.role
    return NextResponse.redirect(new URL(
      role === 'public' ? '/profil' : '/admin/dashboard',
      request.url
    ))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
