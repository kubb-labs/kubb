import { trimQuotes } from './string.ts'

// ─── Stringify ────────────────────────────────────────────────────────────────

export function stringify(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '""'
  return JSON.stringify(trimQuotes(value.toString()))
}

export function stringifyObject(value: Record<string, unknown>): string {
  const items = Object.entries(value)
    .map(([key, val]) => {
      if (val !== null && typeof val === 'object') {
        return `${key}: {\n        ${stringifyObject(val as Record<string, unknown>)}\n      }`
      }
      return `${key}: ${val}`
    })
    .filter(Boolean)
  return items.join(',\n')
}

// ─── Serialization ────────────────────────────────────────────────────────────

/**
 * Serializes plugin options for safe JSON transport.
 * Strips functions, symbols, and `undefined` values recursively.
 */
export function serializePluginOptions<TOptions extends object = object>(options: TOptions): TOptions {
  if (options === null || options === undefined) return {} as TOptions
  if (typeof options !== 'object') return options
  if (Array.isArray(options)) return options.map(serializePluginOptions) as TOptions

  const serialized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) continue
    serialized[key] = typeof value === 'object' && value !== null ? serializePluginOptions(value) : value
  }
  return serialized as TOptions
}

// ─── Nested accessor ─────────────────────────────────────────────────────────

/**
 * Converts a dot-notation path or string array into an optional-chaining accessor expression.
 *
 * @example
 * getNestedAccessor('pagination.next.id', 'lastPage')
 * // → "lastPage?.['pagination']?.['next']?.['id']"
 */
export function getNestedAccessor(param: string | string[], accessor: string): string | undefined {
  const parts = Array.isArray(param) ? param : param.split('.')
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) return undefined
  return parts.reduce((acc, part) => `${acc}?.['${part}']`, accessor)
}
