import { existsSync, watch } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { toError } from '@internals/utils'

/** Quiet window in milliseconds that collapses a burst of watcher events (an editor save emits several) into one rebuild. */
const WATCHER_DEBOUNCE_MS = 100

/** Interval in milliseconds between polls of a remote `input` URL in watch mode, which emits no filesystem events. */
const URL_WATCHER_INTERVAL_MS = 2_000

/** Upper bound in milliseconds for one URL watcher request, headers and body read, so a hung server never stalls polling. */
const URL_WATCHER_TIMEOUT_MS = 10_000

/** The numeric `major.minor.patch` of a semver string, `null` when it is not one; a leading `v`, prerelease and build metadata are dropped. */
function parseVersion(version: string): [number, number, number] | null {
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.exec(version.trim())

  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

/**
 * Returns `true` when `latest` is a newer semver version than `current`. Compares each numeric
 * part, so `5.10.0` beats `5.9.0` where a plain string comparison would not. Prerelease
 * suffixes are ignored, and a malformed version never reports an update.
 *
 * @example Double-digit minor
 * `isNewerVersion('5.9.0', '5.10.0') // true`
 *
 * @example String comparison would get this wrong the other way
 * `isNewerVersion('5.10.0', '5.9.0') // false`
 */
export function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = parseVersion(current)
  const latestParts = parseVersion(latest)
  if (!currentParts || !latestParts) return false

  const differs = latestParts.findIndex((part, index) => part !== currentParts[index])

  return differs !== -1 && latestParts[differs]! > currentParts[differs]!
}

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

type WatcherLog = {
  info: (message: string) => void
  error: (message: string) => void
}

/** Watches the given files and calls `cb` on a change, debounced and never overlapping; returns a function that stops watching. */
export function startWatcher(
  paths: Array<string>,
  cb: (path: Array<string>) => Promise<void>,
  log: WatcherLog = { info: console.log, error: console.log },
): () => void {
  // Bursts never overlap builds on the shared hooks emitter: a change during a build
  // queues exactly one rerun.
  const runBuild = createSerialRunner({
    run: () => cb(paths),
    onError: () => log.error(styleText('red', 'Watcher failed')),
  })
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const watchers = paths.map((file) => {
    const absolute = resolve(file)
    // Watch the directory, not the file: an editor's atomic save replaces the file, which would end a file watch.
    const watcher = watch(dirname(absolute), (event, changed) => {
      if (changed !== basename(absolute)) return
      // A replaced file reports `rename`; name it by what happened to the path, as before.
      const type = event === 'change' || existsSync(absolute) ? 'change' : 'unlink'
      log.info(styleText('yellow', styleText('bold', `Change detected: ${type} ${file}`)))
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        void runBuild()
      }, WATCHER_DEBOUNCE_MS)
    })
    watcher.on('error', () => log.error(styleText('red', 'Watcher failed')))
    return watcher
  })

  const stop = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    for (const watcher of watchers) watcher.close()
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  return stop
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
      log.info(styleText('yellow', styleText('bold', `Change detected: ${url}`)))
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
