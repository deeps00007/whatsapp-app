import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrder } from '@/lib/payments/razorpay'

const BASE_PLANS = {
  monthly: { amount: 899, days: 30 },
  quarterly: { amount: 899 * 3, days: 90 },
  yearly: { amount: 899 * 12, days: 365 },
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const planKey = (body?.plan as keyof typeof BASE_PLANS) || 'monthly'
    const plan = BASE_PLANS[planKey] ?? BASE_PLANS.monthly
    const amountPaise = plan.amount * 100

    const order = await createOrder(amountPaise, `rcpt_${user.id.slice(0, 8)}_${Date.now()}`)
    if (!order) {
      return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 })
    }

    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: planKey,
    })
  } catch (err) {
    console.error('[payments/create-order] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
