import { hash, randomBytes } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'

/** What the runtime needs from a host's key-value storage to keep its machine secret. */
export type MachineStorage = {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: string) => Promise<void>
}

/** One file per key under a directory, holding each value as JSON. */
export type FileStorage = {
  getItem: <T = unknown>(key: string) => Promise<T | null>
  setItem: (key: string, value: unknown) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

function createMemoryStorage(): MachineStorage {
  const items = new Map<string, string>()

  return {
    getItem: async (key) => items.get(key) ?? null,
    setItem: async (key, value) => {
      items.set(key, value)
    },
  }
}

/**
 * The storage the runtime persists its machine secret to, one per process. Hosts install a file
 * storage on startup; the in-memory default keeps the runtime usable without a host, at the cost
 * of a machine identity that changes on every restart.
 */
let storage: MachineStorage = createMemoryStorage()
let hasInstalledStorage = false

/**
 * Installs the storage the runtime persists to. Call once, before connecting.
 */
export function setStorage(next: MachineStorage): void {
  storage = next
  hasInstalledStorage = true
}

/** Reads a value as JSON, or as the raw text for a file an older driver wrote as a bare string. */
function deserialize(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function ignoreMissing(error: unknown): null {
  const code = (error as { code?: string }).code
  if (code === 'ENOENT' || code === 'EISDIR') return null
  throw error
}

/**
 * A storage backed by files under `base`, so the machine secret survives a restart, as repeated
 * pairings of one machine depend on. Files are created readable by the owner only.
 */
export function createFileStorage(base: string): FileStorage {
  const root = resolve(base)
  const pathOf = (key: string) => join(root, key)

  return {
    getItem: async <T>(key: string) => {
      const text = await readFile(pathOf(key), 'utf8').catch(ignoreMissing)
      return text === null ? null : (deserialize(text) as T)
    },
    setItem: async (key, value) => {
      const path = pathOf(key)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, JSON.stringify(value), { encoding: 'utf8', mode: 0o600 })
    },
    removeItem: (key) => rm(pathOf(key), { force: true }),
  }
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
    console.warn(
      styleText('yellow', 'Deriving the machine token before a storage driver was installed'),
      'call setStorage() first, or set KUBB_AGENT_SECRET, to keep a stable machine identity across restarts',
    )
  }

  const stored = await storage.getItem('machine-secret').catch(() => null)

  if (typeof stored === 'string' && stored) {
    return stored
  }

  const secret = randomBytes(32).toString('hex')

  await storage.setItem('machine-secret', secret).catch(() => {
    console.warn(
      styleText('yellow', 'Could not persist the generated machine secret'),
      'set KUBB_AGENT_SECRET to keep a stable machine identity across restarts',
    )
  })

  return secret
}

/**
 * Hashes a stable secret into the machine token Studio expects, so a host can derive one from its
 * own identity without duplicating `getMachineToken`'s SHA-256 step.
 */
export function machineTokenFrom(secret: string): string {
  return hash('sha256', secret)
}

/**
 * Returns the machine token derived from the `KUBB_AGENT_SECRET` environment variable.
 * Falls back to a generated secret persisted in the runtime storage if the env var is not set.
 * The token is hashed with SHA-256.
 */
export async function getMachineToken(): Promise<string> {
  if (process.env.KUBB_AGENT_SECRET) {
    return machineTokenFrom(process.env.KUBB_AGENT_SECRET)
  }

  fallbackSecretPromise ??= loadOrCreateFallbackSecret()

  return machineTokenFrom(await fallbackSecretPromise)
}
