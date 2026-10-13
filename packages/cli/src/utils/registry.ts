import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import {
  checkCompatibility,
  type ExtensionManifest,
  isExtensionManifest,
  isPackageName,
  isRegistryEntry,
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
  if (!/^https?:\/\//.test(url)) throw new Error(`KUBB_REGISTRY must be an http(s) URL, got "${url}".`)
  return url.replace(/\/+$/, '')
}

/**
 * Turns `owner/slug`, or a bare `slug` meaning `kubb-labs/<slug>`, into a registry id.
 *
 * @throws when the id has another shape, so it never reaches a URL unchecked.
 */
export function toRegistryId(input: string): string {
  if (!ID.test(input)) throw new Error(`"${input}" is not a registry id. Use owner/slug, such as kubb-labs/plugin-zod, or a slug, such as plugin-zod.`)
  return input.includes('/') ? input : `kubb-labs/${input}`
}

async function fetchJSON(url: string): Promise<{ status: number; body?: unknown }> {
  try {
    const response = await globalThis.fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) return { status: response.status }
    return { status: response.status, body: (await response.json()) as unknown }
  } catch (cause) {
    throw new Error(`Could not read ${url}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause })
  }
}

/** Fetches one extension's detail document. */
export async function fetchRegistryDetail({ id, registry }: { id: string; registry: string }): Promise<RegistryDetail> {
  const { status, body } = await fetchJSON(`${registry}/${id}.json`)
  if (status === 404) throw new Error(`"${id}" is not in the registry at ${registry}.`)
  if (status !== 200 || !isRegistryEntry(body) || body.id !== id)
    throw new Error(`The registry at ${registry} sent an invalid entry for "${id}" (HTTP ${status}).`)

  const { overview } = body as { overview?: unknown }
  return { ...body, overview: typeof overview === 'string' ? overview : null }
}

/** Fetches the registry index, leaving out entries that fail validation. */
export async function fetchRegistryIndex({ registry }: { registry: string }): Promise<Array<RegistryEntry>> {
  const { status, body } = await fetchJSON(`${registry}/index.json`)
  const extensions = (body as { extensions?: unknown } | null | undefined)?.extensions
  if (status !== 200 || (body as { version?: unknown } | null)?.version !== 1 || !Array.isArray(extensions)) {
    throw new Error(`The registry at ${registry} sent an invalid index (HTTP ${status}).`)
  }
  return extensions.filter(isRegistryEntry)
}

/** Why the running Kubb or Node.js version cannot use this extension, or `undefined` when it can. */
export function incompatibility(manifest: ExtensionManifest): string | undefined {
  try {
    checkCompatibility({ name: manifest.name, compatibility: manifest.compatibility })
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/** Whether `latest` is newer than `installed`. An unknown installed version counts as outdated. */
export function isOutdated({ installed, latest }: { installed: string | undefined; latest: string }): boolean {
  return !installed || !isValid(installed) || isLessThan(installed, latest)
}

export type InstalledPackage = { package: string; version?: string; manifest?: ExtensionManifest }

async function readJSON(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, 'utf8')) as unknown
}

/** The installed package folder, found on disk because an `exports` map may hide its `package.json` and manifest. */
function packageDir(require: NodeRequire, name: string): string | undefined {
  return require.resolve
    .paths(name)
    ?.map((dir) => path.join(dir, name))
    .find((dir) => existsSync(path.join(dir, 'package.json')))
}

/**
 * The `dependencies` and `devDependencies` of the project at `cwd`, with the installed version and
 * the `kubb-extension.json` each one ships, when it does.
 */
export async function readInstalledPackages(cwd: string = process.cwd()): Promise<Array<InstalledPackage>> {
  const packageJSON = (await readJSON(path.join(cwd, 'package.json')).catch(() => ({}))) as Record<string, unknown>
  const names = [packageJSON['dependencies'], packageJSON['devDependencies']].flatMap((record) =>
    typeof record === 'object' && record !== null ? Object.keys(record) : [],
  )
  const require = createRequire(path.join(cwd, 'package.json'))

  return Promise.all(
    [...new Set(names)].filter(isPackageName).map(async (name): Promise<InstalledPackage> => {
      try {
        const dir = packageDir(require, name)
        if (!dir) return { package: name }
        const { version } = (await readJSON(path.join(dir, 'package.json'))) as { version?: unknown }
        const manifest = await readJSON(path.join(dir, 'kubb-extension.json')).catch(() => undefined)
        return { package: name, version: typeof version === 'string' ? version : undefined, manifest: isExtensionManifest(manifest) ? manifest : undefined }
      } catch {
        return { package: name }
      }
    }),
  )
}
