/**
 * Returns `true` for a hostname that only resolves to this machine, where a plaintext transport
 * cannot leak a token onto the network. `URL` keeps the brackets on an IPv6 hostname, so `::1`
 * arrives as `[::1]`.
 */
export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}
