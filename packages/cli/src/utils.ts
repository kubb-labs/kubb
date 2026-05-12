import { createHash } from 'node:crypto'
import { styleText } from 'node:util'
import type { AsyncEventEmitter } from '@internals/utils'
import { toError, tokenize } from '@internals/utils'
import type { CLIOptions, Config, KubbHookEndContext, KubbHooks, PossibleConfig } from '@kubb/core'
import { cosmiconfig } from 'cosmiconfig'
import { createJiti } from 'jiti'
import { NonZeroExitError, x } from 'tinyexec'
import { WATCHER_IGNORED_PATHS } from './constants.ts'

type CosmiconfigResult = {
  /**
   * Absolute path to the resolved config file.
   */
  filepath: string
  /**
   * `true` when the config file exists but exports no value.
   */
  isEmpty?: boolean
  /**
   * Parsed and validated Kubb config object, or a factory function that returns one.
   */
  config: PossibleConfig<CLIOptions>
}

const jiti = createJiti(import.meta.url, {
  jsx: {
    runtime: 'automatic',
    importSource: '@kubb/renderer-jsx',
  },
  moduleCache: false,
})

const tsLoader = async (configFile: string) => {
  return jiti.import(configFile, { default: true })
}

/**
 * Discovers and loads a Kubb config file using cosmiconfig.
 * Supports `.ts`, `.mts`, and `.cts` via jiti.
 * Pass `config` to load a specific file path, or omit to search from the current directory.
 */
