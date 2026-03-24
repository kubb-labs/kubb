/**
 * Type guard that checks whether a raw string is a member of a typed flag set.
 * Avoids the need for type assertions when working with `Set<T extends string>`.
 */
export function isFlag<T extends string>(set: ReadonlySet<T>, value: string): value is T {
  for (const flag of set) {
    if (flag === value) return true
  }
  return false
}
