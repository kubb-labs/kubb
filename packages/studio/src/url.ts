/**
 * Hosted Kubb Studio URL, used when a host passes none.
 */
export const defaultStudioUrl = 'https://kubb.studio'

/**
 * Returns `true` for a hostname that only resolves to this machine, where a plaintext transport
 * cannot leak a token onto the network. `URL` keeps the brackets on an IPv6 hostname, so `::1`
 * arrives as `[::1]`.
 */
export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

/**
 * Appends `path` to the Studio URL and refuses plaintext to anything but this machine, so a token
 * or API key never crosses the network unencrypted. `socket` switches the scheme to `ws:`/`wss:`.
 *
 * @example
 * ```ts
 * secureUrl('https://kubb.studio', '/api/agent/socket', { socket: true }).href // 'wss://kubb.studio/api/agent/socket'
 * ```
 */
export function secureUrl(studioUrl: string, path: string, { socket = false }: { socket?: boolean } = {}): URL {
  const url = new URL(`${studioUrl.replace(/\/+$/, '')}${path}`)

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopbackHost(url.hostname))) {
    throw new Error(`Refusing to reach Kubb Studio at ${url.origin}: use an https:// URL, or a loopback host for local development`)
  }
  if (socket) url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return url
}
