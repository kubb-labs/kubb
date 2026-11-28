import { isLoopbackHost, isSecureUrl } from '@internals/utils'
import { Diagnostics } from '@kubb/core'

/**
 * Hosted Kubb Studio URL, used when a host passes none.
 */
export const defaultStudioUrl = 'https://kubb.studio'

/**
 * Appends `path` to the Studio URL and refuses plaintext to anything but this machine, so a token
 * or API key never crosses the network unencrypted. `socket` switches the scheme to `ws:`/`wss:`.
 *
 * @example
 * ```ts
 * secureUrl({ studioUrl: 'https://kubb.studio', path: '/api/agent/socket', socket: true }).href // 'wss://kubb.studio/api/agent/socket'
 * ```
 */
export function secureUrl({ studioUrl, path, socket = false }: { studioUrl: string; path: string; socket?: boolean }): URL {
  const url = new URL(`${studioUrl.replace(/\/+$/, '')}${path}`)

  if (!isSecureUrl(url)) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `Refusing to reach Kubb Studio at ${url.origin}: use an https:// URL, or a loopback host for local development`,
    })
  }
  if (socket) url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return url
}

const IP_HOST = /^(\d{1,3}\.){3}\d{1,3}$|^\[[\da-f:.]+\]$/i

/**
 * Where an organization API key request goes: `/v1{path}` on the Studio's public API, the Studio host with `api.` in
 * front, such as `https://api.dev.kubb.studio` for `https://dev.kubb.studio`. A Studio on this machine serves `/v1`
 * on its own origin.
 *
 * @example
 * ```ts
 * publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/snapshots' }).href // 'https://api.kubb.studio/v1/snapshots'
 * ```
 */
export function publicApiUrl({ studioUrl, path }: { studioUrl: string; path: string }): URL {
  const url = new URL(studioUrl)
  if (!isLoopbackHost(url.hostname)) {
    // An IP address has no `api.` name to put in front of it, and the URL setter would keep the Studio origin.
    if (IP_HOST.test(url.hostname)) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: `Kubb Studio at ${url.origin} has no api. hostname for its public API`,
        help: 'Pass the Studio hostname as --url, such as https://kubb.studio, not an IP address.',
      })
    }
    url.hostname = `api.${url.hostname}`
  }

  return secureUrl({ studioUrl: url.origin, path: `/v1${path}` })
}
