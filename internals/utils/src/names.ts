/**
 * Returns a unique name by appending an incrementing numeric suffix when the name has already been used.
 * Mutates `data` in-place as a usage counter so subsequent calls remain consistent.
 *
 * @example
 * const seen: Record<string, number> = {}
 * getUniqueName('Foo', seen) // 'Foo'
 * getUniqueName('Foo', seen) // 'Foo2'
 * getUniqueName('Foo', seen) // 'Foo3'
 */
export function getUniqueName(originalName: string, data: Record<string, number>): string {
  let used = data[originalName] || 0
  if (used) {
    data[originalName] = ++used
    originalName += used
  }
  data[originalName] = 1
  return originalName
}
