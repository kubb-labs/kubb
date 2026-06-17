/**
 * Returns `true` when `value` is a plain (non-null, non-array) object.
 *
 * @example
 * ```ts
 * isPlainObject({})          // true
 * isPlainObject([])          // false
 * isPlainObject(null)        // false
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

/**
 * Recursively merges `source` into `target`, combining nested plain objects.
 * Arrays and non-object values from `source` override the corresponding values in `target`.
 *
 * @example
 * ```ts
 * mergeDeep({ a: { x: 1 } }, { a: { y: 2 } })
 * // { a: { x: 1, y: 2 } }
 * ```
 */
export function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = result[key]
    result[key] =
      sv !== null && typeof sv === 'object' && !Array.isArray(sv) && tv !== null && typeof tv === 'object' && !Array.isArray(tv)
        ? mergeDeep(tv as Record<string, unknown>, sv as Record<string, unknown>)
        : sv
  }
  return result
}
