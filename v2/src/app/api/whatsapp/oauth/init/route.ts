import { buildOAuthUrl } from '@/lib/whatsapp/oauth'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://growbychat.app'))
  }

  const frontendHost = process.env.NEXT_PUBLIC_SITE_URL || 'https://growbychat.app'
  const frontendUrl = new URL(frontendHost)
  const protocol = frontendUrl.protocol.replace(':', '')
  const host = frontendUrl.host
  const redirectUri = `${protocol}://${host}/api/whatsapp/oauth/callback`

  const { oauthUrl, nonce } = buildOAuthUrl({
    userId: user.id,
    frontendHost,
    redirectUri,
  })

  const response = NextResponse.redirect(oauthUrl)
  response.cookies.set('oauth_nonce', nonce, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 600,
    path: '/',
  })

  return response
}
