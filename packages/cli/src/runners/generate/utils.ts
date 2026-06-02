import { createHash } from 'node:crypto'
import { styleText } from 'node:util'
import type { AsyncEventEmitter } from '@internals/utils'
import { toError, tokenize } from '@internals/utils'
import { createDebugger } from '@kubb/core'
import type { CLIOptions, Config, KubbHooks, PossibleConfig } from '@kubb/core'
import { cosmiconfig } from 'cosmiconfig'
import { createJiti } from 'jiti'
import { NonZeroExitError, x } from 'tinyexec'
import type { HookSinkFactory, HookSinkOptions } from '../../loggers/utils.ts'
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
export async function getConfigs({ configPath, input, watch, logLevel }: GetConfigsOptions): Promise<GetConfigsResult> {
  const result = await getCosmiConfig(configPath)
  const cli: CLIOptions = { config: configPath, input, watch, logLevel }
  const resolved = await (typeof result.config === 'function' ? result.config(cli) : result.config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return {
    configPath: result.filepath,
    configs: userConfigs.map((item) => ({ ...item, plugins: item.plugins ?? [] }) as Config),
  }
}

type ExecuteHooksOptions = {
  configHooks: NonNullable<Config['hooks']>
  hooks: AsyncEventEmitter<KubbHooks>
  makeSink?: HookSinkFactory | null
}

/**
 * Runs the `done` hooks defined in a Kubb config in sequence.
 */
export async function executeHooks({ configHooks, hooks, makeSink }: ExecuteHooksOptions): Promise<void> {
  const commands = Array.isArray(configHooks.done) ? configHooks.done : [configHooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ...args] = tokenize(command)
    if (!cmd) continue

    const hookId = createHash('sha256').update(command).digest('hex')
    const commandWithArgs = [cmd, ...args].join(' ')

    await hooks.emit('kubb:hook:start', { id: hookId, command: cmd, args })

    const { stream = false, onLine, onStdout, onStderr } = makeSink?.(commandWithArgs, hookId) ?? {}
    await runHook({ id: hookId, command: cmd, args, commandWithArgs, hooks, stream, sink: { onLine, onStdout, onStderr } })
  }
}

type RunHookOptions = {
  id: string
  command: string
  args?: ReadonlyArray<string>
  commandWithArgs: string
  hooks: AsyncEventEmitter<KubbHooks>
  stream?: boolean
  sink?: HookSinkOptions
}

export async function runHook({ id, command, args, commandWithArgs, hooks, stream = false, sink }: RunHookOptions): Promise<void> {
  const emitEnd = (success: boolean, error: Error | null) => hooks.emit('kubb:hook:end', { command, args, id, success, error })
  const debug = createDebugger('kubb:hook', { hooks })

  try {
    const proc = x(command, [...(args ?? [])], {
      nodeOptions: { detached: process.platform !== 'win32' },
      throwOnError: true,
    })

    if (stream && sink?.onLine) {
      for await (const line of proc) {
        sink.onLine(line)
      }
    }

    const result = await proc
    debug('%s', result.stdout.trimEnd())
    await hooks.emit('kubb:success', { message: `${styleText('dim', commandWithArgs)} successfully executed` })
    await emitEnd(true, null)
  } catch (err) {
    if (!(err instanceof NonZeroExitError)) {
      const error = toError(err)
      await emitEnd(false, error)
      await hooks.emit('kubb:error', { error })
      return
    }

    const stderr = err.output?.stderr ?? ''
    const stdout = err.output?.stdout ?? ''

    debug('%s', [stdout, stderr].filter(Boolean).join('\n'))

    if (stderr) sink?.onStderr?.(stderr)
    if (stdout) sink?.onStdout?.(stdout)

    const error = new Error(`Hook execute failed: ${commandWithArgs}`)
    await emitEnd(false, error)
    await hooks.emit('kubb:error', { error })
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
