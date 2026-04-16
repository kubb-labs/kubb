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
