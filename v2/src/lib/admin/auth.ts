import { timingSafeEqual } from 'node:crypto'

export function validateAdminKey(request: Request): boolean {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) return false
  const supplied = request.headers.get('x-admin-api-key') ?? ''
  const a = Buffer.from(expected)
  const b = Buffer.from(supplied)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function getAgentName(request: Request): string {
  return request.headers.get('x-agent-name') ?? 'Support Agent'
}
