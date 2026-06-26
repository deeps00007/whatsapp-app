import { createHmac } from 'node:crypto'

const RAZORPAY_API = 'https://api.razorpay.com/v1'

function authHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
}

export const PLAN_AMOUNT = 89900
export const PLAN_CURRENCY = 'INR'
export const PLAN_LABEL = '₹899/month'

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}

export async function createOrder(amount: number, receipt: string): Promise<RazorpayOrder | null> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    console.warn('[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET')
    return null
  }

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: PLAN_CURRENCY,
      receipt,
      payment_capture: 1,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[Razorpay] createOrder failed:', res.status, text)
    return null
  }

  return res.json()
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return false

  const expected = createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return expected === signature
}
