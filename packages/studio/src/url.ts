import { isSecureUrl } from '@internals/utils'
import { ofetch } from 'ofetch'
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

const SETTINGS_TIMEOUT_MS = 10_000

/**
 * Where an organization API key request goes: `{apiUrl}/v1{path}` when Studio reports a public API in
 * `GET /api/settings`, else `{studioUrl}/api{path}`, also when that lookup fails.
 */
export async function publicApiUrl({ studioUrl, path, signal }: { studioUrl: string; path: string; signal?: AbortSignal }): Promise<URL> {
  const fallback = secureUrl({ studioUrl, path: `/api${path}` })
  const timeout = AbortSignal.timeout(SETTINGS_TIMEOUT_MS)
  const settings = await ofetch<{ apiUrl?: unknown }>(secureUrl({ studioUrl, path: '/api/settings' }).href, {
    redirect: 'error',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  }).catch(() => undefined)
  const apiUrl = settings?.apiUrl
  if (typeof apiUrl !== 'string' || !URL.canParse(apiUrl)) return fallback

  // `apiUrl` comes from the network, so it gets the same check as `studioUrl` before the key goes there.
  return secureUrl({ studioUrl: new URL(apiUrl).origin, path: `/v1${path}` })
}
