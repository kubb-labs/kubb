import type { Dirent } from 'node:fs'
import { access, readdir, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { clean, write } from '@internals/utils'
import { createStorage } from '../createStorage.ts'

/**
 * Detects the filesystem error used to indicate that a path does not exist.
 */
function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT'
}

/**
 * Built-in filesystem storage driver.
 *
 * This is the default storage when no `storage` option is configured in `output`.
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
 * import { defineConfig, fsStorage } from '@kubb/core'
 *
 * export default defineConfig({
 *   input:  { path: './petStore.yaml' },
 *   output: { path: './src/gen', storage: fsStorage() },
 * })
 * ```
 */
export const fsStorage = createStorage(() => ({
  name: 'fs',
  async hasItem(key: string) {
    try {
      await access(resolve(key))
      return true
    } catch (error) {
      if (isMissingPathError(error)) {
        return false
      }

      throw new Error(`Failed to access storage item "${key}"`, { cause: error as Error })
    }
  },
  async getItem(key: string) {
    try {
      return await readFile(resolve(key), 'utf8')
    } catch (error) {
      if (isMissingPathError(error)) {
        return null
      }

      throw new Error(`Failed to read storage item "${key}"`, { cause: error as Error })
    }
  },
  async setItem(key: string, value: string) {
    await write(resolve(key), value, { sanity: false })
  },
  async removeItem(key: string) {
    await rm(resolve(key), { force: true })
  },
  async getKeys(base?: string) {
    const keys: Array<string> = []
    const resolvedBase = resolve(base ?? process.cwd())

    async function walk(dir: string, prefix: string): Promise<void> {
      let entries: Array<Dirent>
      try {
        entries = (await readdir(dir, { withFileTypes: true })) as Array<Dirent>
      } catch (error) {
        if (isMissingPathError(error)) {
          return
        }

        throw new Error(`Failed to list storage keys under "${resolvedBase}"`, { cause: error as Error })
      }
      for (const entry of entries) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
          await walk(join(dir, entry.name), rel)
        } else {
          keys.push(rel)
        }
      }
    }

    await walk(resolvedBase, '')

    return keys
  },
  async clear(base?: string) {
    if (!base) {
      return
    }

    await clean(resolve(base))
  },
}))
