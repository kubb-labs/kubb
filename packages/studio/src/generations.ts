import { createHash } from 'node:crypto'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { inParallel } from '@internals/utils'
import { ast, type InputNode } from '@kubb/ast'
import { type Adapter, type Config, createKubb, type Diagnostic, Diagnostics, fsStorage, type Hookable, type KubbHooks, type Storage } from '@kubb/core'
import type { FilePage, FileSource, ReadFilesResult } from './protocol.ts'

const READ_CONCURRENCY = 50
const MB = 1024 * 1024
const INDEX_KEY = 'studio/generations.json'

/**
 * Files a run produced, or the output directory held, keyed by path relative to `root`.
 */
export type SourceFiles = { storage: Storage; root: string; paths: Set<string> }

/**
 * The path form {@link SourceFiles} keys on: relative to `root`, with forward slashes.
 */
export function relativeStoragePath({ root, filePath }: { root: string; filePath: string }): string {
  return (isAbsolute(filePath) ? relative(resolve(root), filePath) : filePath).replaceAll('\\', '/')
}

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

type KeptGeneration = {
  jobId: string
  /** When the store took it, in epoch milliseconds. Absent on an index written before it existed. */
  keptAt?: number
  output: KeptSet
  disk?: KeptSet
  /** Size of the kept `input.json`. Absent when no input was kept. */
  inputBytes?: number
}

/**
 * The content fingerprint Studio compares snapshots by. Agent runs and CI uploads must agree on it.
 */
export const hashOf = (content: string) => createHash('sha1').update(content).digest('hex').slice(0, 16)

const totalBytes = (entries: Array<KeptGeneration>) =>
  entries.reduce((sum, { output, disk, inputBytes }) => sum + output.bytes + (disk?.bytes ?? 0) + (inputBytes ?? 0), 0)

