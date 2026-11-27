import { isSecureUrl } from '@internals/utils'
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

/**
 * Hosted Kubb Studio's public API.
 */
export const defaultApiUrl = 'https://api.kubb.studio'

/**
 * Where an organization API key request goes: `{apiUrl}/v1{path}`, with `KUBB_STUDIO_API_URL` as `apiUrl`, or
 * `https://api.kubb.studio` for the hosted Studio. Any other Studio takes the key at `{studioUrl}/api{path}`.
 *
 * @example
 * ```ts
 * publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/snapshots' }).href // 'https://api.kubb.studio/v1/snapshots'
 * ```
 */
export function publicApiUrl({ studioUrl, path }: { studioUrl: string; path: string }): URL {
  const hosted = new URL(studioUrl).origin === new URL(defaultStudioUrl).origin
  const apiUrl = process.env.KUBB_STUDIO_API_URL || (hosted ? defaultApiUrl : undefined)
  if (!apiUrl) return secureUrl({ studioUrl, path: `/api${path}` })

  return secureUrl({ studioUrl: new URL(apiUrl).origin, path: `/v1${path}` })
}
