import { hash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { inParallel, matchesStored, read } from '@internals/utils'
import type { Hookable, KubbHooks, OutputManifest, Storage } from '@kubb/core'

/** Glob pattern for paths the file watcher ignores. */
const WATCHER_IGNORED_PATHS = '**/{.git,node_modules}/**' as const

/**
 * Quiet window in milliseconds that collapses a burst of watcher events (an editor save emits several) into one rebuild.
 * It outlasts chokidar's 100 ms atomic-save window, which holds back the event of a write-then-rename save.
 */
const WATCHER_DEBOUNCE_MS = 250

/** `14:02:11  petStore.yaml changed`, the line a watcher prints when its input changes. */
export function formatChange({ target, removed = false, now = new Date() }: { target: string; removed?: boolean; now?: Date }): string {
  return `${styleText('dim', now.toTimeString().slice(0, 8))}  ${styleText('bold', target)} ${removed ? 'removed' : 'changed'}`
}

type WatcherLog = {
  info: (message: string) => void
  error: (message: string) => void
}

/**
 * Starts a file watcher on the given paths and calls `cb` on any change.
 * Ignores `.git` and `node_modules` directories. Event bursts (an editor save emits several)
 * are debounced into one call. `cb` must never reject: its result is not awaited, so the caller
 * serializes and reports its own builds. Resolves to a function that stops watching.
 */
export async function startWatcher(
  path: Array<string>,
  cb: (path: Array<string>) => Promise<void>,
  log: WatcherLog = { info: console.log, error: console.log },
): Promise<() => Promise<void>> {
  const { watch } = await import('chokidar')
  // `ignoreInitial` skips the `add` events chokidar fires for existing files at startup, which
  // would otherwise rebuild right after the initial run.
  const watcher = watch(path, { ignorePermissionErrors: true, ignored: WATCHER_IGNORED_PATHS, ignoreInitial: true })

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => void watcher.close())
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watcher.on('all', (type, file) => {
    log.info(formatChange({ target: relative(process.cwd(), file), removed: type === 'unlink' }))
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void cb(path)
    }, WATCHER_DEBOUNCE_MS)
  })

  return async () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    await watcher.close()
  }
}

/**
 * What one build produced: the schema and operation names the plugins generated.
 */
export type BuildSnapshot = {
  schemas: Set<string>
  operations: Set<string>
}

function createSnapshot(): BuildSnapshot {
  return { schemas: new Set(), operations: new Set() }
}

/**
 * Collects a {@link BuildSnapshot} from the hooks while a build runs. `take` hands back the finished
 * build's snapshot and starts the next one.
 */
export function trackBuild(hooks: Hookable<KubbHooks>): { take(): BuildSnapshot } {
  let current = createSnapshot()

  hooks.hook('kubb:generate:schema', (node) => {
    if (node.name) current.schemas.add(node.name)
  })
  hooks.hook('kubb:generate:operation', (node) => {
    current.operations.add(node.operationId)
  })

  return {
    take() {
      const snapshot = current
      current = createSnapshot()
      return snapshot
    },
  }
}

type NameChange = { added: number; removed: number }

/**
 * How a rebuild differs from the build before it: the spec's added and removed schemas and operations.
 */
export type BuildDiff = {
  schemas: NameChange
  operations: NameChange
}

function diffNames(previous: Set<string>, next: Set<string>): NameChange {
  return { added: [...next].filter((name) => !previous.has(name)).length, removed: [...previous].filter((name) => !next.has(name)).length }
}

/**
 * Compares two {@link BuildSnapshot}s by name.
 */
export function diffBuilds(previous: BuildSnapshot, next: BuildSnapshot): BuildDiff {
  return {
    schemas: diffNames(previous.schemas, next.schemas),
    operations: diffNames(previous.operations, next.operations),
  }
}

/** A changed file with how many lines it gains and loses, counted as a multiset, which is cheap and close enough for a plan. */
export type FileChange = { status: 'A' | 'M' | 'D'; path: string; added?: number; removed?: number }

type Lines = Iterable<string | number>

