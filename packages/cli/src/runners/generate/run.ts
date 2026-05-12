import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { AsyncEventEmitter } from '@internals/utils'
import { AsyncEventEmitter as AsyncEventEmitterClass, detectFormatter, detectLinter, executeIfOnline, formatters, linters, toError } from '@internals/utils'
import { type Config, createKubb, isInputPath, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { version } from '../../../package.json'
import { KUBB_NPM_PACKAGE_URL } from '../../constants.ts'
import { setupLogger, type HookSinkFactory } from '../../loggers/utils.ts'
import { buildTelemetryEvent, sendTelemetry } from '../../telemetry.ts'
import { executeHooks, getConfigs, startWatcher } from './utils.ts'

type GenerateProps = {
  /**
   * Optional input path override that replaces `config.input.path` for this run.
   */
  input?: string
  /**
   * Resolved Kubb config for this generation entry.
   */
  config: Config
  /**
   * Event emitter used to broadcast lifecycle and log events to registered loggers.
   */
  hooks: AsyncEventEmitter<KubbHooks>
  /**
   * Numeric log level used to gate verbose or debug output.
   */
  logLevel: number
  /**
   * Hook sink factory returned by the logger, forwarded to hook execution to route subprocess output.
   */
  makeSink?: HookSinkFactory
}

type ToolMap = typeof formatters | typeof linters

type RunToolPassOptions = {
  /**
   * Configured tool value from the Kubb config, e.g. `'auto'`, `'biome'`, or `'prettier'`.
   */
  toolValue: string
  /**
   * Auto-detects the tool from the project. Returns `null` when none is found.
   */
  detect: () => Promise<string | null>
  /**
   * Map of all known tools keyed by their identifier string.
   */
  toolMap: ToolMap
  /**
   * Short noun used in the auto-detected message, e.g. `'formatter'` or `'linter'`.
   */
  toolLabel: string
  /**
   * Verb prefix for the success message, e.g. `'Formatting'` or `'Linting'`.
   */
  successPrefix: string
  /**
   * Warning message emitted when auto-detection finds no usable tool.
   */
  noToolMessage: string
  /**
   * `config.name` value used to derive a stable hash ID for the hook event pair.
   */
  configName: string | undefined
  /**
   * Absolute path to the output directory passed to the tool command.
   */
  outputPath: string
  /**
   * Numeric log level used to gate verbose output in success messages.
   */
  logLevel: number
  /**
   * Event emitter used to broadcast tool lifecycle and log events.
   */
  hooks: AsyncEventEmitter<KubbHooks>
  /**
   * Emits `kubb:format:start` or `kubb:lint:start` before the tool runs.
   */
  onStart: () => Promise<void>
  /**
   * Emits `kubb:format:end` or `kubb:lint:end` after the tool finishes.
   */
  onEnd: () => Promise<void>
}

async function runToolPass({
  toolValue,
  detect,
  toolMap,
  toolLabel,
  successPrefix,
  noToolMessage,
  configName,
  outputPath,
  logLevel,
  hooks,
  onStart,
  onEnd,
}: RunToolPassOptions) {
  await onStart()

  let resolvedTool = toolValue
  if (resolvedTool === 'auto') {
    const detected = await detect()
    if (!detected) {
      await hooks.emit('kubb:warn', { message: noToolMessage })
    } else {
      resolvedTool = detected
      await hooks.emit('kubb:info', { message: `Auto-detected ${toolLabel}: ${styleText('dim', resolvedTool)}` })
    }
  }

  let toolError: Error | undefined

  if (resolvedTool && resolvedTool !== 'auto' && resolvedTool in toolMap) {
    const toolConfig = toolMap[resolvedTool as keyof ToolMap]

    try {
      const hookId = createHash('sha256').update([configName, resolvedTool].filter(Boolean).join('-')).digest('hex')

      // Wire up the hook:end listener BEFORE emitting hook:start to avoid the race condition
      // where hook:end fires synchronously inside emit('kubb:hook:start') before the listener is registered.
      const hookEndPromise = new Promise<void>((resolve, reject) => {
        const handler = (ctx: { id?: string; command: string; args?: readonly string[]; success: boolean; error: Error | null }) => {
          if (ctx.id !== hookId) return
          hooks.off('kubb:hook:end', handler)
          if (!ctx.success) {
            reject(ctx.error ?? new Error(`${toolConfig.errorMessage}`))
            return
          }
          hooks
            .emit('kubb:success', {
              message: [
                `${successPrefix} with ${styleText('dim', resolvedTool)}`,
                logLevel >= logLevelMap.info ? `on ${styleText('dim', outputPath)}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            })
            .then(resolve)
            .catch(reject)
        }
        hooks.on('kubb:hook:end', handler)
      })

      await hooks.emit('kubb:hook:start', {
        id: hookId,
        command: toolConfig.command,
        args: toolConfig.args(outputPath),
      })

      await hookEndPromise
    } catch (caughtError) {
      // Use the actual error from the hook. toolConfig.errorMessage (e.g. "Oxlint not found")
      // is misleading when the binary was found and ran but exited with a non-zero code.
      // runHook already emitted kubb:error for binary-not-found cases; here we surface the
      // real reason (e.g. "Hook execute failed: oxlint --fix …") for non-zero exits.
      const err = toError(caughtError)
      await hooks.emit('kubb:error', { error: err })
      toolError = err
    }
  }

  await onEnd()

  if (toolError) {
    throw toolError
  }
}

async function generate(options: GenerateProps): Promise<void> {
  const { input, hooks, logLevel, makeSink } = options

  const hrStart = process.hrtime()
  const inputPath = input ?? (options.config.input && 'path' in options.config.input ? options.config.input.path : undefined)

  const config: Config = {
    ...options.config,
    input: inputPath
      ? {
          ...options.config.input,
          path: inputPath,
        }
      : options.config.input,
    ...options.config.output,
  } satisfies Config

  const kubb = createKubb(config, { hooks })
  await kubb.setup()

  await hooks.emit('kubb:generation:start', { config })

  await hooks.emit('kubb:info', { message: config.name ? `Setup generation ${styleText('bold', config.name)}` : 'Setup generation', info: inputPath })

  await hooks.emit('kubb:info', { message: config.name ? `Build generation ${styleText('bold', config.name)}` : 'Build generation', info: inputPath })

  const { files, failedPlugins, pluginTimings, error, driver } = await kubb.safeBuild()

  await hooks.emit('kubb:info', { message: 'Load summary' })

  const telemetryPlugins = Array.from(driver.plugins.values(), (p) => ({
    name: p.name,
    options: p.options as Record<string, unknown>,
  }))

  // Handle build failures (either from failed plugins or general errors)

  const hasFailures = failedPlugins.size > 0 || error
  if (hasFailures) {
    // Collect all errors from failed plugins and general error
    const allErrors: Error[] = [
      error,
      ...Array.from(failedPlugins)
        .filter((it) => it.error)
        .map((it) => it.error),
    ].filter(Boolean)

    for (const err of allErrors) {
      await hooks.emit('kubb:error', { error: err })
    }

    await hooks.emit('kubb:generation:end', { config, files, sources: kubb.sources })

    await hooks.emit('kubb:generation:summary', {
      config,
      failedPlugins,
      filesCreated: files.length,
      status: 'failed',
      hrStart,
      pluginTimings: logLevel >= logLevelMap.verbose ? pluginTimings : undefined,
    })

    await sendTelemetry(
      buildTelemetryEvent({
        command: 'generate',
        kubbVersion: version,
        plugins: telemetryPlugins,
        hrStart,
        filesCreated: files.length,
        status: 'failed',
      }),
    )

    process.exit(1)
  }

  await hooks.emit('kubb:success', { message: 'Generation succeeded', info: inputPath })
  await hooks.emit('kubb:generation:end', { config, files, sources: kubb.sources })

  const outputPath = path.resolve(config.root, config.output.path)

  const toolPasses = [
    config.output.format && {
      toolValue: config.output.format,
      detect: detectFormatter,
      toolMap: formatters,
      toolLabel: 'formatter',
      successPrefix: 'Formatting',
      noToolMessage: 'No formatter found (oxfmt, biome, or prettier). Skipping formatting.',
      onStart: () => hooks.emit('kubb:format:start'),
      onEnd: () => hooks.emit('kubb:format:end'),
    },
    config.output.lint && {
      toolValue: config.output.lint,
      detect: detectLinter,
      toolMap: linters,
      toolLabel: 'linter',
      successPrefix: 'Linting',
      noToolMessage: 'No linter found (oxlint, biome, or eslint). Skipping linting.',
      onStart: () => hooks.emit('kubb:lint:start'),
      onEnd: () => hooks.emit('kubb:lint:end'),
    },
  ].filter(Boolean) as Omit<RunToolPassOptions, 'configName' | 'outputPath' | 'logLevel' | 'hooks'>[]

  for (const pass of toolPasses) {
    await runToolPass({ ...pass, configName: config.name, outputPath, logLevel, hooks })
  }

  if (config.hooks) {
    await hooks.emit('kubb:hooks:start')
    await executeHooks({ configHooks: config.hooks, hooks, makeSink })

    await hooks.emit('kubb:hooks:end')
  }

  // Only reached when there are no failures (process.exit(1) is called above otherwise)
  await hooks.emit('kubb:generation:summary', {
    config,
    failedPlugins,
    filesCreated: files.length,
    status: 'success',
    hrStart,
    pluginTimings,
  })

  await sendTelemetry(
    buildTelemetryEvent({
      command: 'generate',
      kubbVersion: version,
      plugins: telemetryPlugins,
      hrStart,
      filesCreated: files.length,
      status: 'success',
    }),
  )
}

type GenerateCommandOptions = {
  /**
   * Optional OpenAPI input path that overrides `config.input.path` for this run.
   */
  input?: string
  /**
   * Explicit path to the Kubb config file. When omitted, cosmiconfig searches from the current directory.
   */
  configPath?: string
  /**
   * Log level key string as passed from the CLI flag, e.g. `'info'`, `'verbose'`, or `'debug'`.
   */
  logLevel: string
  /**
   * When `true`, starts a file watcher and re-runs generation on every change to the input file.
   */
  watch: boolean
}

/**
 * Runs the full Kubb generation lifecycle for the given CLI options.
 * Sets up the logger, checks for a newer version, loads configs, and calls `generate` for each config entry.
 */
export async function run({ input, configPath, logLevel: logLevelKey, watch }: GenerateCommandOptions): Promise<void> {
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new AsyncEventEmitterClass<KubbHooks>()

  const makeSink = await setupLogger(hooks, { logLevel })

  await executeIfOnline(async () => {
    try {
      const res = await fetch(KUBB_NPM_PACKAGE_URL)
      const data = (await res.json()) as { version: string }
      const latestVersion = data.version

      if (latestVersion && version < latestVersion) {
        await hooks.emit('kubb:version:new', { currentVersion: version, latestVersion })
      }
    } catch {
      // Ignore network errors for version check
    }
  })

  try {
    const { configs, configPath: resolvedConfigPath } = await getConfigs({ configPath, input })

    await hooks.emit('kubb:config:start')
    await hooks.emit('kubb:info', { message: 'Config loaded', info: path.relative(process.cwd(), resolvedConfigPath) })
    await hooks.emit('kubb:success', { message: 'Config loaded successfully', info: path.relative(process.cwd(), resolvedConfigPath) })
    await hooks.emit('kubb:config:end', { configs })

    await hooks.emit('kubb:lifecycle:start', { version })

    for (const config of configs) {
      if (isInputPath(config) && watch) {
        await startWatcher(
          [input || config.input.path],
          async (paths) => {
            // remove to avoid duplicate listeners after each change
            hooks.removeAll()

            await generate({ input, config, logLevel, hooks, makeSink })

            clack.log.step(styleText('yellow', `Watching for changes in ${paths.join(' and ')}`))
          },
          {
            info: (msg) => clack.log.info(msg),
            error: (msg) => clack.log.error(msg),
          },
        )
      } else {
        await generate({ input, config, logLevel, hooks, makeSink })
      }
    }

    await hooks.emit('kubb:lifecycle:end')
  } catch (error) {
    await hooks.emit('kubb:error', { error: toError(error) })
    process.exit(1)
  }
}
