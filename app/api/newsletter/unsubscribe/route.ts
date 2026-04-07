import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/?unsubscribe=missing', request.url))
  }

  try {
    const service = createServiceClient()

    const { error } = await service
      .from('newsletter_subscribers')
      .delete()
      .eq('unsubscribe_token', token)

    if (error) throw error

    return NextResponse.redirect(new URL('/?unsubscribe=ok', request.url))
  } catch (error) {
    console.error('GET /api/newsletter/unsubscribe error:', error)
    return NextResponse.redirect(new URL('/?unsubscribe=error', request.url))
  }
}
