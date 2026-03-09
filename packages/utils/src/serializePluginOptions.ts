/**
 * Serialize plugin options for safe JSON transport.
 * Strips functions, symbols, and undefined values recursively.
 */
export function serializePluginOptions<TOptions extends object = object>(options: TOptions): TOptions {
  if (options === null || options === undefined) {
    return {} as TOptions
  }
  if (typeof options !== 'object') {
    return options
  }
  if (Array.isArray(options)) {
    return options.map(serializePluginOptions) as TOptions
  }

  const serialized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
      continue
    }
    if (typeof value === 'object' && value !== null) {
      serialized[key] = serializePluginOptions(value)
    } else {
      serialized[key] = value
    }
  }

  return serialized as TOptions
}
