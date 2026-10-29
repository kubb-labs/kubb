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

function countLineChanges(before: string, after: string): { added: number; removed: number } {
  const remaining = new Map<string, number>()
  for (const line of before ? before.split('\n') : []) remaining.set(line, (remaining.get(line) ?? 0) + 1)
  let added = 0
  for (const line of after ? after.split('\n') : []) {
    const count = remaining.get(line) ?? 0
    if (count > 0) remaining.set(line, count - 1)
    else added++
  }
  const removed = [...remaining.values()].reduce((sum, count) => sum + count, 0)
  return { added, removed }
}

/**
 * Reads the output before generation, so cleaning the directory cannot erase the diff baseline.
 * A missing directory or an unreadable file is skipped.
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
  const changes: Array<FileChange | undefined> = []
  let unchanged = 0
  await inParallel({
    items: paths,
    limit: 50,
    run: async (filePath, index) => {
      const next = await storage.readItem(filePath)
      if (next === null) return
      const previous = previousFiles.get(filePath) ?? null
      if (previous !== null && (matchesStored({ stored: previous, source: next }) || manifest?.isUpToDate({ key: filePath, source: next, disk: previous }))) {
        unchanged++
        return
      }
      changes[index] = {
        status: previous === null ? 'A' : 'M',
        path: filePath,
        ...countLineChanges(previous?.trim() ?? '', previous === null ? next.trimEnd() : next.trim()),
      }
    },
  })
  const files = changes.filter((file) => file !== undefined)
  if (clean) {
    for (const [filePath, source] of previousFiles) {
      if (!generated.has(filePath)) files.push({ status: 'D', path: filePath, ...countLineChanges(source.trimEnd(), '') })
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
