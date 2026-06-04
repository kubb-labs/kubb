import { randomBytes } from 'node:crypto'
import { sha256 } from './hash.ts'

/** Generates a cryptographically random 32-byte token encoded as a hex string.
 *
 * @example
 * ```ts
 * generateToken() // 'a3f1...8c2e' (64-char hex string)
 * ```
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/** Returns the SHA-256 hex digest of `input`. Useful for deterministically hashing a token before storage.
 *
 * @example
 * ```ts
 * hashToken(generateToken()) // 'e3b0...c9fa' (64-char hex string)
 * ```
 */
export function hashToken(input: string): string {
  return sha256(input)
}
