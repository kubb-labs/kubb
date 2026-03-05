import { createHash, randomBytes } from 'node:crypto'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

const _fallbackSecret = generateToken()

/**
 * Returns the machine token derived from the `KUBB_AGENT_SECRET` environment variable.
 * Falls back to a randomly generated secret if the env var is not set.
 * The token is hashed with SHA-256.
 */
export function getMachineToken(): string {
  return hashToken(process.env.KUBB_AGENT_SECRET ?? _fallbackSecret)
}
