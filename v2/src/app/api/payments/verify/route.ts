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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, periodDays, plan, renewal } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!valid) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const days = Number(periodDays) || 30
    const planValue = ['monthly', 'quarterly', 'yearly'].includes(plan) ? plan : 'monthly'

    const admin = supabaseAdmin()

    // Ensure the profile row exists before updating the subscription.
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, subscription_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const baseDate = renewal && existingProfile?.subscription_expires_at && new Date(existingProfile.subscription_expires_at) > new Date()
      ? new Date(existingProfile.subscription_expires_at)
      : new Date()
    const expiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

    if (!existingProfile) {
      const { error: insertErr } = await admin
        .from('profiles')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name ?? '',
          email: user.email ?? '',
          subscription_expires_at: expiresAt,
          subscription_plan: planValue,
        })

      if (insertErr) {
        console.error('[payments/verify] DB insert error:', insertErr.message)
        return NextResponse.json({ error: 'Failed to activate subscription. Please try again.' }, { status: 500 })
      }

      return NextResponse.json({ success: true, subscriptionExpiresAt: expiresAt, plan: planValue })
    }

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ subscription_expires_at: expiresAt, subscription_plan: planValue })
      .eq('user_id', user.id)

    if (updateErr) {
      console.error('[payments/verify] DB update error:', updateErr.message)
      return NextResponse.json({ error: 'Failed to activate subscription. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscriptionExpiresAt: expiresAt, plan: planValue })
  } catch (err) {
    console.error('[payments/verify] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
