import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { URLPath } from '@internals/utils'
import type { AdapterSource } from './createAdapter.ts'
import type { Config } from './types.ts'

/**
 * Computes the cache key for an incremental build. All methods are static, so call them as
 * `Fingerprint.compute(...)` and `Fingerprint.stringify(...)`. The key holds no absolute
 * paths or modification times, so it never depends on where the project lives on disk.
 */
export class Fingerprint {
  /**
   * Bumped when the snapshot format or fingerprint inputs change in an incompatible way, so stale
   * cache entries from older Kubb builds are never reused.
   */
  static version = 1

  /**
   * Deterministically serializes a value to JSON: object keys are sorted recursively and
   * `undefined` values and functions are dropped. Two structurally equal configs produce the same
   * string regardless of key order, which keeps the fingerprint stable across machines.
   */
  static stringify(value: unknown): string {
    return JSON.stringify(Fingerprint.#normalize(value))
  }

  /**
   * Computes a cache key from everything that affects the generated output: the spec content, the
   * output-shaping config, each plugin's name and options, the running
   * `@kubb/core` version, and the cache format version. Returns `null` when the input can't be
   * fingerprinted (remote URL or no adapter source), which disables caching for that build.
   */
  static async compute({ config, adapterSource, version }: { config: Config; adapterSource: AdapterSource | null; version: string }): Promise<string | null> {
    if (!adapterSource) {
      return null
    }

    const spec = await Fingerprint.#readSpec(adapterSource, config.root)
    if (spec === null) {
      return null
    }

    const input = {
      cacheVersion: Fingerprint.version,
      version,
      spec,
      name: config.name,
      output: config.output,
      adapter: config.adapter?.name,
      parsers: config.parsers.map((parser) => parser.name),
      plugins: config.plugins.map((plugin) => ({ name: plugin.name, options: plugin.options })),
    }

    return createHash('sha256').update(Fingerprint.stringify(input)).digest('hex')
  }

  static #normalize(value: unknown): unknown {
    if (value === null || typeof value !== 'object') {
      return typeof value === 'function' ? undefined : value
    }
    if (Array.isArray(value)) {
      return value.map((item) => Fingerprint.#normalize(item))
    }
    const source = value as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) {
      const normalized = Fingerprint.#normalize(source[key])
      if (normalized !== undefined) {
        result[key] = normalized
      }
    }
    return result
  }

  /**
   * Reads the spec content that feeds the fingerprint. Returns `null` for a remote URL source
   * (hashing remote content would mean fetching it on every run) or when a file can't be read, so a
   * missing or virtual spec disables caching instead of failing the build.
   */
  static async #readSpec(source: AdapterSource, root: string): Promise<unknown> {
    if (source.type === 'data') {
      return { kind: 'data', data: typeof source.data === 'string' ? source.data : Fingerprint.stringify(source.data) }
    }
    const paths = source.type === 'paths' ? source.paths : [source.path]
    if (paths.some((path) => new URLPath(path).isURL)) {
      return null
    }
    try {
      const contents = await Promise.all(paths.map(async (path) => ({ path: relative(root, path), content: await readFile(path, 'utf8') })))
      return { kind: 'path', contents }
    } catch {
      return null
    }
  }
}
