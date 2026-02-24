import { createHash } from 'node:crypto'

/**
 * Returns the storage key for a given agent token.
 * Tokens are hashed with SHA-512 before storage - raw tokens are never persisted.
 */
export function getSessionKey(token: string): string {
  return `sessions:${createHash('sha512').update(token).digest('hex')}`
}
