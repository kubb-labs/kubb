import type { StatusCode } from '@kubb/ast/types'

/**
 * Find the first 2xx response status code from an operation's responses.
 */
export function findSuccessStatusCode(responses: Array<{ statusCode: number | string }>): StatusCode | undefined {
  for (const res of responses) {
    const code = Number(res.statusCode)
    if (code >= 200 && code < 300) {
      return res.statusCode as StatusCode
    }
  }
  return undefined
}

export type ZodParam = {
  name: string
  schemaName: string
}

/**
 * Render a group param value — either a group schema name directly (kubbV4),
 * or compose individual schemas into `z.object({ ... })` (v5).
 */
export function zodGroupExpr(entry: string | Array<ZodParam>): string {
  if (typeof entry === 'string') {
    return entry
  }
  const entries = entry.map((p) => `${JSON.stringify(p.name)}: ${p.schemaName}`)
  return `z.object({ ${entries.join(', ')} })`
}
