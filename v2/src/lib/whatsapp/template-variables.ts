export interface TemplateVariable {
  index: number
  name: string
  isNamed: boolean
}

const VARIABLE_REGEX = /\{\{(\d+)\}\}|\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

export function extractVariables(text: string): TemplateVariable[] {
  const seen = new Map<string, number>()
  const vars: TemplateVariable[] = []
  let positional = 0

  for (const m of text.matchAll(VARIABLE_REGEX)) {
    const numMatch = m[1]
    const nameMatch = m[2]
    const key = numMatch ?? nameMatch

    if (seen.has(key)) continue

    if (numMatch) {
      const n = parseInt(numMatch, 10)
      seen.set(key, n - 1)
      vars.push({ index: n - 1, name: numMatch, isNamed: false })
      positional = Math.max(positional, n)
    } else {
      seen.set(key, positional)
      vars.push({ index: positional, name: nameMatch, isNamed: true })
      positional++
    }
  }

  vars.sort((a, b) => a.index - b.index)

  const reindexed: TemplateVariable[] = vars.map((v, i) => ({
    ...v,
    index: i,
  }))

  return reindexed
}

export function variableCount(text: string): number {
  return extractVariables(text).length
}

export function isSequential(text: string): boolean {
  const vars = extractVariables(text)
  const numbered = vars.filter((v) => !v.isNamed)
  if (numbered.length === 0) return true
  const indices = numbered.map((v) => parseInt(v.name, 10)).sort((a, b) => a - b)
  return indices.every((v, i) => v === i + 1)
}

export function renderBodyPreview(text: string, params: string[]): string {
  const vars = extractVariables(text)
  let out = text
  for (const v of vars) {
    const pattern = v.isNamed ? `{{${v.name}}}` : `{{${v.name}}}`
    const value = params[v.index]?.trim() || pattern
    out = out.split(pattern).join(value)
  }
  return out
}

const CONTACT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  phone: 'phone',
  email: 'email',
  company: 'company',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  notes: 'notes',
}

export function autoFillParams(
  vars: TemplateVariable[],
  contact: Record<string, unknown> | null
): string[] {
  if (!vars.length) return []
  const maxIndex = Math.max(...vars.map((v) => v.index))
  const params = new Array(maxIndex + 1).fill('')

  for (const v of vars) {
    if (v.isNamed && contact) {
      const field = CONTACT_FIELD_MAP[v.name.toLowerCase()]
      const value = field ? String(contact[field] ?? '') : ''
      params[v.index] = value
    }
  }

  return params
}
