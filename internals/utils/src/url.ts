// `URL` keeps IPv6 brackets, so `::1` is `[::1]`.
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Whether `hostname`, as `URL` writes it, names this machine. */
export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname)
}

/** Whether `url` is `https:`, or plain `http:` to this machine, so nothing crosses the network unencrypted. */
export function isSecureUrl(url: URL): boolean {
  return url.protocol === 'https:' || (url.protocol === 'http:' && isLoopbackHost(url.hostname))
}
