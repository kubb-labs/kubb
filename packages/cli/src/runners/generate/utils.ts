import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { matchesStored, toError } from '@internals/utils'
import type { Hookable, KubbHooks, OutputManifest, Storage } from '@kubb/core'

/** Glob pattern for paths the file watcher ignores. */
const WATCHER_IGNORED_PATHS = '**/{.git,node_modules}/**' as const

/**
 * Quiet window in milliseconds that collapses a burst of watcher events (an editor save emits several) into one rebuild.
 * It outlasts chokidar's 100 ms atomic-save window, which holds back the event of a write-then-rename save.
 */
const WATCHER_DEBOUNCE_MS = 250

/** Interval in milliseconds between polls of a remote `input` URL in watch mode, which emits no filesystem events. */
const URL_WATCHER_INTERVAL_MS = 2_000

/** Upper bound in milliseconds for one URL watcher request, headers and body read, so a hung server never stalls polling. */
const URL_WATCHER_TIMEOUT_MS = 10_000

type SerialRunnerOptions = {
  /**
   * The async work to serialize.
   */
  run(): Promise<void>
  /**
   * Receives errors thrown by `run`, so a failure never rejects the returned trigger.
   */
  onError(error: Error): void
}

/**
 * Wraps `run` so invocations never overlap: a trigger that lands while a run is in flight
 * marks it dirty and runs once more after it finishes, no matter how many triggers arrived.
 * Useful for event-driven reruns (a file watcher, a queue drain) where bursts should
 * coalesce into a single trailing run.
 *
 * @example
 * ```ts
 * const rebuild = createSerialRunner({
 *   run: () => build(),
 *   onError: (error) => log.error(error.message),
 * })
 * watcher.on('change', () => void rebuild())
 * ```
 */
export function createSerialRunner({ run, onError }: SerialRunnerOptions): () => Promise<void> {
  let running = false
  let dirty = false

  return async (): Promise<void> => {
    if (running) {
      dirty = true
      return
    }
    running = true
    do {
      dirty = false
      try {
        await run()
      } catch (error) {
        onError(toError(error))
      }
    } while (dirty)
    running = false
  }
}

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
 * are debounced into one build, and builds never overlap: changes during a build queue exactly
 * one rebuild. Resolves to a function that stops watching.
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

  process.once('SIGINT', () => {
    watcher.close()
  })
  process.once('SIGTERM', () => {
    watcher.close()
  })

  // Bursts never overlap builds on the shared hooks emitter: a change during a build
  // queues exactly one rerun.
  const runBuild = createSerialRunner({
    run: () => cb(path),
    onError: () => log.error(styleText('red', 'Watcher failed')),
  })
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watcher.on('all', (type, file) => {
    log.info(formatChange({ target: relative(process.cwd(), file), removed: type === 'unlink' }))
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void runBuild()
    }, WATCHER_DEBOUNCE_MS)
  })

  return async () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    await watcher.close()
  }
}

/**
 * Fetches the body of a remote spec URL, `undefined` when the server does not answer with a
 * readable 2xx body before `signal` aborts. The caller seeds `startUrlWatcher` with the result, so
 * the watcher compares polls against the content the initial build ran on.
 */
export async function fetchUrlBody(url: string, signal: AbortSignal = AbortSignal.timeout(URL_WATCHER_TIMEOUT_MS)): Promise<string | undefined> {
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) return undefined
    return await response.text()
  } catch {
    return undefined
  }
}

type UrlWatcherOptions = {
  /**
   * Sink for watcher messages, `console.log` by default.
   */
  log?: WatcherLog
  /**
   * Time in milliseconds between polls.
   */
  intervalMs?: number
  /**
   * Upper bound in milliseconds for one poll request, covering headers and body read.
   */
  timeoutMs?: number
  /**
   * Body the initial build ran against, the baseline for change detection. When omitted (the
   * server was unreachable at startup), the first successful poll rebuilds so the output catches
   * up as soon as the server responds.
   */
  initialBody?: string
}

