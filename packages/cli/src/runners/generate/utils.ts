import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { createModuleLoader } from '@internals/shared'
import { createSerialRunner, toError } from '@internals/utils'
import type { CLIOptions, Config, KubbHooks, PossibleConfig, Hookable } from '@kubb/core'
import { NonZeroExitError, x } from 'tinyexec'
import { type LoadConfigResult, type LoadConfigSource, loadConfig } from 'unconfig'
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
   * Optional OpenAPI input path that overrides `config.input.path` for this run.
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
    configs: userConfigs.map((item) => ({ ...item, plugins: item.plugins ?? [] }) as Config),
  }
}

type ExecuteHooksOptions = {
  configHooks: NonNullable<Config['hooks']>
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

let hookSequence = 0

/**
 * Returns a process-unique id that correlates a hook's `kubb:hook:start` and `kubb:hook:end`
 * emissions, which loggers use to key their per-hook state.
 */
export function createHookId(): string {
  hookSequence += 1
  return `hook-${hookSequence}`
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
  const release = (value: string) => value.split('-')[0] ?? ''
  const isNumeric = (value: string) => /^\d+(\.\d+)*$/.test(value)

  const currentRelease = release(current)
  const latestRelease = release(latest)
  if (!isNumeric(currentRelease) || !isNumeric(latestRelease)) return false

  return currentRelease.localeCompare(latestRelease, undefined, { numeric: true }) < 0
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
 * Runs the `done` hooks defined in a Kubb config in sequence and returns each hook's outcome,
 * so the caller can turn failures into diagnostics.
 */
export async function executeHooks({ configHooks, hooks }: ExecuteHooksOptions): Promise<Array<HookResult>> {
  const commands = Array.isArray(configHooks.done) ? configHooks.done : [configHooks.done].filter(Boolean)
  const results: Array<HookResult> = []

  for (const command of commands) {
    const [cmd, ...args] = tokenize(command)
    if (!cmd) continue

    const hookId = createHookId()
    const commandWithArgs = [cmd, ...args].join(' ')

    await hooks.callHook('kubb:hook:start', { id: hookId, command: cmd, args })
    results.push(await runHook({ id: hookId, command: cmd, args, commandWithArgs, hooks }))
  }

  return results
}

type RunHookOptions = {
  id: string
  command: string
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
export async function runHook({ id, command, args, commandWithArgs, hooks }: RunHookOptions): Promise<HookResult> {
  const emitEnd = async (result: HookResult): Promise<HookResult> => {
    await hooks.callHook('kubb:hook:end', { command, args, id, ...result })
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
    await hooks.callHook('kubb:success', { message: `${styleText('dim', commandWithArgs)} successfully executed` })
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
 * Starts a file watcher on the given paths and calls `cb` on any change.
 * Ignores `.git` and `node_modules` directories. Event bursts (an editor save emits several)
 * are debounced into one build, and builds never overlap: changes during a build queue exactly
 * one rebuild.
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
}
