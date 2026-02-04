import dns from 'node:dns'

/**
 * Check if the system has internet connectivity
 * Uses DNS lookup to well-known stable domains as a lightweight connectivity test
 */
export async function isOnline(): Promise<boolean> {
  const testDomains = [
    'dns.google.com', // Google Public DNS
    'cloudflare.com', // Cloudflare
    'one.one.one.one', // Cloudflare DNS
  ]

  for (const domain of testDomains) {
    try {
      await dns.promises.resolve(domain)
      return true
    } catch {
      // Try next domain
    }
  }

  return false
}

/**
 * Execute a function only if online, otherwise silently skip
 */
export async function executeIfOnline<T>(fn: () => Promise<T>): Promise<T | null> {
  const online = await isOnline()
  if (!online) {
    return null
  }

  try {
    return await fn()
  } catch {
    return null
  }
}
