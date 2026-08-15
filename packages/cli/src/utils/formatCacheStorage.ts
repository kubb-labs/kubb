import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { DefineStorage } from '@kubb/core'

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
 * Wraps a storage so a file already written and reformatted by `output.format`'s CLI pass is
 * recognized as unchanged on the next build, even though its bytes on disk no longer match what
 * Kubb generates before formatting runs.
 *
 * `output.format` runs as a separate pass over the whole output directory after every file is
 * written, so the underlying storage's own unchanged-content check — comparing the freshly
 * generated text against what is on disk — never matches once a formatter has reflowed a file
 * (added semicolons, changed quotes, reordered imports): the bytes it compares against are the
 * formatter's, not the ones Kubb wrote. This keeps its own manifest of the pre-format hash last
 * written for each path and skips the underlying write when the freshly generated content hashes
 * the same, leaving the previous, already-formatted file untouched.
 */
export function formatCacheStorage({ storage, manifestPath }: FormatCacheStorageOptions): DefineStorage {
  let manifest: Record<string, string> | undefined

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

  async function saveManifest(): Promise<void> {
    if (!manifest) {
      return
    }

    await mkdir(dirname(manifestPath), { recursive: true })
    await writeFile(manifestPath, JSON.stringify(manifest), 'utf-8')
  }

  function hash(value: string): string {
    return createHash('sha256').update(value.trim()).digest('hex')
  }

  return {
    ...storage,
    async setItem(key, value) {
      const entries = await loadManifest()
      const digest = hash(value)

      if (entries[key] === digest) {
        return
      }

      await storage.setItem(key, value)
      entries[key] = digest
      await saveManifest()
    },
  }
}
