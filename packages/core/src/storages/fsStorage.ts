import { readdir, rename } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { listFiles, read, rm, write } from '@internals/utils'
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
 * - `FileManager.write` bounds in-flight writes, so this driver does not pace itself
 * - `empty` moves the directory aside and deletes it in the background
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
  async readItem(key: string) {
    try {
      return await read(resolve(key))
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
    // An empty list when the base directory does not exist yet.
    return Array.fromAsync(listFiles(resolve(base ?? process.cwd()))).catch(() => [])
  },
  async empty(base?: string) {
    if (!base) {
      return
    }

    const dir = resolve(base)
    // Renaming is near instant, so the slow recursive delete of a large previous output runs
    // alongside the next write instead of before it. Falls back to deleting in place when the
    // rename fails (missing directory, Windows file locks).
    const parent = dirname(dir)
    const prefix = `.${basename(dir)}.kubb-old-`
    try {
      await rename(dir, join(parent, `${prefix}${process.pid}-${Date.now()}`))
    } catch (_error) {
      await rm(dir, { recursive: true, force: true })
      return
    }
    // Deletes this run's trash plus any a killed or failed earlier run left behind, so a failed
    // delete is retried next run instead of lingering.
    const trash = (await readdir(parent)).filter((name) => name.startsWith(prefix))
    void Promise.all(trash.map((name) => rm(join(parent, name), { recursive: true, force: true }))).catch(() => {})
  },
}))
