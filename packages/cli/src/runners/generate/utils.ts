import { hash } from 'node:crypto'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { createModuleLoader } from '@internals/shared'
import type { AsyncEventEmitter } from '@internals/utils'
import { toError } from '@internals/utils'
import type { CLIOptions, Config, KubbHooks, PossibleConfig } from '@kubb/core'
import { NonZeroExitError, x } from 'tinyexec'
import { type LoadConfigResult, type LoadConfigSource, loadConfig } from 'unconfig'
import { WATCHER_IGNORED_PATHS } from '../../constants.ts'

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
  hooks: AsyncEventEmitter<KubbHooks>
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
 * Runs the `done` hooks defined in a Kubb config in sequence.
 */
export async function executeHooks({ configHooks, hooks }: ExecuteHooksOptions): Promise<void> {
  const commands = Array.isArray(configHooks.done) ? configHooks.done : [configHooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ...args] = tokenize(command)
    if (!cmd) continue

    const hookId = hash('sha256', command, 'hex')
    const commandWithArgs = [cmd, ...args].join(' ')

    await hooks.emit('kubb:hook:start', { id: hookId, command: cmd, args })
    await runHook({ id: hookId, command: cmd, args, commandWithArgs, hooks })
  }
}

type RunHookOptions = {
  id: string
  command: string
  args?: ReadonlyArray<string>
  commandWithArgs: string
  hooks: AsyncEventEmitter<KubbHooks>
}

/**
 * Spawns a hook command and reports its outcome through `kubb:hook:end`.
 * A non-zero exit signals failure via `kubb:hook:end` rather than throwing, so the caller can turn
 * it into a diagnostic. Other spawn errors do the same. Output is streamed through `kubb:hook:line`
 * only while a listener is attached.
 */
export async function runHook({ id, command, args, commandWithArgs, hooks }: RunHookOptions): Promise<void> {
  const emitEnd = (success: boolean, error: Error | null, output?: { stdout?: string; stderr?: string }) =>
    hooks.emit('kubb:hook:end', { command, args, id, success, error, ...output })

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
        await hooks.emit('kubb:hook:line', { id, line })
      }
    }

    await proc
    await hooks.emit('kubb:success', { message: `${styleText('dim', commandWithArgs)} successfully executed` })
    await emitEnd(true, null)
  } catch (err) {
    if (!(err instanceof NonZeroExitError)) {
      const error = toError(err)
      await emitEnd(false, error)
      return
    }

    const stderr = err.output?.stderr ?? ''
    const stdout = err.output?.stdout ?? ''

    const error = new Error(`Hook execute failed: ${commandWithArgs}`)
    // Signal the failure via `kubb:hook:end` only, carrying the captured output so the logger can
    // render it. The caller turns this into a coded diagnostic and emits that through
    // `Diagnostics.emit`, so emitting `kubb:error` here would render it twice.
    await emitEnd(false, error, { stdout, stderr })
  }
}

type WatcherLog = {
  info: (message: string) => void
  error: (message: string) => void
}

/**
 * Starts a file watcher on the given paths and calls `cb` on any change.
 * Ignores `.git` and `node_modules` directories.
 */
export async function startWatcher(
  path: Array<string>,
  cb: (path: Array<string>) => Promise<void>,
  log: WatcherLog = { info: console.log, error: console.log },
): Promise<void> {
  const { watch } = await import('chokidar')
  const watcher = watch(path, { ignorePermissionErrors: true, ignored: WATCHER_IGNORED_PATHS })

  process.once('SIGINT', () => {
    watcher.close()
  })
  process.once('SIGTERM', () => {
    watcher.close()
  })

  watcher.on('all', async (type, file) => {
    log.info(styleText('yellow', styleText('bold', `Change detected: ${type} ${file}`)))
    try {
      await cb(path)
    } catch (_e) {
      log.error(styleText('red', 'Watcher failed'))
    }
  })
}
