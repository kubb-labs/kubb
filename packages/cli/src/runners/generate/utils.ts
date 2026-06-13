import { hash } from 'node:crypto'
import { styleText } from 'node:util'
import type { AsyncEventEmitter } from '@internals/utils'
import { toError } from '@internals/utils'
import type { CLIOptions, Config, KubbHooks, PossibleConfig } from '@kubb/core'
import { cosmiconfig } from 'cosmiconfig'
import { createJiti } from 'jiti'
import { NonZeroExitError, x } from 'tinyexec'
import { WATCHER_IGNORED_PATHS } from '../../constants.ts'

type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: PossibleConfig<CLIOptions>
}

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: 'automatic', importSource: '@kubb/renderer-jsx' },
  moduleCache: false,
})

const tsLoader = (configFile: string) => jiti.import(configFile, { default: true })

const MODULE_NAME = 'kubb'

const BASE_SEARCH_PLACES = [
  'package.json',
  `.${MODULE_NAME}rc`,
  `.${MODULE_NAME}rc.json`,
  `.${MODULE_NAME}rc.yaml`,
  `.${MODULE_NAME}rc.yml`,
  `.${MODULE_NAME}rc.ts`,
  `.${MODULE_NAME}rc.mts`,
  `.${MODULE_NAME}rc.cts`,
  `.${MODULE_NAME}rc.js`,
  `.${MODULE_NAME}rc.mjs`,
  `.${MODULE_NAME}rc.cjs`,
  `${MODULE_NAME}.config.ts`,
  `${MODULE_NAME}.config.mts`,
  `${MODULE_NAME}.config.cts`,
  `${MODULE_NAME}.config.js`,
  `${MODULE_NAME}.config.mjs`,
  `${MODULE_NAME}.config.cjs`,
]

const SEARCH_PLACES = ['', '.config/', 'configs/'].flatMap((prefix) => BASE_SEARCH_PLACES.map((p) => `${prefix}${p}`))

async function getCosmiConfig(configFile?: string): Promise<CosmiconfigResult> {
  const explorer = cosmiconfig(MODULE_NAME, {
    cache: false,
    searchPlaces: SEARCH_PLACES,
    loaders: { '.ts': tsLoader, '.mts': tsLoader, '.cts': tsLoader },
  })

  let result: CosmiconfigResult
  try {
    result = (configFile ? await explorer.load(configFile) : await explorer.search()) as CosmiconfigResult
  } catch (error) {
    throw new Error('Config failed loading', { cause: error })
  }

  if (!result?.config || result.isEmpty) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result
}

type GetConfigsOptions = {
  /**
   * Explicit path to the Kubb config file. When omitted, cosmiconfig searches from the current directory.
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
  /**
   * When set, turns off the incremental build cache for this run, forcing a full regeneration.
   */
  noCache?: boolean
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
 * Discovers the Kubb config via cosmiconfig and resolves it into a normalized array of configs.
 * Every config in the result is guaranteed to have a `plugins` array.
 */
export async function getConfigs({ configPath, input, watch, logLevel, noCache }: GetConfigsOptions): Promise<GetConfigsResult> {
  const result = await getCosmiConfig(configPath)
  const cli: CLIOptions = { config: configPath, input, watch, logLevel, noCache }
  const resolved = await (typeof result.config === 'function' ? result.config(cli) : result.config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return {
    configPath: result.filepath,
    configs: userConfigs.map((item) => {
      const config = { ...item, plugins: item.plugins ?? [] } as Config
      // `--no-cache` overrides whatever cache the config resolved to (fsCache by default), so the
      // run regenerates everything instead of restoring a snapshot.
      return noCache ? { ...config, cache: undefined } : config
    }),
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
 * tokenize('git commit -m "initial commit"')
 * // → ['git', 'commit', '-m', 'initial commit']
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
