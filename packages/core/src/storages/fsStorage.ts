import { glob, readFile, rm } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { clean, exists, toPosixPath, write } from '@internals/utils'
import { createStorage } from '../createStorage.ts'

/**
 * Built-in filesystem storage driver.
 *
 * This is the default storage when no `storage` option is configured in the root config.
 * Keys are resolved against `process.cwd()`, so root-relative paths such as
 * `src/gen/api/getPets.ts` are written to the correct location without extra configuration.
 *
 * Writes are deduplicated and directory-safe:
 * - leading and trailing whitespace is trimmed before writing
 * - the write is skipped when the file already holds that content, ignoring any trailing newline
 *   a formatter left behind
 * - missing parent directories are created automatically
 * - Bun's native file API is used when running under Bun
 *
 * `FileManager.write` bounds how many writes are in flight at once, so this driver does not
 * pace itself.
 *
 * @example
 * ```ts
 * import { fsStorage } from '@kubb/core'
 * import { defineConfig } from 'kubb'
 *
 * export default defineConfig({
 *   input:  './petStore.yaml',
 *   output: { path: './src/gen' },
 *   storage: fsStorage(),
 * })
 * ```
 */
export const fsStorage = createStorage(() => ({
  name: 'fs',
  async existsItem(key: string) {
    return exists(resolve(key))
  },
  async readItem(key: string) {
    try {
      return await readFile(resolve(key), 'utf8')
    } catch (_error) {
      return null
    }
  },
  async writeItem(key: string, value: string, options?: { stored?: string | null }) {
    await write(resolve(key), value, { sanity: false, stored: options?.stored })
  },
  async removeItem(key: string) {
    await rm(resolve(key), { force: true })
  },
  async readKeys(base?: string) {
    const resolvedBase = resolve(base ?? process.cwd())
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
  async empty(base?: string) {
    if (!base) {
      return
    }

    await clean(resolve(base))
  },
}))
