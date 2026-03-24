import { promises as dnsPromises } from 'node:dns'

/**
 * Well-known stable domains used as DNS probes to check internet connectivity.
 */
const TEST_DOMAINS = ['dns.google.com', 'cloudflare.com', 'one.one.one.one'] as const

/**
 * Returns `true` when the system has internet connectivity.
 * Probes DNS resolution against well-known stable domains.
 *
 * @example
 * ```ts
 * if (await isOnline()) {
 *   await fetchLatestVersion()
 * }
 * ```
 */
export async function isOnline(): Promise<boolean> {
  for (const domain of TEST_DOMAINS) {
    try {
      await dnsPromises.resolve(domain)
      return true
    } catch {
      // Try next domain
    }
  }

  return false
}

/**
 * Executes `fn` only when the system is online. Returns `null` when offline or on error.
 *
 * @example
 * ```ts
 * const version = await executeIfOnline(() => fetchLatestVersion('kubb'))
 * // null when offline
 * ```
 */
export async function executeIfOnline<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!(await isOnline())) return null

  try {
    return await fn()
  } catch {
    return null
  }
}
