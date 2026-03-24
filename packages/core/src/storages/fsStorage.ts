import type { Dirent } from 'node:fs'
import { access, readdir, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { clean, write } from '@internals/utils'
import { defineStorage } from '../defineStorage.ts'

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
export const fsStorage = defineStorage(() => ({
  name: 'fs',
  async hasItem(key: string) {
    try {
      await access(resolve(key))
      return true
    } catch {
      return false
    }
  },
  async getItem(key: string) {
    try {
      return await readFile(resolve(key), 'utf8')
    } catch {
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
    const keys: Array<string> = []

    async function walk(dir: string, prefix: string): Promise<void> {
      let entries: Array<Dirent>
      try {
        entries = (await readdir(dir, { withFileTypes: true })) as Array<Dirent>
      } catch {
        return
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

    await walk(resolve(base ?? process.cwd()), '')

    return keys
  },
  async clear(base?: string) {
    if (!base) {
      return
    }

    await clean(resolve(base))
  },
}))
