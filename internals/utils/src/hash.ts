import { hash } from 'node:crypto'

/**
 * Returns the SHA-256 hex digest of `input`.
 *
 * Uses the native one-shot `crypto.hash` (Node 21+ and Bun) rather than the
 * `createHash().update().digest()` chain, so there is no streaming hash object to manage.
 *
 * @example
 * ```ts
 * sha256('src/models/pet.ts') // 'a1b2…' (64-char hex string)
 * ```
 */
export function sha256(input: string): string {
  return hash('sha256', input, 'hex')
}
