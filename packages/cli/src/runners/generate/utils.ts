import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { styleText } from 'node:util'
import { toError, tokenize } from '@internals/utils'
import type { HookResult, KubbHooks, PostGenerateCommand, Hookable } from '@kubb/core'
import { NonZeroExitError, x } from 'tinyexec'
import { isGreaterThan, isValid, truncate } from 'verkit'

/** Glob pattern for paths the file watcher ignores. */
const WATCHER_IGNORED_PATHS = '**/{.git,node_modules}/**' as const

/** Quiet window in milliseconds that collapses a burst of watcher events (an editor save emits several) into one rebuild. */
const WATCHER_DEBOUNCE_MS = 100

/** Interval in milliseconds between polls of a remote `input` URL in watch mode, which emits no filesystem events. */
const URL_WATCHER_INTERVAL_MS = 2_000

/** Upper bound in milliseconds for one URL watcher request, headers and body read, so a hung server never stalls polling. */
const URL_WATCHER_TIMEOUT_MS = 10_000

type RunPostGenerateOptions = {
  commands: Array<PostGenerateCommand>
  hooks: Hookable<KubbHooks>
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
  if (!isValid(current) || !isValid(latest)) return false

  return isGreaterThan(truncate(latest, 'patch') as string, truncate(current, 'patch') as string)
}

/**
 * Runs the `output.postGenerate` commands of a Kubb config in sequence and returns each command's
 * outcome, so the caller can turn failures into diagnostics.
 */
export async function runPostGenerate({ commands, hooks }: RunPostGenerateOptions): Promise<Array<HookResult>> {
  const results: Array<HookResult> = []

  for (const entry of commands) {
    const { command, name } = typeof entry === 'string' ? { command: entry, name: undefined } : entry
    const [cmd, ...args] = tokenize(command)
    if (!cmd) continue

    results.push(await runHook({ command: cmd, name, args, hooks }))
  }

  return results
}

type RunHookOptions = {
  /** Ties the `kubb:hook:*` events of one run together. Generated when omitted. */
  id?: string
  command: string
  name?: string
  args?: ReadonlyArray<string>
  hooks: Hookable<KubbHooks>
}

/** Spawns a hook command, announced through `kubb:hook:start` and `kubb:hook:end`, and returns a failure instead of throwing. */
export async function runHook({ id = randomUUID(), command, name, args, hooks }: RunHookOptions): Promise<HookResult> {
  const commandWithArgs = [command, ...(args ?? [])].join(' ')
  const emitEnd = async (result: HookResult): Promise<HookResult> => {
    await hooks.callHook('kubb:hook:end', { command, name, args, id, ...result })
    return result
  }

  await hooks.callHook('kubb:hook:start', { id, command, name, args })

  // Only stream line-by-line when a logger is listening, so the non-streaming plain
  // logger doesn't pay to iterate the subprocess output.
  const stream = hooks.listenerCount('kubb:hook:line') > 0

  try {
    const proc = x(command, [...(args ?? [])], {
      nodeOptions: { detached: process.platform !== 'win32' },
      throwOnError: true,
    })

    if (stream) {
      for await (const line of proc) {
        await hooks.callHook('kubb:hook:line', { id, line })
      }
    }

    await proc
    await hooks.callHook('kubb:success', { message: `${styleText('dim', name ?? commandWithArgs)} successfully executed` })
    return emitEnd({ success: true, error: null })
  } catch (err) {
    if (!(err instanceof NonZeroExitError)) {
      return emitEnd({ success: false, error: toError(err) })
    }

    const stderr = err.output?.stderr ?? ''
    const stdout = err.output?.stdout ?? ''

    const error = new Error(`Hook execute failed: ${commandWithArgs}`)
    // Signal the failure via the result and `kubb:hook:end` only, carrying the captured output so
    // the logger can render it. The caller turns this into a coded diagnostic and emits that
    // through `Diagnostics.emit`, so emitting `kubb:error` here would render it twice.
    return emitEnd({ success: false, error, stdout, stderr })
  }
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
    log.info(styleText('yellow', styleText('bold', `Change detected: ${type} ${file}`)))
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
