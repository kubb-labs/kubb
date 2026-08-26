import { randomUUID } from 'node:crypto'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import readline from 'node:readline'
import { styleText } from 'node:util'
import { createModuleLoader } from '@internals/shared'
import { createSerialRunner, toError } from '@internals/utils'
import type { CLIOptions, Config, KubbHooks, PossibleConfig, PostGenerateCommand, Hookable } from '@kubb/core'
import { NonZeroExitError, x } from 'tinyexec'
import { type LoadConfigResult, type LoadConfigSource, loadConfig } from 'unconfig'
import { isGreater, isValid, truncate } from 'verkit'
import { WATCHER_DEBOUNCE_MS, WATCHER_IGNORED_PATHS } from '../../constants.ts'

const loader = createModuleLoader()

// Kubb configs are JS/TS modules (they call `defineConfig`/`pluginX()`), so YAML and JSON are not
// supported. The jiti loader handles every module format and the JSX runtime, returning the default export.
const tsLoader = (configFile: string) => loader.load(configFile, { default: true })

const MODULE_NAME = 'kubb'

const SEARCH_FILES = ['', '.config/', 'configs/'].flatMap((prefix) => [`${prefix}.${MODULE_NAME}rc`, `${prefix}${MODULE_NAME}.config`])
const SEARCH_EXTENSIONS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs']

type GetConfigsOptions = {
  /**
   * Explicit path to the Kubb config file. When omitted, the loader searches up from the current directory.
   */
  configPath?: string
  /**
   * Optional OpenAPI input path or URL that overrides `config.input` for this run.
   */
  input?: string
  /**
   * Watch flag forwarded to the user's `defineConfig` function.
   */
  watch?: boolean
  /**
   * Log level forwarded to the user's `defineConfig` function.
   */
  logLevel?: CLIOptions['logLevel']
}

type GetConfigsResult = {
  /**
   * Absolute path to the resolved config file.
   */
  configPath: string
  /**
   * Resolved and normalized array of Kubb configs, each guaranteed to have a `plugins` array.
   */
  configs: Array<Config>
}

/**
 * Discovers the Kubb config and resolves it into a normalized array of configs.
 * Every config in the result is guaranteed to have a `plugins` array.
 */
