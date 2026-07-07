import { access, glob, readFile, rm } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { clean, toPosixPath, write } from '@internals/utils'
import { createStorage } from '../createStorage.ts'

// Caps concurrent writes so a build with thousands of files doesn't open that many file
// descriptors at once.
const WRITE_CONCURRENCY = 50

function createLimiter(concurrency: number) {
  let active = 0
  const queue: Array<() => void> = []

  function next(): void {
    if (active >= concurrency) return
    const run = queue.shift()
    if (!run) return
    active++
    run()
  }

  return function limit<TResult>(task: () => Promise<TResult>): Promise<TResult> {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active--
            next()
          })
      })
      next()
    })
  }
}

/**
 * Built-in filesystem storage driver.
 *
 * This is the default storage when no `storage` option is configured in the root config.
 * Keys are resolved against `process.cwd()`, so root-relative paths such as
 * `src/gen/api/getPets.ts` are written to the correct location without extra configuration.
 *
 * Writes are deduplicated and directory-safe:
 * - leading and trailing whitespace is trimmed before writing
 * - the write is skipped when the file content is already identical
 * - missing parent directories are created automatically
 * - Bun's native file API is used when running under Bun
 * - concurrent `setItem` calls are capped at {@link WRITE_CONCURRENCY} in flight, so a caller
 *   can fire every file's write without pacing itself
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
export const fsStorage = createStorage(() => {
  const limit = createLimiter(WRITE_CONCURRENCY)

  return {
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
      await limit(() => write(resolve(key), value, { sanity: false }))
    },
    async removeItem(key: string) {
      await rm(resolve(key), { force: true })
    },
    async getKeys(base?: string) {
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
    async clear(base?: string) {
      if (!base) {
        return
      }

      await clean(resolve(base))
    },
  }
})
