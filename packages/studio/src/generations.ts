import { createHash } from 'node:crypto'
import { relative, resolve, sep } from 'node:path'
import { inParallel } from '@internals/utils'
import { fsStorage, memoryStorage, type Storage } from '@kubb/core'

const READ_CONCURRENCY = 50

/**
 * A set of files keyed by root-relative path. `paths` is the whitelist a read is checked against,
 * so a caller only ever reads what the set holds. `hashes` describe the content even when a set was
 * too large to keep and `paths` is empty.
 */
export type FileSet = {
  storage: Storage
  root: string
  paths: Set<string>
  hashes: Map<string, string>
  bytes: number
  /**
   * Whether `storage` is agent memory, so the set counts against the retention budget.
   */
  inMemory: boolean
}

type Generation = { output: FileSet; disk?: FileSet }

export async function describeFiles({
  storage,
  root,
  paths,
}: {
  storage: Storage
  root: string
  paths: Set<string>
}): Promise<{ hashes: Map<string, string>; bytes: number }> {
  const hashes = new Map<string, string>()
  let bytes = 0
  await inParallel({
    items: [...paths],
    limit: READ_CONCURRENCY,
    run: async (path) => {
      const content = await storage.readItem(resolve(root, path))
      if (content === null) return
      hashes.set(path, createHash('sha1').update(content).digest('hex').slice(0, 16))
      bytes += Buffer.byteLength(content)
    },
  })
  return { hashes, bytes }
}

export async function readFileSet({ set, paths }: { set: FileSet; paths: Array<string> }): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  await inParallel({
    items: paths.filter((path) => set.paths.has(path)),
    limit: READ_CONCURRENCY,
    run: async (path) => {
      const content = await set.storage.readItem(resolve(set.root, path))
      if (content !== null) files[path] = content
    },
  })
  return files
}

/**
 * Copies a set into agent memory, so it outlives files on disk being overwritten. Above
 * `maxBytes` only the hashes are kept.
 */
export async function copyToMemory({ set, maxBytes }: { set: FileSet; maxBytes: number }): Promise<FileSet> {
  const storage = memoryStorage()
  if (set.bytes > maxBytes) {
    return { ...set, storage, paths: new Set(), bytes: 0, inMemory: true }
  }

  await inParallel({
    items: [...set.paths],
    limit: READ_CONCURRENCY,
    run: async (path) => {
      const key = resolve(set.root, path)
      const content = await set.storage.readItem(key)
      if (content !== null) await storage.writeItem(key, content)
    },
  })
  return { ...set, storage, inMemory: true }
}

/**
 * What the output directory holds on disk before a run, so Studio can diff a run against it.
 * `undefined` when `outputPath` is not a real subdirectory of `root` (listing the root would take in
 * every source file) or holds more than `maxFiles`. `willOverwrite` copies the content now, so it
 * survives the run.
 */
export async function captureDisk({
  root,
  outputPath,
  willOverwrite,
  maxFiles,
  maxBytes,
}: {
  root: string
  outputPath: string
  willOverwrite: boolean
  maxFiles: number
  maxBytes: number
}): Promise<FileSet | undefined> {
  const outputDir = resolve(root, outputPath)
  const fromRoot = relative(resolve(root), outputDir)
  if (!fromRoot || fromRoot.startsWith('..') || fromRoot.startsWith(sep)) return undefined

  const storage = fsStorage()
  const keys = await storage.readKeys(outputDir)
  if (keys.length > maxFiles) return undefined

  const paths = new Set(
    keys.filter((key) => !key.split('/').includes('node_modules')).map((key) => relative(resolve(root), resolve(outputDir, key)).replaceAll('\\', '/')),
  )
  const set: FileSet = { storage, root, paths, ...(await describeFiles({ storage, root, paths })), inMemory: false }

  return willOverwrite ? copyToMemory({ set, maxBytes }) : set
}

/**
 * Keeps recent generations by job id, newest last. A generation is only ever looked up by the job
 * that produced it, so on a pooled sandbox agent one tenant can never reach another's output
 * through "the previous run": Studio decides which job ids a user may read. The oldest are dropped
 * past `maxCount`, or while the in-memory ones weigh more than `maxBytes`. The newest always stays.
 */
export function createGenerationHistory<TGeneration extends Generation>({ maxCount, maxBytes }: { maxCount: number; maxBytes: number }) {
  const entries = new Map<string, TGeneration>()

  const bytesInMemory = () => [...entries.values()].flatMap(({ output, disk }) => [output, disk]).reduce((sum, set) => sum + (set?.inMemory ? set.bytes : 0), 0)

  return {
    get: (jobId: string): TGeneration | undefined => entries.get(jobId),
    latestJobId: (): string | undefined => [...entries.keys()].at(-1),
    set(jobId: string, generation: TGeneration): void {
      entries.delete(jobId)
      entries.set(jobId, generation)
      while (entries.size > 1 && (entries.size > maxCount || bytesInMemory() > maxBytes)) {
        entries.delete(entries.keys().next().value!)
      }
    },
  }
}