function splitLines(text: string): Array<string> {
  return text ? text.split('\n') : []
}

function hashLine(line: string): number {
  return [...line].reduce((hash, char) => Math.imul(hash ^ char.codePointAt(0)!, 0x01000193), 0x811c9dc5)
}

function hashLines(text: string): Int32Array {
  return Int32Array.from(splitLines(text), hashLine)
}

function countLineChanges({ before, after }: { before: Lines; after: Lines }): { added: number; removed: number } {
  const remaining = new Map<string | number, number>()
  for (const line of before) remaining.set(line, (remaining.get(line) ?? 0) + 1)
  const added = [...after].filter((line) => {
    const count = remaining.get(line) ?? 0
    if (count === 0) return true
    remaining.set(line, count - 1)
    return false
  }).length
  const removed = [...remaining.values()].reduce((sum, count) => sum + count, 0)
  return { added, removed }
}

/**
 * Reads the output before generation, so cleaning the directory cannot erase the diff baseline.
 * A missing directory or an unreadable file is skipped. This keeps every file's text for the whole
 * run, so only a dry run and a run with output passes use it: they compare against the output read
 * back at the end.
 */
export async function readOutputFiles(outputPath: string): Promise<Map<string, string>> {
  const entries = await readdir(outputPath, { recursive: true, withFileTypes: true }).catch(() => [])
  const files = new Map<string, string>()
  await inParallel({
    items: entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name)),
    limit: 50,
    run: async (filePath) => {
      const source = await read(filePath).catch(() => null)
      if (source !== null) files.set(filePath, source)
    },
  })
  return files
}

/**
 * What is left of a file once `output.clean` deleted it: a hash of its text and one per line, which
 * is enough to tell whether its regenerated copy changed and by how many lines. A few bytes per
 * line, where the text of a large output tree takes hundreds of megabytes.
 */
export type FileFingerprint = {
  digest: string
  lines: Int32Array
  /**
   * Lines the summary counts as removed when the file is not regenerated.
   */
  deletedLines: number
}

export function fingerprintFile(text: string): FileFingerprint {
  const body = text.trimEnd()
  const trimmed = body.trimStart()
  // A deleted file also counts the blank lines above its first line, which trimming drops.
  const leading = body.slice(0, body.length - trimmed.length).split('\n').length - 1
  const lines = hashLines(trimmed)

  return { digest: hash('sha1', trimmed), lines, deletedLines: body ? lines.length + leading : 0 }
}

/**
 * Fingerprints every file under the output folder right before `output.clean` empties it. Files are
 * read one at a time and dropped again, so the old tree is never held in memory. A missing
 * directory or an unreadable file is skipped.
 */
export async function readOutputFingerprints(outputPath: string): Promise<Map<string, FileFingerprint>> {
  const entries = await readdir(outputPath, { recursive: true, withFileTypes: true }).catch(() => [])
  const fingerprints = new Map<string, FileFingerprint>()
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const filePath = join(entry.parentPath, entry.name)
    try {
      // Synchronous on purpose: one read at a time is several times faster here than a pool of `fs.promises` reads.
      fingerprints.set(filePath, fingerprintFile(readFileSync(filePath, 'utf8')))
    } catch {
      /* unreadable, so it cannot be compared */
    }
  }
  return fingerprints
}

/**
 * How one generated file differs from its copy before generation: `undefined` when both hold the
 * same output, otherwise the change with its line counts. `previous` is the stored text, the
 * {@link FileFingerprint} of a file `output.clean` deleted, or `null` for a new file. The manifest
 * recognizes output a formatter rewrote.
 */
export function diffFile({
  path,
  next,
  previous,
  manifest,
}: {
  path: string
  next: string
  previous: string | FileFingerprint | null
  manifest?: Pick<OutputManifest, 'isUpToDate'>
}): FileChange | undefined {
  if (previous === null) return { status: 'A', path, added: splitLines(next.trimEnd()).length, removed: 0 }
  if (typeof previous !== 'string') {
    const trimmed = next.trim()
    if (hash('sha1', trimmed) === previous.digest) return undefined
    return { status: 'M', path, ...countLineChanges({ before: previous.lines, after: hashLines(trimmed) }) }
  }
  if (matchesStored({ stored: previous, source: next }) || manifest?.isUpToDate({ key: path, source: next, disk: previous })) return undefined
  return { status: 'M', path, ...countLineChanges({ before: splitLines(previous.trim()), after: splitLines(next.trim()) }) }
}

