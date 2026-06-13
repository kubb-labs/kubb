import { access, glob, readFile, rm } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { clean, runtime, toPosixPath, write } from '@internals/utils'
import { createStorage } from '../createStorage.ts'

/**
 * Built-in filesystem storage driver.
 *
 * This is the default storage when no `storage` option is configured in the root config.
 * Keys are resolved against `process.cwd()`, so root-relative paths such as
 * `src/gen/api/getPets.ts` are written to the correct location without extra configuration.
 *
 * Internally uses the `write` utility from `@internals/utils`, which:
 * - trims leading/trailing whitespace before writing
 * - skips the write when file content is already identical (deduplication)
 * - creates missing parent directories automatically
 * - supports Bun's native file API when running under Bun
 *
 * @example
 * ```ts
 * import { fsStorage } from '@kubb/core'
 * import { defineConfig } from 'kubb'
 *
 * export default defineConfig({
 *   input:  { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   storage: fsStorage(),
 * })
 * ```
 */
export const fsStorage = createStorage(() => ({
  name: 'fs',
  async hasItem(key: string) {
    try {
      await access(resolve(key))
      return true
    } catch (_error) {
      return false
    }
  },
  async getItem(key: string) {
    try {
      return await readFile(resolve(key), 'utf8')
    } catch (_error) {
      return null
    }
  },
  async setItem(key: string, value: string) {
    await write(resolve(key), value, { sanity: false })
  },
  async removeItem(key: string) {
    await rm(resolve(key), { force: true })
  },
  async getKeys(base?: string) {
    const resolvedBase = resolve(base ?? process.cwd())

    if (runtime.isBun) {
      const bunGlob = new Bun.Glob('**/*')
      return Array.fromAsync(bunGlob.scan({ cwd: resolvedBase, onlyFiles: true, dot: true }))
    }

    const keys: Array<string> = []
    try {
      for await (const entry of glob('**/*', { cwd: resolvedBase, withFileTypes: true })) {
        if (entry.isFile()) {
          keys.push(toPosixPath(relative(resolvedBase, join(entry.parentPath, entry.name))))
        }
      }
    } catch (_error) {
      // base directory does not exist yet
    }

    return keys
  },
  async clear(base?: string) {
    if (!base) {
      return
    }

    await clean(resolve(base))
  },
}))
