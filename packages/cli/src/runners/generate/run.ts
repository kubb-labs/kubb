import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { AsyncEventEmitter } from '@internals/utils'
import { AsyncEventEmitter as AsyncEventEmitterClass, detectFormatter, detectLinter, executeIfOnline, formatters, linters, toError } from '@internals/utils'
import { type CLIOptions, type Config, createKubb, diagnosticCode, hasBuildError, isInputPath, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { version } from '../../../package.json'
import { KUBB_NPM_PACKAGE_URL } from '../../constants.ts'
import { setupLogger, type HookSinkFactory } from '../../loggers/utils.ts'
import { buildTelemetryEvent, sendTelemetry } from '../../telemetry.ts'
import { executeHooks, getConfigs, runHook, startWatcher } from './utils.ts'

type GenerateProps = {
  input?: string
  config: Config
  hooks: AsyncEventEmitter<KubbHooks>
  logLevel: number
  makeSink?: HookSinkFactory | null
}

type ToolMap = typeof formatters | typeof linters

type RunToolPassOptions = {
  toolValue: string
  detect: () => Promise<string | null>
  toolMap: ToolMap
  toolLabel: string
  successPrefix: string
  noToolMessage: string
  configName: string | undefined
  outputPath: string
  logLevel: number
  hooks: AsyncEventEmitter<KubbHooks>
  makeSink?: HookSinkFactory | null
  onStart: () => Promise<void>
  onEnd: () => Promise<void>
}

/**
 * Registers a one-shot `kubb:hook:end` listener for `hookId` BEFORE the caller emits `kubb:hook:start`,
 * avoiding the race where a synchronous emitter fires end before the listener is attached.
 */
function waitForHookEnd(
  hooks: AsyncEventEmitter<KubbHooks>,
  hookId: string,
  onSuccess: () => Promise<void> | void,
  fallbackErrorMessage: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const handler = (ctx: { id?: string; command: string; args?: ReadonlyArray<string>; success: boolean; error: Error | null }) => {
      if (ctx.id !== hookId) return
      hooks.off('kubb:hook:end', handler)
      if (!ctx.success) {
        reject(ctx.error ?? new Error(fallbackErrorMessage))
        return
      }
      Promise.resolve(onSuccess()).then(resolve).catch(reject)
    }
    hooks.on('kubb:hook:end', handler)
  })
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
  makeSink,
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
    const hookId = createHash('sha256').update([configName, resolvedTool].filter(Boolean).join('-')).digest('hex')

    const successMessage = [
      `${successPrefix} with ${styleText('dim', resolvedTool)}`,
      logLevel >= logLevelMap.info ? `on ${styleText('dim', outputPath)}` : undefined,
      'successfully',
    ]
      .filter(Boolean)
      .join(' ')

    try {
      const hookArgs = toolConfig.args(outputPath)
      const commandWithArgs = [toolConfig.command, ...hookArgs].join(' ')
      const hookEndPromise = waitForHookEnd(hooks, hookId, () => hooks.emit('kubb:success', { message: successMessage }), toolConfig.errorMessage)

      await hooks.emit('kubb:hook:start', { id: hookId, command: toolConfig.command, args: hookArgs })

      const { stream = false, onLine, onStdout, onStderr } = makeSink?.(commandWithArgs, hookId) ?? {}

      runHook({
        id: hookId,
        command: toolConfig.command,
        args: hookArgs,
        commandWithArgs,
        hooks,
        stream,
        sink: { onLine, onStdout, onStderr },
      }).catch(() => {})

      await hookEndPromise
    } catch (caughtError) {
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

async function generate(options: GenerateProps): Promise<boolean> {
  const { input, hooks, logLevel, makeSink } = options

  const hrStart = process.hrtime()
  const inputPath = input ?? (options.config.input && 'path' in options.config.input ? options.config.input.path : undefined)

  const config: Config = {
    ...options.config,
    input: inputPath ? { ...options.config.input, path: inputPath } : options.config.input,
    ...options.config.output,
  } satisfies Config

  const kubb = createKubb(config, { hooks })

  await hooks.emit('kubb:generation:start', { config })
  await hooks.emit('kubb:info', { message: config.name ? `Setup generation ${styleText('bold', config.name)}` : 'Setup generation', info: inputPath })

  await kubb.setup()

  await hooks.emit('kubb:info', { message: config.name ? `Build generation ${styleText('bold', config.name)}` : 'Build generation', info: inputPath })

  const { files, diagnostics, driver } = await kubb.safeBuild()

  await hooks.emit('kubb:info', { message: 'Load summary' })

  const telemetryPlugins = Array.from(driver.plugins.values(), (p) => ({ name: p.name, options: p.options as Record<string, unknown> }))

  const reportTelemetry = (status: 'success' | 'failed') =>
    sendTelemetry(buildTelemetryEvent({ command: 'generate', kubbVersion: version, plugins: telemetryPlugins, hrStart, filesCreated: files.length, status }))

  // Render every problem, not just on failure, so warnings and info surface too.
  // `timing` diagnostics feed the summary, not the log.
  for (const diagnostic of diagnostics) {
    if (diagnostic.kind === 'timing') {
      continue
    }
    if (diagnostic.code === diagnosticCode.unknown) {
      await hooks.emit('kubb:error', { error: diagnostic.cause ?? new Error(diagnostic.message) })
    } else {
      await hooks.emit('kubb:diagnostic', { diagnostic })
    }
  }

  // Only an error-severity diagnostic fails the run; warnings and info do not.
  if (hasBuildError(diagnostics)) {
    await hooks.emit('kubb:generation:end', { config, storage: kubb.storage })
    await hooks.emit('kubb:generation:summary', { config, diagnostics, filesCreated: files.length, status: 'failed', hrStart })

    await reportTelemetry('failed')
    return false
  }

  await hooks.emit('kubb:success', { message: 'Generation succeeded', info: inputPath })
  await hooks.emit('kubb:generation:end', { config, storage: kubb.storage })

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
  ].filter(Boolean) as Array<Omit<RunToolPassOptions, 'configName' | 'outputPath' | 'logLevel' | 'hooks'>>

  for (const pass of toolPasses) {
    await runToolPass({ ...pass, configName: config.name, outputPath, logLevel, hooks, makeSink })
  }

  if (config.hooks) {
    await hooks.emit('kubb:hooks:start')
    await executeHooks({ configHooks: config.hooks, hooks, makeSink })
    await hooks.emit('kubb:hooks:end')
  }

  await hooks.emit('kubb:generation:summary', { config, diagnostics, filesCreated: files.length, status: 'success', hrStart })

  await reportTelemetry('success')
  return true
}

