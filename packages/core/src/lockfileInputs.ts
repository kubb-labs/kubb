import { hash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { readIfExists, toPosixPath } from '@internals/utils'
import { version as kubbVersion } from '../package.json'
import { readInstalledPackages } from './installedPackages.ts'
import type { Config } from './types.ts'

/** What a build read, as `kubb.lock` records it: one hash, plus the source files to hash again on the next run. */
export type LockfileInputs = { hash: string; sources: Array<string> }

/** Per-run and per-machine members of a config, which say nothing about what it generates. */
const SKIPPED_KEYS = new Set(['root', 'storage', 'reporters'])

/** A value `JSON.stringify` would drop or flatten, in a form that keeps what it holds. */
function toSerializable(value: unknown): unknown {
  if (typeof value === 'function' || typeof value === 'bigint' || value instanceof RegExp) return String(value)
  if (value instanceof Map || value instanceof Set) return [...value]
  return value
}

/**
 * The config as stable text, with every function as its source. `null` when it cannot be written
 * out, such as a getter that throws. Read before the build: an adapter holds more after it parsed.
 */
export function serializeConfig(config: Config): string | null {
  const seen = new WeakSet<object>()
  try {
    // An adapter keeps the document it parsed, which is the spec and not the config.
    const adapter = config.adapter && { name: config.adapter.name, options: config.adapter.options }
    const text = JSON.stringify({ ...config, adapter }, (key, raw: unknown) => {
      if (SKIPPED_KEYS.has(key)) return undefined
      const value = toSerializable(raw)
      if (typeof value !== 'object' || value === null) return value
      if (seen.has(value)) return '[circular]'
      seen.add(value)
      return value
    })

    // An absolute path or a CRLF line ending inside the config would give every machine its own hash.
    return text.replaceAll(JSON.stringify(config.root).slice(1, -1), '<root>').replaceAll('\\r\\n', '\\n')
  } catch {
    return null
  }
}

/**
 * The installed version of every package the project depends on, read from each `package.json` from
 * `root` up, so a workspace root counts too. `null` when there is none to read.
 */
async function readPackageVersions(root: string): Promise<Array<string> | null> {
  const roots: Array<string> = []
  for (let dir = resolve(root); ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) roots.push(dir)
    if (dir === dirname(dir)) break
  }
  if (!roots.length) return null

  const packages = await Promise.all(roots.map((dir) => readInstalledPackages({ root: dir })))

  return [...new Set(packages.flat().map(({ package: name, version }) => `${name}@${version}`))].sort()
}

/** The content of `file`, or `null` when it cannot be read or changed after `since`. */
async function readSource({ file, since }: { file: string; since?: number }): Promise<string | null> {
  try {
    if (since !== undefined && (await stat(file)).mtimeMs > since) return null

    return await readIfExists(file)
  } catch {
    return null
  }
}

/**
 * Hashes everything a build reads: `configText`, the versions of Kubb and of the project's
 * dependencies, and each source file. `null` when that cannot be told: a source that is not a
 * readable local file, such as a URL, one that changed after `since`, or no `package.json`.
 */
export async function hashInputs({
  root,
  configText,
  sources,
  since,
}: {
  root: string
  configText: string
  sources: Array<string>
  /** When the build started, in milliseconds. A source saved later is not what the build read. */
  since?: number
}): Promise<LockfileInputs | null> {
  const files = [...new Set(sources.map((source) => resolve(root, source)))].sort()
  const [packages, ...contents] = await Promise.all([readPackageVersions(root), ...files.map((file) => readSource({ file, since }))])
  if (!packages || contents.includes(null)) return null

  const paths = files.map((file) => toPosixPath(relative(root, file)))
  // Line endings are normalized, so a checkout that converts them gets the same hash.
  const digests = contents.map((content) => hash('sha256', content!.replaceAll('\r\n', '\n')))

  return { hash: hash('sha256', JSON.stringify([kubbVersion, packages, configText, paths, digests])), sources: paths }
}
