import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * On-disk layout version for the manifest itself. Bumped when the manifest shape
 * changes; a mismatch makes the whole local cache read as empty.
 */
export const MANIFEST_VERSION = 1

/**
 * Bookkeeping for one cached build: the relative paths it covers and timestamps
 * used by the pruner.
 */
export type ManifestEntry = {
  files: Array<string>
  createdAt: number
  lastAccess: number
}

export type Manifest = {
  version: number
  entries: Record<string, ManifestEntry>
}

function emptyManifest(): Manifest {
  return { version: MANIFEST_VERSION, entries: {} }
}

/**
 * Reads the manifest at `dir/manifest.json`. A missing, corrupt, or version-mismatched
 * file reads as an empty manifest, so a damaged cache degrades to misses instead of throwing.
 */
export async function readManifest(dir: string): Promise<Manifest> {
  try {
    const parsed = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')) as Manifest
    if (parsed.version !== MANIFEST_VERSION || typeof parsed.entries !== 'object') {
      return emptyManifest()
    }
    return parsed
  } catch {
    return emptyManifest()
  }
}

/**
 * Writes `file` atomically: contents go to a unique temp file in the same directory,
 * then a rename swaps it into place so a concurrent reader never sees a half-written file.
 */
export async function writeFileAtomic(file: string, data: string | Buffer): Promise<void> {
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.${randomBytes(6).toString('hex')}.tmp`
  await writeFile(tmp, data)
  await rename(tmp, file)
}

/**
 * Persists the manifest to `dir/manifest.json` atomically.
 */
export async function writeManifest(dir: string, manifest: Manifest): Promise<void> {
  await writeFileAtomic(join(dir, 'manifest.json'), JSON.stringify(manifest))
}

/**
 * Selects the keys to evict so the cache stays within `ttlDays` and `maxEntries`.
 * Returns the surviving manifest plus the evicted keys (the caller deletes their blobs).
 * Pure — does no IO.
 */
export function prune(
  manifest: Manifest,
  { maxEntries, ttlDays, now }: { maxEntries: number; ttlDays: number; now: number },
): {
  manifest: Manifest
  removed: Array<string>
} {
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000
  const entries = Object.entries(manifest.entries)
  const removed: Array<string> = []
  const kept: Array<[string, ManifestEntry]> = []

  for (const [key, entry] of entries) {
    if (now - entry.lastAccess > ttlMs) {
      removed.push(key)
    } else {
      kept.push([key, entry])
    }
  }

  if (kept.length > maxEntries) {
    kept.sort((a, b) => b[1].lastAccess - a[1].lastAccess)
    for (const [key] of kept.splice(maxEntries)) {
      removed.push(key)
    }
  }

  return { manifest: { version: MANIFEST_VERSION, entries: Object.fromEntries(kept) }, removed }
}
