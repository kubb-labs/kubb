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

/**
 * Unescapes a single JSON pointer reference token per RFC 6901 (`~1` → `/`, then `~0` → `~`),
 * the inverse of {@link escapePointerToken}.
 *
 * @example
 * ```ts
 * unescapePointerToken('~1pets~1{id}') // '/pets/{id}'
 * ```
 */
export function unescapePointerToken(token: string): string {
  return token.replaceAll('~1', '/').replaceAll('~0', '~')
}
