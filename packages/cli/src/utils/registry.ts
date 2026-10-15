import process from 'node:process'
import { getErrorMessage, toError } from '@internals/utils'
import {
  checkCompatibility,
  Diagnostics,
  type ExtensionManifest,
  isRegistryEntry,
  type RegistryArtifact,
  type RegistryDetail,
  type RegistryEntry,
} from '@kubb/core'
import { isLessThan, isValid } from 'verkit'

export const DEFAULT_REGISTRY = 'https://kubb.dev/registry'

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*'
const ID = new RegExp(`^${SLUG}(\\/${SLUG})?$`)

/** The registry base URL: `KUBB_REGISTRY`, or kubb.dev. */
export function registryUrl(): string {
  const url = process.env.KUBB_REGISTRY || DEFAULT_REGISTRY
  if (!/^https?:\/\//.test(url))
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `KUBB_REGISTRY must be an http(s) URL, got "${url}".`,
      help: 'Set `KUBB_REGISTRY` to an http(s) URL, or unset it to use https://kubb.dev/registry.',
    })
  return url.replace(/\/+$/, '')
}

/**
 * Turns `owner/slug`, or a bare `slug` meaning `kubb-labs/<slug>`, into a registry id.
 *
 * @throws when the id has another shape, so it never reaches a URL unchecked.
 */
export function toRegistryId(input: string): string {
  if (!ID.test(input))
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `"${input}" is not a registry id. Use owner/slug, such as kubb-labs/plugin-zod, or a slug, such as plugin-zod.`,
    })
  return input.includes('/') ? input : `kubb-labs/${input}`
}

/** GETs `url` as JSON. A non-2xx answer returns only its status; a network error throws with the URL. */
async function fetchJSON(url: string): Promise<{ status: number; body?: unknown }> {
  try {
    const response = await globalThis.fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) return { status: response.status }
    return { status: response.status, body: (await response.json()) as unknown }
  } catch (cause) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputUnreachable,
      severity: 'error',
      message: `Could not read ${url}: ${getErrorMessage(cause)}`,
      help: 'Check your network connection and that the registry is reachable.',
      cause: toError(cause),
    })
  }
}

/** Fetches one extension's detail document. */
export async function fetchRegistryDetail({ id, registry }: { id: string; registry: string }): Promise<RegistryDetail> {
  const { status, body } = await fetchJSON(`${registry}/${id}.json`)
  if (status === 404)
    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginNotFound,
      severity: 'error',
      message: `"${id}" is not in the registry at ${registry}.`,
      help: 'Check the id at https://kubb.dev/extensions.',
    })
  if (status !== 200 || !isRegistryEntry(body) || body.id !== id)
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequestFailed,
      severity: 'error',
      message: `The registry at ${registry} sent an invalid entry for "${id}" (HTTP ${status}).`,
      help: 'Try again later, or check that `KUBB_REGISTRY` points at a Kubb registry.',
    })

  const { overview } = body as { overview?: unknown }
  return { ...body, overview: typeof overview === 'string' ? overview : null }
}

/** Fetches the registry index, leaving out entries that fail validation. */
export async function fetchRegistryIndex({ registry }: { registry: string }): Promise<Array<RegistryEntry>> {
  const { status, body } = await fetchJSON(`${registry}/index.json`)
  const index = body as { version?: unknown; extensions?: unknown } | null | undefined
  if (status !== 200 || index?.version !== 1 || !Array.isArray(index.extensions)) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequestFailed,
      severity: 'error',
      message: `The registry at ${registry} sent an invalid index (HTTP ${status}).`,
      help: 'Try again later, or check that `KUBB_REGISTRY` points at a Kubb registry.',
    })
  }
  return index.extensions.filter(isRegistryEntry)
}

/** What the package manager installs: `<package>@<version>`, or a GitHub release's commit, so the install cannot move with the tag. */
export function installSpec(artifact: RegistryArtifact): string {
  return artifact.kind === 'github' ? `github:${artifact.owner}/${artifact.repo}#${artifact.commit}` : `${artifact.package}@${artifact.version}`
}

/** Why the running Kubb or Node.js version cannot use this extension, or `undefined` when it can. */
export function incompatibility(manifest: ExtensionManifest): string | undefined {
  try {
    checkCompatibility({ name: manifest.name, compatibility: manifest.compatibility })
    return undefined
  } catch (error) {
    return getErrorMessage(error)
  }
}

/**
 * Whether `latest` is newer than `installed`. An unknown installed version counts as outdated, and an
 * invalid `latest` never does.
 */
export function isOutdated({ installed, latest }: { installed: string | undefined; latest: string }): boolean {
  if (!isValid(latest)) return false
  return !installed || !isValid(installed) || isLessThan(installed, latest)
}
