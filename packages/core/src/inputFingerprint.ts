import { hash } from 'node:crypto'
import { relative, resolve } from 'node:path'
import { readIfExists, toPosixPath } from '@internals/utils'
import { version as kubbVersion } from '../package.json'
import { readInstalledPackages } from './installedPackages.ts'
import type { Config } from './types.ts'

/**
 * What a build read, as `kubb.lock` records it: one hash over the config, the installed packages and
 * the source files, plus the paths of those files from `root` so the next run can hash them again.
 */
export type InputFingerprint = { hash: string; sources: Array<string> }

/** Per-run and per-machine members of a config, which say nothing about what it generates. */
const SKIPPED_KEYS = new Set(['root', 'storage', 'reporters'])

/**
 * The config as stable text, with every function as its source. `null` when it cannot be written
 * out, such as a getter that throws. Read before the build: an adapter holds more after it parsed.
 */
export function describeConfig(config: Config): string | null {
  const seen = new WeakSet<object>()
  try {
    const text = JSON.stringify(config, (key, value: unknown) => {
      if (SKIPPED_KEYS.has(key)) return undefined
      if (typeof value === 'function' || typeof value === 'bigint' || value instanceof RegExp) return String(value)
      if (value instanceof Map || value instanceof Set) return [...value]
      if (typeof value !== 'object' || value === null) return value
      if (seen.has(value)) return '[circular]'
      seen.add(value)
      return value
    })

    // An absolute path inside the config would give every machine its own hash.
    return text.replaceAll(JSON.stringify(config.root).slice(1, -1), '<root>')
  } catch {
    return null
  }
}

/**
 * Hashes everything a build reads: `configText`, the versions of Kubb and of the packages the project
 * depends on, and the content of each source file. `null` when a source is not a readable local file,
 * such as a URL, because its content cannot be compared without fetching it.
 */
export async function fingerprintInputs({
  root,
  configText,
  sources,
}: {
  root: string
  configText: string
  sources: Array<string>
}): Promise<InputFingerprint | null> {
  const files = [...new Set(sources.map((source) => resolve(root, source)))].sort()
  const contents = await Promise.all(files.map((file) => readIfExists(file).catch(() => null)))
  if (contents.includes(null)) return null

  const packages = (await readInstalledPackages({ root })).map(({ package: name, version }) => `${name}@${version}`).sort()
  const paths = files.map((file) => toPosixPath(relative(root, file)))
  const digests = contents.map((content) => hash('sha256', content!))

  return { hash: hash('sha256', JSON.stringify([kubbVersion, packages, configText, paths, digests])), sources: paths }
}
