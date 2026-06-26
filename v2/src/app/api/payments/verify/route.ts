import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { verifyPaymentSignature } from '@/lib/payments/razorpay'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, periodDays } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!valid) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const days = Number(periodDays) || 30
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const admin = supabaseAdmin()
    const { error: updateErr } = await admin
      .from('profiles')
      .update({ subscription_expires_at: expiresAt })
      .eq('user_id', user.id)

    if (updateErr) {
      console.error('[payments/verify] DB update error:', updateErr.message)
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscriptionExpiresAt: expiresAt })
  } catch (err) {
    console.error('[payments/verify] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
