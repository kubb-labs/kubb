import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Bumped whenever the stored shape changes, so an older cache is discarded instead of misread.
 */
const VERSION = 1

/**
 * How one generated file looked on either side of the output passes.
 */
export type OutputManifestEntry = {
  /**
   * Hash of the content Kubb handed to the storage.
   */
  source: string
  /**
   * Hash of what sat on disk once the formatter, linter, and `postGenerate` were done with it.
   */
  output: string
}

type ManifestData = {
  version: number
  entries: Record<string, OutputManifestEntry>
}

/**
 * Remembers what the output passes did to each generated file, so the next run can tell
 * "the formatter already turned this exact source into what is on disk" apart from a real change.
 *
 * The storage skips a write when the content it is about to write already matches the file. That
 * check can never match on its own once a formatter has run, because the bytes on disk are the
 * formatter's, not Kubb's, and the whole output tree is rewritten on every build.
 */
export type OutputManifest = {
  /**
   * `true` when `source` is known to come out of the output passes as exactly the content already
   * on disk, meaning the write can be skipped.
   */
  isUpToDate(options: { key: string; source: string; disk: string }): boolean
  /**
   * Records the source Kubb produced for `key` this run, whether or not it was written.
   */
  track(options: { key: string; source: string }): void
  /**
   * Re-reads every tracked file after the output passes and persists the source/output pairs.
   * Entries from earlier runs are kept while their file is still there, so a second config
   * generating into the same root does not evict the first one's, and deleted files do not
   * accumulate.
   */
  commit(options: { read: (key: string) => Promise<string | null>; exists: (key: string) => Promise<boolean> }): Promise<void>
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Where the cache for a project root lives. It sits under `node_modules/.cache`, the convention
 * babel and eslint already use, so it stays out of version control and out of reach of
 * `output.clean`.
 */
export function resolveOutputManifestPath(root: string): string {
  return join(root, 'node_modules', '.cache', 'kubb', 'output-manifest.json')
}

async function loadEntries(path: string): Promise<Record<string, OutputManifestEntry>> {
  try {
    const data = JSON.parse(await readFile(path, { encoding: 'utf-8' })) as ManifestData
    return data.version === VERSION ? data.entries : {}
  } catch {
    return {}
  }
}

/**
 * Loads the cache at `path`, or starts empty when it is missing, unreadable, or written by an
 * older version of Kubb.
 *
 * @example
 * ```ts
 * const manifest = await createOutputManifest({ path: resolveOutputManifestPath(config.root) })
 * ```
 */
export async function createOutputManifest({ path }: { path: string }): Promise<OutputManifest> {
  const entries = await loadEntries(path)
  const tracked = new Map<string, string>()

  return {
    isUpToDate({ key, source, disk }) {
      const entry = entries[key]
      if (!entry) return false

      return entry.source === hash(source) && entry.output === hash(disk)
    },
    track({ key, source }) {
      tracked.set(key, hash(source))
    },
    async commit({ read, exists }) {
      const next: Record<string, OutputManifestEntry> = {}

      for (const [key, entry] of Object.entries(entries)) {
        if (tracked.has(key)) continue
        if (await exists(key)) next[key] = entry
      }

      for (const [key, source] of tracked) {
        const disk = await read(key)
        if (disk === null) continue

        next[key] = { source, output: hash(disk) }
      }

      try {
        await mkdir(dirname(path), { recursive: true })
        await writeFile(path, JSON.stringify({ version: VERSION, entries: next } satisfies ManifestData), { encoding: 'utf-8' })
      } catch {
        /* a missing or read-only node_modules costs the optimization, not the build */
      }
    },
  }
}