function positiveNumber(value: string | undefined): number | undefined {
  const parsed = Number(value)
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * How many generations an agent keeps and how large they may get, read from
 * `KUBB_AGENT_MAX_GENERATIONS`, `KUBB_AGENT_MAX_GENERATIONS_MB` and `KUBB_AGENT_MAX_SNAPSHOT_MB`.
 * An unset or invalid value keeps the default.
 */
export function resolveGenerationLimits(): { maxCount: number; maxMb: number; maxSnapshotMb: number } {
  return {
    maxCount: Math.max(1, Math.floor(positiveNumber(process.env.KUBB_AGENT_MAX_GENERATIONS) ?? 8)),
    maxMb: positiveNumber(process.env.KUBB_AGENT_MAX_GENERATIONS_MB) ?? 100,
    maxSnapshotMb: positiveNumber(process.env.KUBB_AGENT_MAX_SNAPSHOT_MB) ?? 50,
  }
}

/**
 * Folds error-severity diagnostics into one thrown error so logs name the failing plugin or pass.
 */
function generationFailure(diagnostics: ReadonlyArray<Diagnostic>): Error {
  const reasons = diagnostics
    .filter(Diagnostics.isProblem)
    .filter((diagnostic) => diagnostic.severity === 'error')
    .map((diagnostic) => (diagnostic.plugin ? `${diagnostic.plugin}: ${diagnostic.message}` : diagnostic.message))

  if (!reasons.length) return new Error('Generation failed')

  return new Error(`Generation failed: ${reasons.length} error${reasons.length === 1 ? '' : 's'}: ${reasons.join('; ')}`)
}

/**
 * Runs one generation and returns the files it produced. The formatter, the linter, and
 * `output.postGenerate` only run with `allowExec`. Throws when any plugin reports an error.
 */
export async function generate({
  config,
  hooks,
  signal,
  allowExec,
}: {
  config: Config
  hooks?: Hookable<KubbHooks>
  signal?: AbortSignal
  allowExec: boolean
}): Promise<SourceFiles & { input: InputNode | null }> {
  const output = allowExec ? config.output : { ...config.output, format: false as const, lint: false as const, postGenerate: [] }
  // The driver drops its `InputNode` once the build ends, so keep the one the adapter returns.
  let input: InputNode | null = null
  const adapter = config.adapter && {
    ...config.adapter,
    parse: async (...args: Parameters<Adapter['parse']>) => (input = await config.adapter!.parse(...args)),
  }
  const kubb = createKubb({ ...config, output, adapter }, { hooks, signal })
  const result = await kubb.generate()
  if (!result.success) throw generationFailure(result.diagnostics)

  // `kubb.config` carries the defaults, such as the fs storage a config loaded by the CLI leaves unset.
  const { storage, root } = kubb.config
  return {
    storage,
    root,
    paths: new Set(result.files.map((file) => relativeStoragePath({ root, filePath: file.path }))),
    input,
  }
}

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
 * tenant never reaches another's output. The oldest go past `maxCount` or `maxMb`, but the newest
 * always stays.
 */
export function createGenerationStore({
  storage,
  maxCount,
  maxMb,
  ttlMs,
  now = Date.now,
}: {
  storage: Storage
  maxCount: number
  maxMb: number
  /** How long a generation stays readable. Unset, it stays until count or size pushes it out. */
  ttlMs?: number
  now?: () => number
}) {
  let index: Array<KeptGeneration> | undefined

  // An entry from before `keptAt` existed never expires, so upgrading drops nothing.
  const isLive = (generation: KeptGeneration) => ttlMs === undefined || generation.keptAt === undefined || now() - generation.keptAt < ttlMs

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
   * Copies `files` into the store as one set of `jobId`. Above `maxSetMb` only the hashes are kept.
   */
  async function keep({ jobId, source, files, maxSetMb }: { jobId: string; source: FileSource; files: SourceFiles; maxSetMb: number }): Promise<KeptSet> {
    const maxSetBytes = maxSetMb * MB
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
        // Output is kept as writing it to disk would leave it (see `write`): skipped when empty once
        // trimmed, and hashed trimmed with one trailing newline. A run kept in memory then reports the
        // same files and hashes as one with `allowWrite`, the disk snapshot, and a CI upload.
        if (source === 'output' && !content.trim()) return
        hashes[path] = hashOf(source === 'output' ? `${content.trim()}\n` : content)
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
    /**
     * Keeps the `InputNode` of `jobId` next to its files and returns its size in bytes. A ref schema
     * keeps its name but not the copy of its target, which `input.schemas` already holds, so the
     * kept input stays close to the size of the spec. Nothing is kept for `null` or an input JSON
     * cannot hold.
     */
    async keepInput({ jobId, input }: { jobId: string; input: InputNode | null }): Promise<number> {
      if (!input) return 0
      const slim = ast.transform(input, { schema: (node) => (node.type === 'ref' && node.schema ? { ...node, schema: undefined } : undefined) })
      let serialized: string
      try {
        serialized = JSON.stringify(slim)
      } catch {
        return 0
      }
      await storage.writeItem(`${dirOf(jobId)}input.json`, serialized)
      return Buffer.byteLength(serialized)
    },
    /**
     * The input {@link keepInput} kept for `jobId`, or `undefined` when there is none.
     */
    async readInput(jobId: string): Promise<InputNode | undefined> {
      const stored = await storage.readItem(`${dirOf(jobId)}input.json`)
      return stored === null ? undefined : (JSON.parse(stored) as InputNode)
    },
    get: async (jobId: string) => (await load()).find((generation) => generation.jobId === jobId && isLive(generation)),
    async add(generation: KeptGeneration): Promise<void> {
      const current = await load()
      for (const expired of current.filter((entry) => !isLive(entry))) await drop(expired.jobId)
      const entries = current.filter((entry) => entry.jobId !== generation.jobId && isLive(entry))
      entries.push({ ...generation, keptAt: now() })
      while (entries.length > 1 && (entries.length > maxCount || totalBytes(entries) > maxMb * MB)) {
        await drop(entries.shift()!.jobId)
      }
      index = entries
      await storage.writeItem(INDEX_KEY, JSON.stringify(entries))
    },
    /**
     * Reads the requested paths the set holds, skipping any it does not, one page of lines when `limit` is given.
     */
    async read({
      generation,
      source,
      paths,
      cursor = 0,
      limit,
    }: {
      generation: KeptGeneration
      source: FileSource
      paths: Array<string>
      cursor?: number
      limit?: number
    }): Promise<ReadFilesResult> {
      const kept = new Set(generation[source]?.paths)
      const files: Record<string, string> = {}
      const pages: Record<string, FilePage> = {}
      await inParallel({
        items: paths.filter((path) => kept.has(path)),
        limit: READ_CONCURRENCY,
        run: async (path) => {
          const content = await storage.readItem(`${dirOf(generation.jobId)}${source}/${path}`)
          if (content === null) return
          if (limit === undefined) {
            files[path] = content
            return
          }
          const lines = content.split(/\r\n|\r|\n/)
          const end = Math.min(cursor + limit, lines.length)
          files[path] = lines.slice(cursor, end).join('\n')
          pages[path] = { nextCursor: end < lines.length ? end : null, totalLines: lines.length }
        },
      })
      return limit === undefined ? { files } : { files, pages }
    },
  }
}

export type GenerationStore = ReturnType<typeof createGenerationStore>
