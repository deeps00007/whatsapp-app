import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { resumePendingExecution, runAutomationsForTrigger } from '@/lib/automations/engine'
import type { AutomationContext } from '@/lib/automations/engine'

interface TimeBasedConfig {
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  timezone?: string
  days?: number[]
  day_of_month?: number
}

function shouldFireTimeBased(cfg: TimeBasedConfig, now: Date, lastFired: string | null): boolean {
  const [hh, mm] = (cfg.time ?? '00:00').split(':').map(Number)
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false

  const fireMinute = hh * 60 + mm
  const currentMinute = now.getUTCHours() * 60 + now.getUTCMinutes()

  if (cfg.frequency === 'daily') {
    if (currentMinute !== fireMinute) return false
  } else if (cfg.frequency === 'weekly') {
    const day = now.getUTCDay()
    if (!(cfg.days ?? []).includes(day)) return false
    if (currentMinute !== fireMinute) return false
  } else if (cfg.frequency === 'monthly') {
    const dom = now.getUTCDate()
    if (dom !== (cfg.day_of_month ?? 1)) return false
    if (currentMinute !== fireMinute) return false
  } else {
    return false
  }

  if (lastFired) {
    const lastDate = new Date(lastFired)
    if (
      lastDate.getUTCFullYear() === now.getUTCFullYear() &&
      lastDate.getUTCMonth() === now.getUTCMonth() &&
      lastDate.getUTCDate() === now.getUTCDate() &&
      lastDate.getUTCHours() === now.getUTCHours() &&
      lastDate.getUTCMinutes() === now.getUTCMinutes()
    ) {
      return false
    }
  }

  return true
}

export async function GET(request: Request) {
  const expected = process.env.AUTOMATION_CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'cron not configured' }, { status: 503 })
  }
  const supplied = request.headers.get('x-cron-secret') ?? ''
  const expectedBuf = Buffer.from(expected)
  const suppliedBuf = Buffer.from(supplied)
  if (suppliedBuf.length !== expectedBuf.length || !timingSafeEqual(suppliedBuf, expectedBuf)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = supabaseAdmin()

  const { data: due, error } = await admin
    .from('automation_pending_executions')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', new Date().toISOString())
    .order('run_at', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Failed to fetch pending executions' }, { status: 500 })

  let processed = 0
  if (due && due.length > 0) {
    for (const row of due) {
      const { data: claim } = await admin
        .from('automation_pending_executions')
        .update({ status: 'running' })
        .eq('id', row.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()
      if (!claim) continue

      await resumePendingExecution({
        id: row.id as string,
        automation_id: row.automation_id as string,
        user_id: row.user_id as string,
        contact_id: (row.contact_id as string | null) ?? null,
        log_id: (row.log_id as string | null) ?? null,
        parent_step_id: (row.parent_step_id as string | null) ?? null,
        branch: (row.branch as 'yes' | 'no' | null) ?? null,
        next_step_position: row.next_step_position as number,
        context: (row.context as AutomationContext) ?? {},
      })
      processed++
    }
  }

  const now = new Date()
  const { data: timeBased } = await admin
    .from('automations')
    .select('id, user_id, trigger_config, metadata')
    .eq('trigger_type', 'time_based')
    .eq('is_active', true)

  let timeBasedFired = 0
  if (timeBased && timeBased.length > 0) {
    for (const auto of timeBased) {
      const cfg = auto.trigger_config as TimeBasedConfig | null
      if (!cfg?.frequency || !cfg?.time) continue

      const meta = (auto.metadata as Record<string, unknown>) ?? {}
      const lastFired = typeof meta.last_time_fired === 'string' ? meta.last_time_fired : null

      if (!shouldFireTimeBased(cfg, now, lastFired)) continue

      await admin
        .from('automations')
        .update({ metadata: { ...meta, last_time_fired: now.toISOString() } })
        .eq('id', auto.id)

      runAutomationsForTrigger({
        userId: auto.user_id,
        triggerType: 'time_based',
        context: {},
      }).catch((err) => console.error('[automations] time_based dispatch failed:', err))
      timeBasedFired++
    }
  }

  return NextResponse.json({ processed, time_based_fired: timeBasedFired })
}
