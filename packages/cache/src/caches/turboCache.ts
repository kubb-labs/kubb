import { createHmac } from 'node:crypto'
import { type Cache, createCache } from '@kubb/core'
import { Artifact } from '../artifact.ts'

/**
 * Options for {@link turboCache}. Every field falls back to the standard Turborepo
 * environment variable, so secrets stay out of the committed config.
 */
export type TurboCacheOptions = {
  /**
   * Base URL of the remote cache server.
   *
   * @default process.env.TURBO_API
   */
  url?: string
  /**
   * Bearer token sent as `Authorization`.
   *
   * @default process.env.TURBO_TOKEN
   */
  token?: string
  /**
   * Team identifier or slug, sent as the `teamId` query parameter.
   *
   * @default process.env.TURBO_TEAM
   */
  teamId?: string
  /**
   * Secret used to sign uploaded artifacts with an `x-artifact-tag` HMAC. Omit to
   * upload unsigned.
   *
   * @default process.env.TURBO_REMOTE_CACHE_SIGNATURE_KEY
   */
  signatureKey?: string
}

function artifactUrl(url: string, key: string, teamId?: string): string {
  const base = `${url.replace(/\/$/, '')}/v8/artifacts/${key}`
  return teamId ? `${base}?teamId=${encodeURIComponent(teamId)}` : base
}

function sign(signatureKey: string, key: string, body: Uint8Array): string {
  return createHmac('sha256', signatureKey).update(key).update(body).digest('base64')
}

/**
 * Remote cache that speaks the Turborepo Remote Cache HTTP API, so self-hosted
 * Turborepo cache servers and Vercel Remote Cache work as-is. Snapshots travel as a
 * single gzipped artifact keyed by the build fingerprint.
 *
 * Network failures never break a build: a failed download (or a 404) is a miss, and
 * a failed upload logs a warning. Combine with {@link fsCache} via
 * {@link tieredCache} for fast local hits backed by a shared remote cache.
 *
 * @example
 * ```ts
 * import { turboCache, tieredCache, fsCache } from '@kubb/cache'
 *
 * export default defineConfig({
 *   // Reads TURBO_API / TURBO_TOKEN / TURBO_TEAM from the environment.
 *   cache: tieredCache([fsCache(), turboCache()]),
 * })
 * ```
 */
export const turboCache: (options?: TurboCacheOptions) => Cache = createCache((options: TurboCacheOptions = {}) => {
  const url = options.url ?? process.env.TURBO_API
  const token = options.token ?? process.env.TURBO_TOKEN
  const teamId = options.teamId ?? process.env.TURBO_TEAM
  const signatureKey = options.signatureKey ?? process.env.TURBO_REMOTE_CACHE_SIGNATURE_KEY

  function headers(extra?: Record<string, string>): Record<string, string> {
    return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }
  }

  return {
    name: 'turbo',
    async restore({ key }) {
      if (!url) {
        return null
      }
      try {
        const response = await fetch(artifactUrl(url, key, teamId), { headers: headers() })
        if (!response.ok) {
          return null
        }
        return Artifact.deserialize(new Uint8Array(await response.arrayBuffer()))
      } catch {
        return null
      }
    },
    async persist({ key, snapshot }) {
      if (!url) {
        return
      }
      const body = Artifact.serialize(snapshot)
      try {
        const response = await fetch(artifactUrl(url, key, teamId), {
          method: 'PUT',
          headers: headers({
            'Content-Type': 'application/octet-stream',
            'x-artifact-duration': '0',
            ...(signatureKey ? { 'x-artifact-tag': sign(signatureKey, key, body) } : {}),
          }),
          body: new Blob([body]),
        })
        if (!response.ok) {
          console.warn(`[kubb] turboCache: remote upload failed with status ${response.status}`)
        }
      } catch (error) {
        console.warn(`[kubb] turboCache: remote upload failed: ${(error as Error).message}`)
      }
    },
  }
})
