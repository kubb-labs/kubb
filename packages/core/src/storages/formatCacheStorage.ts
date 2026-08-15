import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { DefineStorage } from '../defineStorage.ts'

type FormatCacheStorageOptions = {
  /**
   * The storage to delegate the actual reads and writes to.
   */
  storage: DefineStorage
  /**
   * Where the manifest of previously written content hashes is persisted.
   */
  manifestPath: string
}

/**
 * Wraps a storage so a file already written and reformatted by a separate formatting pass (e.g.
 * the CLI's `output.format`) is recognized as unchanged on the next build, even though its bytes
 * on disk no longer match what Kubb generates before formatting runs.
 *
 * A formatting pass typically reformats the whole output directory after every file is written,
 * so the underlying storage's own unchanged-content check — comparing the freshly generated text
 * against what is on disk — never matches once a formatter has reflowed a file (added semicolons,
 * changed quotes, reordered imports): the bytes it compares against are the formatter's, not the
 * ones Kubb wrote. This keeps its own manifest of the pre-format hash last written for each path
 * and skips the underlying write when the freshly generated content hashes the same and the file
 * is still present, leaving the previous, already-formatted file untouched.
 *
 * The manifest is persisted once, from `dispose()`, instead of on every `setItem` call — callers
 * must invoke `dispose()` after a build completes for the cache to be saved.
 */
export function formatCacheStorage({ storage, manifestPath }: FormatCacheStorageOptions): DefineStorage {
  let manifest: Record<string, string> | undefined
  let dirty = false

  async function loadManifest(): Promise<Record<string, string>> {
    if (manifest) {
      return manifest
    }

    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf-8')) as Record<string, string>
    } catch {
      manifest = {}
    }

    return manifest
  }

  function hash(value: string): string {
    return createHash('sha256').update(value.trim()).digest('hex')
  }

  return {
    ...storage,
    async setItem(key, value) {
      const entries = await loadManifest()
      const digest = hash(value)

      if (entries[key] === digest && (await storage.hasItem(key))) {
        return
      }

      await storage.setItem(key, value)
      entries[key] = digest
      dirty = true
    },
    async dispose() {
      if (dirty && manifest) {
        await mkdir(dirname(manifestPath), { recursive: true })
        await writeFile(manifestPath, JSON.stringify(manifest), 'utf-8')
        dirty = false
      }

      await storage.dispose?.()
    },
  }
}
