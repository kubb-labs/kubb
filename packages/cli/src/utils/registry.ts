import process from 'node:process'
import { getErrorMessage, toError } from '@internals/utils'
import { checkCompatibility, Diagnostics, type ExtensionManifest, isRegistryEntry, type RegistryArtifact, type RegistryEntry } from '@kubb/core'
import { difference, isLessThan, isValid } from 'verkit'
import { isHttpUrl } from '../ui/text.ts'

const DEFAULT_REGISTRY = 'https://kubb.dev/registry'

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*'
const ID = new RegExp(`^${SLUG}(\\/${SLUG})?$`)

/** The registry base URL: `KUBB_REGISTRY`, or kubb.dev. */
export function registryUrl(): string {
  const url = process.env.KUBB_REGISTRY || DEFAULT_REGISTRY
  if (!isHttpUrl(url))
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

/** The shortest id `kubb add` and `kubb update` accept: the slug for an official extension, else `owner/slug`. */
export function toShortId(id: string): string {
  return id.startsWith('kubb-labs/') ? id.slice('kubb-labs/'.length) : id
}

/**
 * GETs `url` as JSON. A non-2xx answer or a body that is not JSON returns no `body`.
 * A network error throws with the URL.
 */
async function fetchJSON(url: string): Promise<{ status: number; body?: unknown }> {
  let response: Response
  try {
    response = await globalThis.fetch(url, { headers: { accept: 'application/json' } })
  } catch (cause) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputUnreachable,
      severity: 'error',
      message: `Could not read ${url}: ${getErrorMessage(cause)}`,
      help: 'Check your network connection and that the registry is reachable.',
      cause: toError(cause),
    })
  }
  if (!response.ok) return { status: response.status }
  return { status: response.status, body: await response.json().catch(() => undefined) }
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

/** `major`, `minor`, or `patch` from `installed` to `latest`, or `undefined` when either is unknown or invalid. */
export function bumpOf({ installed, latest }: { installed: string | undefined; latest: string }): 'major' | 'minor' | 'patch' | undefined {
  if (!installed || !isValid(installed) || !isValid(latest)) return undefined
  const kind = difference(installed, latest)
  if (!kind) return undefined
  if (kind.endsWith('major')) return 'major'
  return kind.endsWith('minor') ? 'minor' : 'patch'
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]!
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1))
      previous = current
    }
  }
  return row[b.length]!
}

/** Words every extension shares, so they never make two ids look alike. */
const COMMON_TOKENS = new Set(['kubb', 'plugin', 'adapter', 'parser'])

/**
 * The ids closest to a mistyped `input`, best first, at most three: those within a few edits of it,
 * or sharing a word such as `zod` in any order. Compares slugs, so the owner may be left out.
 */
export function closestIds({ input, ids }: { input: string; ids: Array<string> }): Array<string> {
  const slug = (id: string) => id.slice(id.indexOf('/') + 1)
  const tokens = new Set(
    slug(input)
      .split('-')
      .filter((token) => !COMMON_TOKENS.has(token)),
  )
  return ids
    .map((id) => ({
      id,
      distance: editDistance(slug(input), slug(id)),
      shared: slug(id)
        .split('-')
        .some((token) => tokens.has(token)),
    }))
    .filter(({ distance, shared }) => shared || distance <= Math.max(2, Math.floor(slug(input).length / 4)))
    .sort((a, b) => Number(b.shared) - Number(a.shared) || a.distance - b.distance)
    .slice(0, 3)
    .map(({ id }) => id)
}