export async function getConfigs({ configPath, input, watch, logLevel }: GetConfigsOptions): Promise<GetConfigsResult> {
  const abs = configPath ? resolve(configPath) : undefined
  const sources: Array<LoadConfigSource<unknown>> = abs
    ? [{ files: [basename(abs)], extensions: [], parser: tsLoader }]
    : [{ files: SEARCH_FILES, extensions: SEARCH_EXTENSIONS, parser: tsLoader }]

  let result: LoadConfigResult<unknown>
  try {
    result = await loadConfig<unknown>({ cwd: abs ? dirname(abs) : process.cwd(), sources, merge: false })
  } catch (error) {
    throw new Error('Config failed loading', { cause: error })
  }

  const [filepath] = result.sources
  if (!result.config || !filepath) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  const config = result.config as PossibleConfig<CLIOptions>
  const cli: CLIOptions = { config: configPath, input, watch, logLevel }
  const resolved = await (typeof config === 'function' ? config(cli) : config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return {
    configPath: filepath,
    configs: userConfigs.map((item) => {
      const config: Config = { ...item, plugins: item.plugins ?? [] }
      return config
    }),
  }
}

type RunPostGenerateOptions = {
  commands: Array<PostGenerateCommand>
  hooks: Hookable<KubbHooks>
}

/**
 * Outcome of a single hook subprocess, returned by `runHook` alongside the
 * `kubb:hook:end` hook it emits for the loggers.
 */
export type HookResult = {
  /**
   * `true` when the command exited with code `0`.
   */
  success: boolean
  /**
   * What went wrong, `null` when the command succeeded.
   */
  error: Error | null
  /**
   * Captured stdout, only present on a non-zero exit.
   */
  stdout?: string
  /**
   * Captured stderr, only present on a non-zero exit.
   */
  stderr?: string
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

  return isGreater(truncate(latest, 'patch') as string, truncate(current, 'patch') as string)
}

/**
 * Tokenizes a shell command string, respecting single and double quotes.
 *
 * @example
 * ```ts
 * tokenize('git commit -m "initial commit"')
 * // → ['git', 'commit', '-m', 'initial commit']
 * ```
 */
function tokenize(command: string): Array<string> {
  return (command.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) ?? []).map((token) => token.replace(/^["']|["']$/g, ''))
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

    const hookId = randomUUID()
    const commandWithArgs = [cmd, ...args].join(' ')

    await hooks.callHook('kubb:hook:start', { id: hookId, command: cmd, name, args })
    results.push(await runHook({ id: hookId, command: cmd, name, args, commandWithArgs, hooks }))
  }

  return results
}

type RunHookOptions = {
  id: string
  command: string
  name?: string
  args?: ReadonlyArray<string>
  commandWithArgs: string
  hooks: Hookable<KubbHooks>
}

/**
 * Spawns a hook command and returns its outcome, mirroring it through `kubb:hook:end` for the
 * loggers. A non-zero exit returns `success: false` rather than throwing, so the caller can turn
 * it into a diagnostic. Other spawn errors do the same. Output is streamed through `kubb:hook:line`
 * only while a listener is attached.
 */
export async function runHook({ id, command, name, args, commandWithArgs, hooks }: RunHookOptions): Promise<HookResult> {
  const emitEnd = async (result: HookResult): Promise<HookResult> => {
    await hooks.callHook('kubb:hook:end', { command, name, args, id, ...result })
    return result
  }

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

type WatcherLog = {
  info: (message: string) => void
  error: (message: string) => void
}

/**
 * Listens for a raw-mode `r` keypress and calls `onRestart`, mirroring the "press r to restart"
 * convention of Vite and webpack-dev-server. Returns `null` (nothing to tear down) outside an
 * interactive TTY, where there is no keyboard to read from (CI, piped input).
 *
 * Gated on `stdin` alone, not `canUseTTY()` (which reads `stdout`'s size to decide whether to
 * draw the clack UI) — piping stdout to a file or logger shouldn't disable a keyboard shortcut
 * that only needs a readable stdin.
 *
 * Raw mode disables the terminal's own signal handling, so Ctrl+C no longer raises `SIGINT` on
 * its own; this re-raises it manually to keep that shortcut working.
 */
function watchRestartKey(onRestart: () => void): (() => void) | null {
  if (!process.stdin.isTTY) return null

  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)

  const onKeypress = (str: string, key: { ctrl?: boolean; name?: string } | undefined) => {
    if (key?.ctrl && key.name === 'c') {
      process.emit('SIGINT')
      return
    }
    if (str === 'r') onRestart()
  }

  process.stdin.on('keypress', onKeypress)
  process.stdin.resume()

  return () => {
    process.stdin.off('keypress', onKeypress)
    process.stdin.setRawMode(false)
    process.stdin.pause()
  }
}

/**
 * Starts a file watcher on the given paths and calls `cb` on any change.
 * Ignores `.git` and `node_modules` directories. Event bursts (an editor save emits several)
 * are debounced into one build, and builds never overlap: changes during a build queue exactly
 * one rebuild. In an interactive terminal, pressing `r` triggers the same rebuild on demand.
 */
export async function startWatcher(
  path: Array<string>,
  cb: (path: Array<string>) => Promise<void>,
  log: WatcherLog = { info: console.log, error: console.log },
): Promise<void> {
  const { watch } = await import('chokidar')
  // `ignoreInitial` skips the `add` events chokidar fires for existing files at startup, which
  // would otherwise rebuild right after the initial run.
  const watcher = watch(path, { ignorePermissionErrors: true, ignored: WATCHER_IGNORED_PATHS, ignoreInitial: true })

  // Bursts never overlap builds on the shared hooks emitter: a change (or a manual restart)
  // queues exactly one rerun.
  const runBuild = createSerialRunner({
    run: () => cb(path),
    onError: () => log.error(styleText('red', 'Watcher failed')),
  })

  const stopRestartKey = watchRestartKey(() => {
    log.info(styleText('cyan', 'Restarting...'))
    void runBuild()
  })

  const stop = () => {
    watcher.close()
    stopRestartKey?.()
  }

  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watcher.on('all', (type, file) => {
    log.info(styleText('yellow', styleText('bold', `Change detected: ${type} ${file}`)))
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void runBuild()
    }, WATCHER_DEBOUNCE_MS)
  })

  if (stopRestartKey) {
    log.info(styleText('dim', 'Press r to restart'))
  }
}
