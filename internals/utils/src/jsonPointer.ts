/**
 * Escapes a single JSON pointer reference token per RFC 6901 (`~` → `~0`, `/` → `~1`), so a
 * name holding those characters maps to a distinct pointer.
 *
 * @example
 * ```ts
 * escapePointerToken('/pets/{id}') // '~1pets~1{id}'
 * ```
 */
export function escapePointerToken(token: string): string {
  return token.replaceAll('~', '~0').replaceAll('/', '~1')
}
