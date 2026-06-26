import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function sanitizeRedirect(next: string | null): string {
  if (!next) return '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard'
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'signup'
    | 'magiclink'
    | 'invite'
    | 'recovery'
    | 'email_change'
    | null

  let next = sanitizeRedirect(searchParams.get('next'))
  // Password reset emails lose the `next` param in the redirect chain,
  // so infer it from the OTP type instead of relying on the query string.
  if (type === 'recovery') {
    next = '/reset-password'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
