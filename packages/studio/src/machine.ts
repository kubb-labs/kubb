import { hash, randomBytes } from 'node:crypto'
import process from 'node:process'
import { createStorage, type Storage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { logger } from './logger.ts'

/**
 * Key-value storage the runtime uses for its machine secret and the last Studio config.
 *
 * One storage per process, since one process serves one config file. Hosts install their own
 * driver on startup: Nitro passes its `kubb` mount, the CLI an fs driver under `~/.kubb/cache`.
 * The in-memory default keeps the runtime usable without a host, at the cost of a machine
 * identity that changes on every restart.
 */
let storage: Storage = createStorage()
let hasInstalledStorage = false

/**
 * Installs the storage driver the runtime persists to. Call once, before connecting.
 */
export function setStorage(next: Storage): void {
  storage = next
  hasInstalledStorage = true
}

export function getStorage(): Storage {
  return storage
}

/**
 * A storage backed by files under `base`, so the machine secret and the last Studio config
 * survive a restart. Repeated pairings of one machine depend on that secret staying put.
 */
export function createFileStorage(base: string): Storage {
  return createStorage({ driver: fsDriver({ base }) })
}

let fallbackSecretPromise: Promise<string> | null = null

/**
 * Loads the fallback machine secret from the runtime storage.
 * On first use it generates a secret and persists it, so the machine identity stays
 * stable across restarts. An identity that changes on every boot breaks session
 * creation with Studio whenever the startup registration call fails.
 */
async function loadOrCreateFallbackSecret(): Promise<string> {
  // The secret is memoized for the life of the process, so a host that reads the machine token
  // before installing its storage is bound to the throwaway in-memory default. Nothing else
  // surfaces that: the write succeeds, and the identity silently changes on every restart, which
  // Studio rejects with a 403 on the next session create.
  if (!hasInstalledStorage) {
    logger.warn(
      'Deriving the machine token before a storage driver was installed',
      'call setStorage() first, or set KUBB_AGENT_SECRET, to keep a stable machine identity across restarts',
    )
  }

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
