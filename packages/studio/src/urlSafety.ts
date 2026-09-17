const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase())
}

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (isLoopbackHost(host)) return true
  if (host === '0.0.0.0' || host.endsWith('.local') || host.endsWith('.internal')) return true
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true
  return false
}

/** Bearer tokens travel on the socket, so non-loopback sessions must use `wss:`. */
export function assertSafeWebSocketUrl(url: string): void {
  const parsed = new URL(url)
  if (parsed.protocol === 'wss:') return
  if (parsed.protocol === 'ws:' && isLoopbackHost(parsed.hostname)) return
  throw new Error(`Refusing to open an unencrypted WebSocket to ${parsed.host}. Use wss://, or ws:// only on loopback.`)
}

/** Snapshot upload paths that carry the agent bearer token must stay on the Studio origin. */
export function resolveStudioUploadUrl(uploadPath: string, studioUrl: string): URL {
  if (/^[a-z][a-z0-9+.-]*:/i.test(uploadPath)) {
    throw new Error('Snapshot upload path must be a relative Studio path')
  }
  const uploadUrl = new URL(uploadPath, studioUrl)
  const studio = new URL(studioUrl)
  if (uploadUrl.origin !== studio.origin) {
    throw new Error('Snapshot upload path must stay on the Studio origin')
  }
  return uploadUrl
}

/**
 * Storage URLs come from Studio. Require HTTPS to public hosts, unless Studio itself is on
 * loopback (local development), in which case loopback HTTP is allowed.
 */
export function assertSafeStorageUrl(storageUrl: string, studioUrl: string): URL {
  const url = new URL(storageUrl)
  const studio = new URL(studioUrl)
  const localStudio = isLoopbackHost(studio.hostname)

  if (localStudio) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`Refusing snapshot upload to unsupported URL protocol ${url.protocol}`)
    }
    if (url.protocol === 'http:' && !isLoopbackHost(url.hostname)) {
      throw new Error(`Refusing plaintext snapshot upload to ${url.host}`)
    }
    return url
  }

  if (url.protocol !== 'https:') {
    throw new Error(`Refusing snapshot upload to non-HTTPS URL ${url.origin}`)
  }
  if (isPrivateOrLoopbackHost(url.hostname)) {
    throw new Error(`Refusing snapshot upload to private or loopback host ${url.hostname}`)
  }
  return url
}