async function getCosmiConfig(moduleName: string, config?: string): Promise<CosmiconfigResult> {
  let result: CosmiconfigResult
  const searchPlaces = [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,

    `.${moduleName}rc.ts`,
    `.${moduleName}rc.mts`,
    `.${moduleName}rc.cts`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.mjs`,
    `.${moduleName}rc.cjs`,

    `${moduleName}.config.ts`,
    `${moduleName}.config.mts`,
    `${moduleName}.config.cts`,
    `${moduleName}.config.js`,
    `${moduleName}.config.mjs`,
    `${moduleName}.config.cjs`,
  ]
  const explorer = cosmiconfig(moduleName, {
    cache: false,
    searchPlaces: [
      ...searchPlaces.map((searchPlace) => {
        return `.config/${searchPlace}`
      }),
      ...searchPlaces.map((searchPlace) => {
        return `configs/${searchPlace}`
      }),
      ...searchPlaces,
    ],
    loaders: {
      '.ts': tsLoader,
      '.mts': tsLoader,
      '.cts': tsLoader,
    },
  })

  try {
    result = config ? ((await explorer.load(config)) as CosmiconfigResult) : ((await explorer.search()) as CosmiconfigResult)
  } catch (error) {
    throw new Error('Config failed loading', { cause: error })
  }

  if (result?.isEmpty || !result || !result.config) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  return result as CosmiconfigResult
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
export async function getConfigs({ configPath, input }: GetConfigsOptions): Promise<GetConfigsResult> {
  const result = await getCosmiConfig('kubb', configPath)
  const resolved = await (typeof result.config === 'function' ? result.config({ input } as CLIOptions) : result.config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return {
    configPath: result.filepath,
    configs: userConfigs.map((item) => ({ ...item, plugins: item.plugins ?? [] }) as Config),
  }
}

type ExecutingHooksProps = {
  /**
   * The `hooks` section from the Kubb config containing `done` commands to run.
   */
  configHooks: NonNullable<Config['hooks']>
  /**
   * Event emitter used to broadcast hook lifecycle and log events.
   */
  hooks: AsyncEventEmitter<KubbHooks>
}

/**
 * Runs the `done` hooks defined in a Kubb config in sequence.
 * Each command is tokenized, executed via `kubb:hook:start`, and awaited through `kubb:hook:end`.
 */
export async function executeHooks({ configHooks, hooks }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(configHooks.done) ? configHooks.done : [configHooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ...args] = tokenize(command)

    if (!cmd) {
      continue
    }

    const hookId = createHash('sha256').update(command).digest('hex')

    // Wire up the hook:end listener BEFORE emitting hook:start to avoid the race condition
    // where hook:end fires synchronously inside emit('kubb:hook:start') before the listener is registered.
    const hookEndPromise = new Promise<void>((resolve, reject) => {
      const handler = (ctx: KubbHookEndContext) => {
        if (ctx.id !== hookId) return
        hooks.off('kubb:hook:end', handler)
        if (!ctx.success) {
          reject(ctx.error ?? new Error(`Hook failed: ${command}`))
          return
        }
        hooks
          .emit('kubb:success', { message: `${styleText('dim', command)} successfully executed` })
          .then(resolve)
          .catch(reject)
      }
      hooks.on('kubb:hook:end', handler)
    })

    await hooks.emit('kubb:hook:start', { id: hookId, command: cmd, args })
    await hookEndPromise
  }
}

type HookOutputSink = {
  /**
   * Called for each streamed stdout line while the hook runs.
   */
  onLine?: (line: string) => void
  /**
   * Called with stderr content after the hook exits with a non-zero code.
   */
  onStderr?: (text: string) => void
  /**
   * Called with stdout content after the hook exits with a non-zero code.
   */
  onStdout?: (text: string) => void
}

type RunHookOptions = {
  /**
   * Stable hash ID that links the matching `kubb:hook:start` and `kubb:hook:end` events.
   */
  id: string
  /**
   * Executable name to spawn, e.g. `'prettier'` or `'oxlint'`.
   */
  command: string
  /**
   * Arguments passed to the command.
   */
  args?: readonly string[]
  /**
   * Pre-formatted `command + args` string used in log messages.
   */
  commandWithArgs: string
  /**
   * Event emitter used to broadcast hook lifecycle and debug events.
   */
  context: AsyncEventEmitter<KubbHooks>
  /**
   * When `true`, streams process output line-by-line via `sink.onLine`.
   *
   * @default false
   */
  stream?: boolean
  /**
   * Optional output sink for forwarding subprocess output to a logger.
   */
  sink?: HookOutputSink
}

/**
 * Executes a hook command, emits debug and completion events, and forwards output to an optional sink.
 */
export async function runHook({ id, command, args, commandWithArgs, context, stream = false, sink }: RunHookOptions): Promise<void> {
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

    await context.emit('kubb:debug', {
      date: new Date(),
      logs: [result.stdout.trimEnd()],
    })

    await context.emit('kubb:hook:end', {
      command,
      args,
      id,
      success: true,
      error: null,
    })
  } catch (err) {
    if (!(err instanceof NonZeroExitError)) {
      await context.emit('kubb:hook:end', {
        command,
        args,
        id,
        success: false,
        error: toError(err),
      })
      await context.emit('kubb:error', { error: toError(err) })
      return
    }

    const stderr = err.output?.stderr ?? ''
    const stdout = err.output?.stdout ?? ''

    await context.emit('kubb:debug', {
      date: new Date(),
      logs: [stdout, stderr].filter(Boolean),
    })

    if (stderr) sink?.onStderr?.(stderr)
    if (stdout) sink?.onStdout?.(stdout)

    const errorMessage = new Error(`Hook execute failed: ${commandWithArgs}`)

    await context.emit('kubb:hook:end', {
      command,
      args,
      id,
      success: false,
      error: errorMessage,
    })
    await context.emit('kubb:error', { error: errorMessage })
  }
}

/**
 * Starts a file watcher on the given paths and calls `cb` on any change.
 * Ignores `.git` and `node_modules` directories.
 */
export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')
  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored: WATCHER_IGNORED_PATHS,
  })
  watcher.on('all', async (type, file) => {
    console.log(styleText('yellow', styleText('bold', `Change detected: ${type} ${file}`)))

    try {
      await cb(path)
    } catch (_e) {
      console.log(styleText('red', 'Watcher failed'))
    }
  })
}
