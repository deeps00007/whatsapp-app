import { buildOAuthUrl } from '@/lib/whatsapp/oauth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://growbychat.app'))
  }

  const frontendHost = process.env.NEXT_PUBLIC_SITE_URL || 'https://growbychat.app'
  const host = new URL(frontendHost).host

  const protocol =
    process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https') ? 'https' : 'https'

  const redirectUri = `${protocol}://${host}/api/whatsapp/oauth/callback`

  const oauthUrl = buildOAuthUrl({
    userId: user.id,
    frontendHost,
    redirectUri,
  })

  return NextResponse.redirect(oauthUrl)
}