/**
 * Polls a remote spec URL and calls `cb` whenever the response body changes. A remote document
 * emits no filesystem events, so this is the URL counterpart of `startWatcher`.
 *
 * `initialBody` seeds the change detection, so an edit landing between the initial build and the
 * first poll still rebuilds. An unreachable server (the API restarting between saves) is reported
 * once per outage and polling continues; after it recovers, a rebuild happens only when the body
 * actually differs from the last one seen, so a plain restart with an unchanged spec stays quiet.
 * Each request is aborted after `timeoutMs`, so a hung response delays at most one poll.
 *
 * Returns a function that stops polling and aborts the in-flight request, so callers (and tests)
 * can shut the watcher down without signaling the process.
 */
export function startUrlWatcher(url: string, cb: (path: Array<string>) => Promise<void>, options: UrlWatcherOptions = {}): () => void {
  const { log = { info: console.log, error: console.log }, intervalMs = URL_WATCHER_INTERVAL_MS, timeoutMs = URL_WATCHER_TIMEOUT_MS, initialBody } = options

  let lastBody = initialBody
  let offline = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let controller: AbortController | null = null
  let stopped = false

  const stop = () => {
    stopped = true
    if (timer) clearTimeout(timer)
    controller?.abort()
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  // Builds never overlap on the shared hooks emitter: a change during a build queues exactly
  // one rerun.
  const runBuild = createSerialRunner({
    run: () => cb([url]),
    onError: () => log.error(styleText('red', 'Watcher failed')),
  })

  const schedule = () => {
    if (!stopped) {
      timer = setTimeout(() => void poll(), intervalMs)
    }
  }

  const poll = async (): Promise<void> => {
    controller = new AbortController()
    // The signal also aborts the body read, so a response that stalls mid-stream still times out.
    const body = await fetchUrlBody(url, AbortSignal.any([controller.signal, AbortSignal.timeout(timeoutMs)]))

    if (body === undefined) {
      // `lastBody` survives the outage so recovery rebuilds only on real content changes.
      if (!offline && !stopped) {
        offline = true
        log.error(styleText('red', `Cannot reach ${url}, polling until it responds again`))
      }
      schedule()
      return
    }

    if (offline) {
      offline = false
      log.info(styleText('yellow', `${url} is reachable again`))
    }
    const changed = lastBody !== undefined && body !== lastBody
    if (changed) {
      log.info(formatChange({ target: url }))
    }
    if (changed || lastBody === undefined) {
      void runBuild()
    }
    lastBody = body
    schedule()
  }

  void poll()

  return stop
}

/**
 * What one build produced: the schema and operation names the plugins generated, and each output
 * path with a fingerprint of its content.
 */
export type BuildSnapshot = {
  schemas: Set<string>
  operations: Set<string>
  files: Map<string, string>
}

function createSnapshot(): BuildSnapshot {
  return { schemas: new Set(), operations: new Set(), files: new Map() }
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
  // Fingerprints the generated file, not what reached disk: `output.clean` rewrites every file, so the write count cannot tell an edit from a rewrite.
  hooks.hook('kubb:files:processing:end', ({ files }) => {
    for (const file of files) current.files.set(file.path, createHash('sha1').update(JSON.stringify(file)).digest('base64url'))
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
 * How a rebuild differs from the build before it: the spec's added and removed schemas and
 * operations, and each output file added (`A`), modified (`M`) or removed (`D`).
 */
export type BuildDiff = {
  schemas: NameChange
  operations: NameChange
  files: Array<FileChange>
  unchanged: number
}

function diffNames(previous: Set<string>, next: Set<string>): NameChange {
  return { added: [...next].filter((name) => !previous.has(name)).length, removed: [...previous].filter((name) => !next.has(name)).length }
}

/**
 * Compares two {@link BuildSnapshot}s by name, path and content fingerprint, so nothing is read back from disk.
 */
export function diffBuilds(previous: BuildSnapshot, next: BuildSnapshot): BuildDiff {
  const files: BuildDiff['files'] = []
  let unchanged = 0
  for (const [path, fingerprint] of next.files) {
    const before = previous.files.get(path)
    if (before === fingerprint) unchanged++
    else files.push({ status: before === undefined ? 'A' : 'M', path })
  }
  for (const path of previous.files.keys()) {
    if (!next.files.has(path)) files.push({ status: 'D', path })
  }

  return { schemas: diffNames(previous.schemas, next.schemas), operations: diffNames(previous.operations, next.operations), files, unchanged }
}

/** A changed file with how many lines it gains and loses, counted as a multiset, which is cheap and close enough for a plan. */
export type FileChange = { status: 'A' | 'M' | 'D'; path: string; added?: number; removed?: number }

function countLineChanges(before: string, after: string): { added: number; removed: number } {
  const remaining = new Map<string, number>()
  for (const line of before.split('\n')) remaining.set(line, (remaining.get(line) ?? 0) + 1)
  let added = 0
  for (const line of after.split('\n')) {
    const count = remaining.get(line) ?? 0
    if (count > 0) remaining.set(line, count - 1)
    else added++
  }
  const removed = [...remaining.values()].reduce((sum, count) => sum + count, 0)
  return { added, removed }
}

async function readOrNull(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

async function listFiles(dir: string): Promise<Array<string>> {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true })
    return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name))
  } catch {
    return []
  }
}

