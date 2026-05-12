/**
 * Type guard that confirms `value` is a member of `set`. Avoids type assertions with `Set<T extends string>`.
 */
export function isFlag<T extends string>(set: ReadonlySet<T>, value: string): value is T {
  for (const flag of set) {
    if (flag === value) return true
  }
  return false
}
