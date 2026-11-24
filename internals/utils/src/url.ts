// `URL` keeps IPv6 brackets, so `::1` is `[::1]`.
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Whether `url` is `https:`, or plain `http:` to this machine, so nothing crosses the network unencrypted.
 *
 * @example
 * ```ts
 * isSecureUrl(new URL('http://localhost:4000')) // true
 * isSecureUrl(new URL('http://example.com')) // false
 * ```
 */
export function isSecureUrl(url: URL): boolean {
  return url.protocol === 'https:' || (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname))
}
