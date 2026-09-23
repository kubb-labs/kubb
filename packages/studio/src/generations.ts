import { createHash } from 'node:crypto'
import { relative, resolve, sep } from 'node:path'
import { inParallel } from '@internals/utils'
import { fsStorage, memoryStorage, type Storage } from '@kubb/core'

/**
 * How many files are read at once while hashing, copying, or snapshotting a file set.
 */
const READ_CONCURRENCY = 50

/**
 * Rebuilds the absolute storage key a root-relative path came from.
 */
export function absoluteStoragePath(root: string, relativePath: string): string {
  return resolve(root, relativePath)
}

/**
 * Short content fingerprint, enough for Studio to tell an unchanged file from a changed one
 * between two sets without fetching either.
 */
export function hashContent(content: string): string {
  return createHash('sha1').update(content).digest('hex').slice(0, 16)
}

/**
 * A set of files keyed by root-relative path. `paths` is the whitelist a read is checked against,
 * so a caller only ever reads what the set holds. `hashes` and `bytes` describe the content even
 * when a set was too large to keep and `paths` is empty.
 */
export type FileSet = {
  storage: Storage
  root: string
  paths: Set<string>
  hashes: Map<string, string>
  bytes: number
  /**
   * Whether `storage` is agent memory, so the set counts against the retention budget. A set read
   * from disk costs nothing to keep.
   */
  inMemory: boolean
}

/**
 * Hashes every file in `paths` and totals their size.
 */
export async function describeFiles(storage: Storage, root: string, paths: Set<string>): Promise<{ hashes: Map<string, string>; bytes: number }> {
  const hashes = new Map<string, string>()
  let bytes = 0
  await inParallel({
    items: [...paths],
    limit: READ_CONCURRENCY,
    run: async (path) => {
      const content = await storage.readItem(absoluteStoragePath(root, path))
      if (content === null) return
      hashes.set(path, hashContent(content))
      bytes += Buffer.byteLength(content)
    },
  })
  return { hashes, bytes }
}

/**
 * Reads every file of `set` that exists.
 */
export async function readFileSet(set: FileSet, paths: Array<string>): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  await inParallel({
    items: paths.filter((path) => set.paths.has(path)),
    limit: READ_CONCURRENCY,
    run: async (path) => {
      const content = await set.storage.readItem(absoluteStoragePath(set.root, path))
      if (content !== null) files[path] = content
    },
  })
  return files
}

/**
 * Copies a set into agent memory, so it outlives files on disk being overwritten. Above
 * `maxBytes` only the hashes are kept.
 */
export async function copyToMemory(set: FileSet, maxBytes: number): Promise<FileSet> {
  if (set.bytes > maxBytes) {
    return { ...set, storage: memoryStorage(), paths: new Set(), inMemory: true }
  }

  const storage = memoryStorage()
  await inParallel({
    items: [...set.paths],
    limit: READ_CONCURRENCY,
    run: async (path) => {
      const key = absoluteStoragePath(set.root, path)
      const content = await set.storage.readItem(key)
      if (content !== null) await storage.writeItem(key, content)
    },
  })
  return { ...set, storage, inMemory: true }
}

/**
 * Whether `outputPath` is a real subdirectory of `root`. Listing the project root or a parent of it
 * would take in every source file, `node_modules` included.
 */
function isInsideRoot(root: string, outputPath: string): boolean {
  const fromRoot = relative(resolve(root), resolve(root, outputPath))
  return fromRoot !== '' && !fromRoot.startsWith('..') && !fromRoot.startsWith(sep)
}

export type CaptureDiskOptions = {
  root: string
  outputPath: string
  /**
   * The run about to start writes to disk, so the content has to be copied now to survive it.
   */
  willOverwrite: boolean
  maxFiles: number
  maxBytes: number
}

/**
 * What the output directory holds on disk before a run. Studio diffs a run against it to show what
 * that run changes, or would change, in the project. Returns `undefined` when the output directory
 * cannot be listed safely or holds more than `maxFiles`.
 */
export async function captureDisk({ root, outputPath, willOverwrite, maxFiles, maxBytes }: CaptureDiskOptions): Promise<FileSet | undefined> {
  if (!isInsideRoot(root, outputPath)) return undefined

  const disk = fsStorage()
  const outputDir = resolve(root, outputPath)
  const keys = await disk.readKeys(outputDir)
  if (keys.length > maxFiles) return undefined

  const paths = new Set(
    keys.filter((key) => !key.split('/').includes('node_modules')).map((key) => relative(resolve(root), resolve(outputDir, key)).replaceAll('\\', '/')),
  )
  const { hashes, bytes } = await describeFiles(disk, root, paths)
  const set: FileSet = { storage: disk, root, paths, hashes, bytes, inMemory: false }

  return willOverwrite ? copyToMemory(set, maxBytes) : set
}

/**
 * Keeps recent generations by job id, newest last. A generation is only ever looked up by the job
 * that produced it, so on a pooled sandbox agent one tenant can never reach another's output
 * through "the previous run": Studio decides which job ids a user may read. The oldest are dropped
 * past `maxCount`, or while the in-memory ones weigh more than `maxBytes`. The newest always stays.
 */
export class GenerationHistory<TGeneration extends { output: FileSet; disk?: FileSet }> {
  readonly #entries = new Map<string, TGeneration>()
  readonly #maxCount: number
  readonly #maxBytes: number

  constructor({ maxCount, maxBytes }: { maxCount: number; maxBytes: number }) {
    this.#maxCount = maxCount
    this.#maxBytes = maxBytes
  }

  get(jobId: string): TGeneration | undefined {
    return this.#entries.get(jobId)
  }

  get latest(): TGeneration | undefined {
    return [...this.#entries.values()].at(-1)
  }

  get size(): number {
    return this.#entries.size
  }

  add(jobId: string, generation: TGeneration): void {
    this.#entries.delete(jobId)
    this.#entries.set(jobId, generation)
    this.#evict()
  }

  /**
   * Swaps a kept generation for another version of it, such as its in-memory copy.
   */
  replace(jobId: string, generation: TGeneration): void {
    if (!this.#entries.has(jobId)) return
    this.#entries.set(jobId, generation)
    this.#evict()
  }

  #weight(): number {
    let bytes = 0
    for (const { output, disk } of this.#entries.values()) {
      // A set kept as hashes only holds no content.
      if (output.inMemory && output.paths.size) bytes += output.bytes
      if (disk?.inMemory && disk.paths.size) bytes += disk.bytes
    }
    return bytes
  }

  #evict(): void {
    while (this.#entries.size > 1 && (this.#entries.size > this.#maxCount || this.#weight() > this.#maxBytes)) {
      const oldest = this.#entries.keys().next().value
      if (oldest === undefined) return
      this.#entries.delete(oldest)
    }
  }
}
