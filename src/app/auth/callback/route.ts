import { createClient } from '../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${origin}?error=auth_failed`)
    }
    
    if (data.session) {
      const response = NextResponse.redirect(`${origin}/view`)
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      return response
    }
  }

  return NextResponse.redirect(`${origin}/view`)
}