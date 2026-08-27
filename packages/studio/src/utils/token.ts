import process from 'node:process'
import { hash, randomBytes } from 'node:crypto'
import { getStorage } from './storage.ts'
import { logger } from './logger.ts'

let fallbackSecretPromise: Promise<string> | null = null

/**
 * Loads the fallback machine secret from the runtime storage.
 * On first use it generates a secret and persists it, so the machine identity stays
 * stable across restarts — an identity that changes on every boot breaks session
 * creation with Studio whenever the startup registration call fails.
 */
async function loadOrCreateFallbackSecret(): Promise<string> {
  const storage = getStorage()
  const stored = await storage.getItem('machine-secret').catch(() => null)

  if (typeof stored === 'string' && stored) {
    return stored
  }

  const secret = randomBytes(32).toString('hex')

  await storage.setItem('machine-secret', secret).catch(() => {
    logger.warn('Could not persist the generated machine secret', 'set KUBB_AGENT_SECRET to keep a stable machine identity across restarts')
  })

  return secret
}

/**
 * Returns the machine token derived from the `KUBB_AGENT_SECRET` environment variable.
 * Falls back to a generated secret persisted in the runtime storage if the env var is not set.
 * The token is hashed with SHA-256.
 */
export async function getMachineToken(): Promise<string> {
  if (process.env.KUBB_AGENT_SECRET) {
    return hash('sha256', process.env.KUBB_AGENT_SECRET)
  }

  fallbackSecretPromise ??= loadOrCreateFallbackSecret()

  return hash('sha256', await fallbackSecretPromise)
}
