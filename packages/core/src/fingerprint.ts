import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { URLPath } from '@internals/utils'
import type { AdapterSource } from './createAdapter.ts'
import type { Config } from './createKubb.ts'

/**
 * Bumped when the snapshot format or fingerprint inputs change in an incompatible
 * way, so stale cache entries from older Kubb builds are never reused.
 */
export const CACHE_VERSION = 1

/**
 * Deterministically serializes a value to JSON: object keys are sorted recursively
 * and `undefined` values and functions are dropped. Two structurally equal configs
 * produce the same string regardless of key order, which keeps the fingerprint
 * stable across machines.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value))
}

function normalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? undefined : value
  }
  if (Array.isArray(value)) {
    return value.map(normalize)
  }
  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source).sort()) {
    const normalized = normalize(source[key])
    if (normalized !== undefined) {
      result[key] = normalized
    }
  }
  return result
}

/**
 * Reads the spec content that feeds the fingerprint. Returns `null` when any source
 * is a remote URL, since hashing remote content would require fetching it — those
 * inputs disable caching.
 */
async function readSpec(source: AdapterSource, root: string): Promise<unknown> {
  if (source.type === 'data') {
    return { kind: 'data', data: typeof source.data === 'string' ? source.data : stableStringify(source.data) }
  }
  const paths = source.type === 'paths' ? source.paths : [source.path]
  if (paths.some((path) => new URLPath(path).isURL)) {
    return null
  }
  const contents = await Promise.all(
    paths.map(async (path) => ({ path: relative(root, path), content: await readFile(path, 'utf8') })),
  )
  return { kind: 'path', contents }
}

/**
 * Computes a machine-portable cache key from everything that affects the generated
 * output: the spec content, the output-shaping config, each plugin's name and
 * options, the middleware names, the running `@kubb/core` version, and the cache
 * format version. Returns `null` when the input can't be fingerprinted (remote URL
 * or no adapter source), which disables caching for that build.
 */
export async function computeFingerprint({
  config,
  adapterSource,
  version,
}: {
  config: Config
  adapterSource: AdapterSource | null
  version: string
}): Promise<string | null> {
  if (!adapterSource) {
    return null
  }

  const spec = await readSpec(adapterSource, config.root)
  if (spec === null) {
    return null
  }

  const input = {
    cacheVersion: CACHE_VERSION,
    version,
    spec,
    name: config.name,
    output: config.output,
    adapter: config.adapter?.name,
    parsers: config.parsers.map((parser) => parser.name),
    plugins: config.plugins.map((plugin) => ({ name: plugin.name, options: plugin.options })),
    middleware: (config.middleware ?? []).map((middleware) => middleware.name),
  }

  return createHash('sha256').update(stableStringify(input)).digest('hex')
}
