import { createHash } from 'node:crypto'
import { relative, resolve, sep } from 'node:path'
import { inParallel } from '@internals/utils'
import { fsStorage, type Storage } from '@kubb/core'

const READ_CONCURRENCY = 50
const INDEX_KEY = 'studio/generations.json'

/**
 * Files a run produced, or the output directory held, keyed by path relative to `root`.
 */
export type SourceFiles = { storage: Storage; root: string; paths: Set<string> }

/**
 * Which set of a generation to read: what the run produced, or the output directory before it ran.
 */
export type GenerationSource = 'output' | 'disk'

/**
 * A set as kept in the store.
 */
type KeptSet = {
  /**
   * The paths a read is checked against. Empty when the set was too large to keep its content.
   */
  paths: Array<string>
  hashes: Record<string, string>
  bytes: number
}

export type KeptGeneration = {
  jobId: string
  output: KeptSet
  disk?: KeptSet
  peerDependencies: Record<string, string>
  missingDependencies: Array<string>
}

const hashOf = (content: string) => createHash('sha1').update(content).digest('hex').slice(0, 16)

/**
 * What the output directory holds on disk before a run. `undefined` when `outputPath` is not a real
 * subdirectory of `root` (listing the root would take in every source file) or holds more than `maxFiles`.
 */
export async function listDisk({ root, outputPath, maxFiles }: { root: string; outputPath: string; maxFiles: number }): Promise<SourceFiles | undefined> {
  const outputDir = resolve(root, outputPath)
  const fromRoot = relative(resolve(root), outputDir)
  if (!fromRoot || fromRoot.startsWith('..') || fromRoot.startsWith(sep)) return undefined

  const storage = fsStorage()
  const keys = await storage.readKeys(outputDir)
  if (keys.length > maxFiles) return undefined

  const paths = keys
    .filter((key) => !key.split('/').includes('node_modules'))
    .map((key) => relative(resolve(root), resolve(outputDir, key)).replaceAll('\\', '/'))
  return { storage, root, paths: new Set(paths) }
}

/**
 * Keeps recent generations by job id in `storage`, with an index next to them so a store on disk
 * survives a restart. A generation is only ever looked up by its job id, so on a pooled sandbox one
 * tenant never reaches another's output. The oldest go past `maxCount` or `maxBytes`, but the newest
 * always stays.
 */
export function createGenerationStore({ storage, maxCount, maxBytes }: { storage: Storage; maxCount: number; maxBytes: number }) {
  let index: Array<KeptGeneration> | undefined

  // Hashed so a job id from the wire can never point outside the store.
  const dirOf = (jobId: string) => `studio/generations/${hashOf(jobId)}/`

  async function load(): Promise<Array<KeptGeneration>> {
    if (index) return index
    const stored = await storage.readItem(INDEX_KEY).catch(() => null)
    try {
      index = stored ? (JSON.parse(stored) as Array<KeptGeneration>) : []
    } catch {
      index = []
    }
    return index
  }

  /**
   * Copies `files` into the store as one set of `jobId`. Above `maxSetBytes` only the hashes are kept.
   */
  async function keep({
    jobId,
    source,
    files,
    maxSetBytes,
  }: {
    jobId: string
    source: GenerationSource
    files: SourceFiles
    maxSetBytes: number
  }): Promise<KeptSet> {
    const hashes: Record<string, string> = {}
    let bytes = 0
    await inParallel({
      items: [...files.paths],
      limit: READ_CONCURRENCY,
      run: async (path) => {
        // Output outside the root would land outside the store too.
        if (path.split('/').includes('..')) return
        const content = await files.storage.readItem(resolve(files.root, path))
        if (content === null) return
        hashes[path] = hashOf(content)
        bytes += Buffer.byteLength(content)
        if (bytes <= maxSetBytes) await storage.writeItem(`${dirOf(jobId)}${source}/${path}`, content)
      },
    })
    if (bytes > maxSetBytes) {
      await storage.empty(`${dirOf(jobId)}${source}/`)
      return { paths: [], hashes, bytes: 0 }
    }
    return { paths: Object.keys(hashes), hashes, bytes }
  }

  async function drop(jobId: string): Promise<void> {
    await storage.empty(dirOf(jobId))
  }

  return {
    keep,
    drop,
    get: async (jobId: string) => (await load()).find((generation) => generation.jobId === jobId),
    latest: async () => (await load()).at(-1),
    async add(generation: KeptGeneration): Promise<void> {
      const entries = (await load()).filter((entry) => entry.jobId !== generation.jobId)
      entries.push(generation)
      const weight = () => entries.reduce((sum, { output, disk }) => sum + output.bytes + (disk?.bytes ?? 0), 0)
      while (entries.length > 1 && (entries.length > maxCount || weight() > maxBytes)) {
        await drop(entries.shift()!.jobId)
      }
      index = entries
      await storage.writeItem(INDEX_KEY, JSON.stringify(entries))
    },
    /**
     * Reads the requested paths the set holds, skipping any it does not.
     */
    async read({ generation, source, paths }: { generation: KeptGeneration; source: GenerationSource; paths: Array<string> }): Promise<Record<string, string>> {
      const kept = new Set(generation[source]?.paths)
      const files: Record<string, string> = {}
      await inParallel({
        items: paths.filter((path) => kept.has(path)),
        limit: READ_CONCURRENCY,
        run: async (path) => {
          const content = await storage.readItem(`${dirOf(generation.jobId)}${source}/${path}`)
          if (content !== null) files[path] = content
        },
      })
      return files
    },
  }
}

export type GenerationStore = ReturnType<typeof createGenerationStore>
