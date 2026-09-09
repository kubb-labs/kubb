/**
 * Coerces an unknown thrown value to an `Error` instance.
 * Returns the value as-is when it is already an `Error`; otherwise wraps it with `String(value)`.
 *
 * @example
 * ```ts
 * try { ... } catch(err) {
 *   throw new Error('Build failed', { cause: toError(err) })
 * }
 * ```
 */
export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

/**
 * Extracts a human-readable message from any thrown value.
 *
 * @example
 * ```ts
 * getErrorMessage(new Error('oops')) // 'oops'
 * getErrorMessage('plain string')    // 'plain string'
 * ```
 */
export function getErrorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}
