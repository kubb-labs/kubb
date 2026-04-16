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

