import { createHash, randomBytes } from 'node:crypto'

/** Generates a cryptographically random 32-byte token encoded as a hex string. */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/** Returns the SHA-256 hex digest of `input`. Useful for deterministically hashing a token before storage. */
export function hashToken(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
