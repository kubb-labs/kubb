import { createHash, randomUUID } from 'node:crypto'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { inParallel } from '@internals/utils'
import { ast, type InputNode } from '@kubb/ast'
import { type Config, createKubb, type Diagnostic, Diagnostics, fsStorage, type Hookable, type KubbHooks, type Storage } from '@kubb/core'
import { type FilePage, type ReadFilesResult } from './protocol.ts'

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
  initial?: boolean
  /** When the store took it, in epoch milliseconds. Absent on an index written before it existed. */
  keptAt?: number
  output: KeptSet
  inputBytes?: number
}

/**
 * The content fingerprint Studio compares snapshots by. Agent runs and CI uploads must agree on it.
 */
export const hashOf = (content: string) => createHash('sha1').update(content).digest('hex').slice(0, 16)

/**
 * The bytes `entries` keep on disk: output, written files, and kept input.
 */
const totalBytes = (entries: Array<KeptGeneration>) => entries.reduce((sum, { output, inputBytes }) => sum + output.bytes + (inputBytes ?? 0), 0)

function positiveNumber(value: string | undefined): number | undefined {
  const parsed = Number(value)
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * How many generations an agent keeps and how large they may get, read from
 * `KUBB_AGENT_MAX_GENERATIONS` and `KUBB_AGENT_MAX_GENERATIONS_MB`.
 * An unset or invalid value keeps the default.
 */
export function resolveGenerationLimits(): { maxCount: number; maxMb: number } {
  return {
    maxCount: Math.max(1, Math.floor(positiveNumber(process.env.KUBB_AGENT_MAX_GENERATIONS) ?? 8)),
    maxMb: positiveNumber(process.env.KUBB_AGENT_MAX_GENERATIONS_MB) ?? 100,
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
  const kubb = createKubb({ ...config, output }, { hooks, signal })
  let input: InputNode | null = null
  // The driver drops its `inputNode` once the build is over, so read it as the build ends.
  const unhook = kubb.hooks.hook('kubb:build:end', (ctx) => {
    if (ctx.config === kubb.config) input = kubb.driver.inputNode
  })
  const result = await kubb.generate().finally(unhook)
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
 * What the output directory holds when the editor connects. `undefined` when `outputPath` is not a real
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
 * tenant never reaches another's output. Initial disk output and generated jobs each get their
 * own `maxCount` and `maxMb` budget. Each budget always keeps its newest entry.
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
  async function keep({ jobId, files, maxSetMb }: { jobId: string; files: SourceFiles; maxSetMb: number }): Promise<KeptSet> {
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
        hashes[path] = hashOf(content)
        bytes += Buffer.byteLength(content)
        if (bytes <= maxSetBytes) await storage.writeItem(`${dirOf(jobId)}output/${path}`, content)
      },
    })
    if (bytes > maxSetBytes) {
      await storage.empty(`${dirOf(jobId)}output/`)
      return { paths: [], hashes, bytes: 0 }
    }
    return { paths: Object.keys(hashes), hashes, bytes }
  }

  async function drop(jobId: string): Promise<void> {
    await storage.empty(dirOf(jobId))
  }

  async function add(generation: KeptGeneration): Promise<void> {
    const current = await load()
    for (const expired of current.filter((entry) => !isLive(entry))) await drop(expired.jobId)
    const live = current.filter((entry) => entry.jobId !== generation.jobId && isLive(entry))
    const sharesBudget = (entry: KeptGeneration) => Boolean(entry.initial) === Boolean(generation.initial)
    const entries = live.filter(sharesBudget)
    entries.push({ ...generation, keptAt: now() })
    while (entries.length > 1 && (entries.length > maxCount || totalBytes(entries) > maxMb * MB)) {
      await drop(entries.shift()!.jobId)
    }
    index = [...live.filter((entry) => !sharesBudget(entry)), ...entries]
    await storage.writeItem(INDEX_KEY, JSON.stringify(index))
  }

  return {
    keep,
    drop,
    /**
     * Captures initial disk output, reusing a retained ID when its hashes and readable paths match.
     * A temporary candidate is discarded on reuse, so reconnects do not consume retention slots.
     */
    async keepInitial(files: SourceFiles): Promise<KeptGeneration> {
      const jobId = randomUUID()
      const output = await keep({ jobId, files, maxSetMb: maxMb })
      const hashes = Object.entries(output.hashes)
      const previous = (await load()).findLast(
        (entry) =>
          entry.initial &&
          isLive(entry) &&
          entry.output.paths.length === output.paths.length &&
          Object.keys(entry.output.hashes).length === hashes.length &&
          hashes.every(([path, hash]) => entry.output.hashes[path] === hash),
      )
      if (previous) {
        await drop(jobId)
        await add(previous)
        return previous
      }
      const generation = { jobId, output, initial: true }
      await add(generation)
      return generation
    },
    /**
     * Keeps the `InputNode` of `jobId` and returns its size in bytes, or 0 when it keeps none. A ref schema loses
     * the copy of its target, which `input.schemas` holds: with it, a large spec outgrows what `JSON.stringify` can return.
     */
    async keepInput({ jobId, input, maxSetMb }: { jobId: string; input: InputNode | null; maxSetMb: number }): Promise<number> {
      if (!input) return 0
      let json: string
      try {
        json = JSON.stringify(ast.transform(input, { schema: (node) => (node.type === 'ref' && node.schema ? { ...node, schema: undefined } : undefined) }))
      } catch {
        // An adapter can return what JSON cannot hold, which must not fail a finished generation.
        return 0
      }
      const bytes = Buffer.byteLength(json)
      if (bytes > maxSetMb * MB) return 0
      await storage.writeItem(`${dirOf(jobId)}input.json`, json)
      return bytes
    },
    /**
     * The input `keepInput` kept for `jobId`, or `undefined` when there is none.
     */
    async readInput(jobId: string): Promise<InputNode | undefined> {
      const stored = await storage.readItem(`${dirOf(jobId)}input.json`)
      return stored === null ? undefined : (JSON.parse(stored) as InputNode)
    },
    get: async (jobId: string) => (await load()).find((generation) => generation.jobId === jobId && isLive(generation)),
    add,
    /**
     * Reads the requested paths the set holds, skipping any it does not, one page of lines when `limit` is given.
     */
    async read({
      generation,
      paths,
      cursor = 0,
      limit,
    }: {
      generation: KeptGeneration
      paths: Array<string>
      cursor?: number
      limit?: number
    }): Promise<ReadFilesResult> {
      const kept = new Set(generation.output.paths)
      const files: Record<string, string> = {}
      const pages: Record<string, FilePage> = {}
      await inParallel({
        items: paths.filter((path) => kept.has(path)),
        limit: READ_CONCURRENCY,
        run: async (path) => {
          const content = await storage.readItem(`${dirOf(generation.jobId)}output/${path}`)
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
