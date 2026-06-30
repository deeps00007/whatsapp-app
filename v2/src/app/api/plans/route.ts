import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('id, label, amount, period_days, active')
      .eq('active', true)
      .order('period_days', { ascending: true })

    if (error) {
      console.error('[plans] error:', error.message)
      return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
    }

    return NextResponse.json({ plans: plans ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[plans] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
