import { isCIEnvironment } from '@internals/utils'
import { kubbStorage } from '@kubb/core'
import { isValid } from 'verkit'

/** NPM registry endpoint used to check for @kubb/cli updates. */
const KUBB_NPM_PACKAGE_URL = 'https://registry.npmjs.org/@kubb/cli/latest' as const

/** Upper bound in milliseconds for the npm update check, so a slow registry never stalls a run. */
const UPDATE_CHECK_TIMEOUT_MS = 3_000

/** How long a stored registry answer stays fresh. */
export const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000

const STORE_KEY = 'update-check.json'

type StoredCheck = {
  version: string
  checkedAt: number
}

function isStoredCheck(value: unknown): value is StoredCheck {
  const check = value as Partial<StoredCheck> | null
  return typeof check?.version === 'string' && isValid(check.version) && typeof check.checkedAt === 'number'
}

// A timestamp in the future, from a clock set back, counts as stale so it cannot hide updates.
function isFresh(checkedAt: number): boolean {
  const age = Date.now() - checkedAt
  return age >= 0 && age < UPDATE_CHECK_INTERVAL_MS
}

/** The latest published version, `undefined` when the registry does not answer in time or `signal` aborts. Never rejects. */
async function fetchLatestVersion(signal: AbortSignal): Promise<string | undefined> {
  try {
    const res = await fetch(KUBB_NPM_PACKAGE_URL, { signal: AbortSignal.any([signal, AbortSignal.timeout(UPDATE_CHECK_TIMEOUT_MS)]) })
    if (!res.ok) return undefined
    const data = (await res.json()) as { version?: unknown }
    return typeof data.version === 'string' && isValid(data.version) ? data.version : undefined
  } catch {
    return undefined
  }
}

/**
 * The latest published `@kubb/cli` version for the update notice. Skipped in CI. Asks npm at most once per
 * {@link UPDATE_CHECK_INTERVAL_MS} and keeps the answer in `~/.kubb/cache` (or `KUBB_HOME`).
 * Resolves `undefined` when there is nothing to show. Never rejects.
 */
export async function getLatestVersion(signal: AbortSignal): Promise<string | undefined> {
  if (isCIEnvironment()) return undefined

  const storage = (() => {
    try {
      return kubbStorage({ base: 'cache' })
    } catch {
      return undefined
    }
  })()
  const stored = await storage?.getItem(STORE_KEY).catch(() => null)
  if (isStoredCheck(stored) && isFresh(stored.checkedAt)) return stored.version

  const latest = await fetchLatestVersion(signal)
  if (latest) await storage?.setItem(STORE_KEY, { version: latest, checkedAt: Date.now() }).catch(() => undefined)
  return latest
}