/**
 * What a dry run would change on disk: each generated file compared with the file at its path the
 * way a real write compares them (trimmed, and through the output `manifest`, which knows the files
 * the formatter rewrote), and with `clean`, the files in the output folder the run would delete.
 * Reads only, writes nothing.
 */
export async function planDryRun({
  storage,
  paths,
  outputPath,
  clean,
  manifest,
}: {
  storage: Storage
  paths: ReadonlyArray<string>
  outputPath: string
  clean: boolean
  manifest?: Pick<OutputManifest, 'isUpToDate'>
}): Promise<{ files: Array<FileChange>; unchanged: number }> {
  const generated = new Set(paths)
  const [rows, existing] = await Promise.all([
    Promise.all(paths.map(async (filePath) => ({ filePath, next: (await storage.readItem(filePath)) ?? '', previous: await readOrNull(filePath) }))),
    clean ? listFiles(outputPath) : Promise.resolve([]),
  ])

  const files: Array<FileChange> = []
  let unchanged = 0
  for (const { filePath, next, previous } of rows) {
    if (previous === null) files.push({ status: 'A', path: filePath })
    else if (matchesStored({ stored: previous, source: next }) || manifest?.isUpToDate({ key: filePath, source: next, disk: previous })) unchanged++
    else files.push({ status: 'M', path: filePath, ...countLineChanges(previous.trim(), next.trim()) })
  }
  for (const filePath of existing) {
    if (!generated.has(filePath)) files.push({ status: 'D', path: filePath })
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

/**
 * A stacked bar of how a dry run splits the output: new in green, changed in yellow, removed in
 * red and untouched files dim. Every non-empty part keeps at least one cell, so one new file
 * still shows next to hundreds of unchanged ones.
 */
export function formatPlanBar(
  { added, changed, removed, unchanged }: { added: number; changed: number; removed: number; unchanged: number },
  size = 30,
): string {
  const counts = [added, changed, removed, unchanged]
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (!total) return styleText('dim', '░'.repeat(size))

  const cells = counts.map((count) => (count ? Math.max(1, Math.round((count / total) * size)) : 0))
  for (let excess = cells.reduce((sum, count) => sum + count, 0) - size; excess !== 0; excess -= Math.sign(excess)) {
    cells[cells.indexOf(Math.max(...cells))]! -= Math.sign(excess)
  }

  return [
    styleText('green', '█'.repeat(cells[0]!)),
    styleText('yellow', '█'.repeat(cells[1]!)),
    styleText('red', '█'.repeat(cells[2]!)),
    styleText('dim', '░'.repeat(cells[3]!)),
  ].join('')
}