type GenerateCommandOptions = {
  input?: string
  configPath?: string
  logLevel: string
  watch: boolean
}

async function checkForUpdate(hooks: AsyncEventEmitter<KubbHooks>): Promise<void> {
  await executeIfOnline(async () => {
    try {
      const res = await fetch(KUBB_NPM_PACKAGE_URL)
      const data = (await res.json()) as { version: string }
      if (data.version && version < data.version) {
        await hooks.emit('kubb:version:new', { currentVersion: version, latestVersion: data.version })
      }
    } catch {
      // Ignore network errors
    }
  })
}

/**
 * Runs the full Kubb generation lifecycle for the given CLI options.
 * Sets up the logger, checks for a newer version, loads configs, and calls `generate` for each config entry.
 */
export async function run({ input, configPath, logLevel: logLevelKey, watch }: GenerateCommandOptions): Promise<void> {
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new AsyncEventEmitterClass<KubbHooks>()

  const makeSink = await setupLogger(hooks, { logLevel })

  await hooks.emit('kubb:lifecycle:start', { version })

  await checkForUpdate(hooks)

  try {
    await hooks.emit('kubb:config:start')

    const { configs, configPath: resolvedConfigPath } = await getConfigs({
      configPath,
      input,
      watch,
      logLevel: logLevelKey as CLIOptions['logLevel'],
    })
    const relativeConfigPath = path.relative(process.cwd(), resolvedConfigPath)

    await hooks.emit('kubb:info', { message: 'Config loaded', info: relativeConfigPath })
    await hooks.emit('kubb:success', { message: 'Config loaded successfully', info: relativeConfigPath })
    await hooks.emit('kubb:config:end', { configs })

    let anyFailed = false
    for (const config of configs) {
      if (isInputPath(config) && watch) {
        await startWatcher(
          [input || config.input.path],
          async (paths) => {
            // Don't removeAll() — that would also drop logger and lifecycle listeners.
            // Plugin and middleware listeners are already disposed by safeBuild's
            // setupResult.dispose() in its finally block, so re-running generate()
            // on the same hooks emitter is safe.
            await generate({ input, config, logLevel, hooks, makeSink })
            clack.log.step(styleText('yellow', `Watching for changes in ${paths.join(' and ')}`))
          },
          { info: (msg) => clack.log.info(msg), error: (msg) => clack.log.error(msg) },
        )
      } else {
        try {
          const succeeded = await generate({ input, config, logLevel, hooks, makeSink })
          if (!succeeded) anyFailed = true
        } catch (configError) {
          await hooks.emit('kubb:error', { error: toError(configError) })
          anyFailed = true
        }
      }
    }

    await hooks.emit('kubb:lifecycle:end')

    if (anyFailed) {
      process.exit(1)
    }
  } catch (error) {
    await hooks.emit('kubb:error', { error: toError(error) })
    process.exit(1)
  }
}
