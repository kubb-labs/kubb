import { trimQuotes } from './string.ts'

/**
 * Serializes a primitive value to a JSON string literal, stripping any surrounding quote characters first.
 *
 * @example
 * stringify('hello')   // '"hello"'
 * stringify('"hello"') // '"hello"'
 */
export function stringify(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '""'
  return JSON.stringify(trimQuotes(value.toString()))
}

/**
 * Converts a plain object into a multiline key-value string suitable for embedding in generated code.
 * Nested objects are recursively stringified with indentation.
 *
 * @example
 * stringifyObject({ foo: 'bar', nested: { a: 1 } })
 * // 'foo: bar,\nnested: {\n        a: 1\n      }'
 */
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

/**
 * Strips functions, symbols, and `undefined` values from plugin options for safe JSON transport.
 *
 * @example
 * ```ts
 * serializePluginOptions({ output: './src', onWrite: () => {} })
 * // { output: './src' }  (function stripped)
 * ```
 */
export function serializePluginOptions<TOptions extends object>(options: TOptions): TOptions {
  if (options === null || options === undefined) return {} as TOptions
  if (typeof options !== 'object') return options
  if (Array.isArray(options)) return options.map(serializePluginOptions) as unknown as TOptions

  const serialized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) continue
    serialized[key] = value !== null && typeof value === 'object' ? serializePluginOptions(value as object) : value
  }
  return serialized as TOptions
}

/**
 * Strips all `undefined` values from an object recursively by round-tripping through JSON.
 * Useful for clean inline snapshot assertions that only show fields with actual values.
 *
 * @example
 * toSnapshot({ kind: 'Schema', name: undefined, type: 'string' })
 * // { kind: 'Schema', type: 'string' }
 */
export function toSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

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
  return `${accessor}?.['${`${parts.join("']?.['")}']`}`
}