/**
 * The totals the summary prints, plus the files that came out the same.
 */
export type ChangeTally = { added: number; modified: number; deleted: number; linesAdded: number; linesRemoved: number; unchanged: number }

const statusKeys = { A: 'added', M: 'modified', D: 'deleted' } as const

/**
 * Adds one file's outcome to the totals: a {@link FileChange}, or `undefined` for an unchanged file.
 */
export function tallyChange({ tally, change }: { tally: ChangeTally; change: FileChange | undefined }): void {
  if (!change) {
    tally.unchanged++
    return
  }
  tally[statusKeys[change.status]]++
  tally.linesAdded += change.added ?? 0
  tally.linesRemoved += change.removed ?? 0
}

export function createChangeTally(): ChangeTally {
  return { added: 0, modified: 0, deleted: 0, linesAdded: 0, linesRemoved: 0, unchanged: 0 }
}

/**
 * Compares generated output with the files captured before generation. The manifest recognizes
 * output rewritten by a formatter, and `clean` includes files the run would delete.
 */
export async function diffOutput({
  storage,
  paths,
  clean,
  manifest,
  previousFiles,
}: {
  storage: Storage
  paths: ReadonlyArray<string>
  clean: boolean
  manifest?: Pick<OutputManifest, 'isUpToDate'>
  /**
   * The output captured before a real run, including files removed by cleaning.
   */
  previousFiles: ReadonlyMap<string, string>
}): Promise<{ files: Array<FileChange>; unchanged: number }> {
  const generated = new Set(paths)
  // `null` marks an unchanged file. A path the storage does not hold leaves a hole, which `filter` skips.
  const results: Array<FileChange | null> = []
  await inParallel({
    items: paths,
    limit: 50,
    run: async (filePath, index) => {
      const next = await storage.readItem(filePath)
      if (next === null) return
      results[index] = diffFile({ path: filePath, next, previous: previousFiles.get(filePath) ?? null, manifest }) ?? null
    },
  })
  const files = results.filter((result) => result !== null)
  const unchanged = results.filter((result) => result === null).length
  if (clean) {
    for (const [filePath, source] of previousFiles) {
      if (!generated.has(filePath)) files.push({ status: 'D', path: filePath, added: 0, removed: splitLines(source.trimEnd()).length })
    }
  }

  return { files, unchanged }
}

type KeyInput = Pick<NodeJS.ReadStream, 'isTTY' | 'setRawMode' | 'resume' | 'pause' | 'setEncoding' | 'on'>

type KeyOptions = {
  rebuild: () => void
  /**
   * Ends the process with this exit code: `0` for `q`, `130` for ctrl+c, which raw mode turns into a key.
   */
  quit: (code: number) => void
  input?: KeyInput
}

/**
 * Reads `r` (rebuild) and `q` (quit) from an interactive stdin in raw mode, and keeps ctrl+c
 * working. Returns `undefined` when stdin is not a TTY. Otherwise returns `arm`, which turns raw
 * mode back on: a spinner restores the terminal when it stops, so call it after each build. Raw mode
 * is restored on exit.
 */
export function listenForKeys({ rebuild, quit, input = process.stdin }: KeyOptions): (() => void) | undefined {
  if (!input.isTTY) return undefined

  const arm = () => {
    input.setRawMode(true)
    input.resume()
  }
  input.setEncoding('utf8')
  input.on('data', (data: string) => {
    const key = data.trim()
    if (key === 'r') {
      rebuild()
      return
    }
    if (key === 'q' || data === '\u0003') {
      input.setRawMode(false)
      input.pause()
      quit(key === 'q' ? 0 : 130)
    }
  })
  process.once('exit', () => input.setRawMode(false))
  arm()

  return arm
}
