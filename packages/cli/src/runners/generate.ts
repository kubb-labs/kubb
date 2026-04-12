import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { AsyncEventEmitter } from '@internals/utils'
import { AsyncEventEmitter as AsyncEventEmitterClass, executeIfOnline, toError } from '@internals/utils'
import {
  type CLIOptions,
  type Config,
  detectFormatter,
  detectLinter,
  formatters,
  getConfigs,
  isInputPath,
  type KubbEvents,
  linters,
  logLevel as logLevelMap,
  safeBuild,
  setup,
  type UserConfig,
} from '@kubb/core'
import { version } from '../../package.json'
import { KUBB_NPM_PACKAGE_URL } from '../constants.ts'
import { setupLogger } from '../loggers/utils.ts'
import { executeHooks } from '../utils/executeHooks.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'
import { startWatcher } from '../utils/watcher.ts'

type GenerateProps = {
  input?: string
  config: Config
  events: AsyncEventEmitter<KubbEvents>
  logLevel: number
}

type ToolMap = typeof formatters | typeof linters

type RunToolPassOptions = {
  toolValue: string
  detect: () => Promise<string | null>
  toolMap: ToolMap
  /** Short noun used in "Auto-detected <toolLabel>:" message, e.g. "formatter" or "linter". */
  toolLabel: string
  /** Verb prefix for the success message, e.g. "Formatting" or "Linting". */
  successPrefix: string
  noToolMessage: string
  configName: string | undefined
  outputPath: string
  logLevel: number
  events: AsyncEventEmitter<KubbEvents>
  onStart: () => Promise<void>
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
  events,
  onStart,
  onEnd,
}: RunToolPassOptions) {
  await onStart()

  let resolvedTool = toolValue
  if (resolvedTool === 'auto') {
    const detected = await detect()
    if (!detected) {
      await events.emit('kubb:warn', noToolMessage)
    } else {
      resolvedTool = detected
      await events.emit('kubb:info', `Auto-detected ${toolLabel}: ${styleText('dim', resolvedTool)}`)
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
        const handler = ({ id, success, error }: { id?: string; command: string; args?: readonly string[]; success: boolean; error: Error | null }) => {
          if (id !== hookId) return
          events.off('kubb:hook:end', handler)
          if (!success) {
            reject(error ?? new Error(`${toolConfig.errorMessage}`))
            return
          }
          events
            .emit(
              'kubb:success',
              [
                `${successPrefix} with ${styleText('dim', resolvedTool)}`,
                logLevel >= logLevelMap.info ? `on ${styleText('dim', outputPath)}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
            .then(resolve)
            .catch(reject)
        }
        events.on('kubb:hook:end', handler)
      })

      await events.emit('kubb:hook:start', {
        id: hookId,
        command: toolConfig.command,
        args: toolConfig.args(outputPath),
      })

      await hookEndPromise
    } catch (caughtError) {
      const err = new Error(toolConfig.errorMessage)
      err.cause = caughtError
      await events.emit('kubb:error', err)
      toolError = err
    }
  }

  await onEnd()

  if (toolError) {
    throw toolError
  }
}

async function generate(options: GenerateProps): Promise<void> {
  const { input, events, logLevel } = options

  const hrStart = process.hrtime()
  const inputPath = input ?? ('path' in options.config.input ? options.config.input.path : undefined)

  const userConfig: UserConfig = {
    ...options.config,
    input: inputPath
      ? {
          ...options.config.input,
          path: inputPath,
        }
      : options.config.input,
    ...options.config.output,
  } satisfies UserConfig

  const setupResult = await setup({
    config: userConfig,
    events,
  })

  const { sources, config, driver } = setupResult

  await events.emit('kubb:generation:start', config)

  await events.emit('kubb:info', config.name ? `Setup generation ${styleText('bold', config.name)}` : 'Setup generation', inputPath)

  await events.emit('kubb:info', config.name ? `Build generation ${styleText('bold', config.name)}` : 'Build generation', inputPath)

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config,
      events,
    },
    setupResult,
  )

  await events.emit('kubb:info', 'Load summary')

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
      await events.emit('kubb:error', err)
    }

    await events.emit('kubb:generation:end', config, files, sources)

    await events.emit('kubb:generation:summary', config, {
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
        plugins: Array.from(driver.plugins.values(), (p) => ({ name: p.name, options: p.options as Record<string, unknown> })),
        hrStart,
        filesCreated: files.length,
        status: 'failed',
      }),
    )

    process.exit(1)
  }

  await events.emit('kubb:success', 'Generation successfully', inputPath)
  await events.emit('kubb:generation:end', config, files, sources)

  const outputPath = path.resolve(config.root, config.output.path)

  if (config.output.format) {
    await runToolPass({
      toolValue: config.output.format,
      detect: detectFormatter,
      toolMap: formatters,
      toolLabel: 'formatter',
      successPrefix: 'Formatting',
      noToolMessage: 'No formatter found (biome, prettier, or oxfmt). Skipping formatting.',
      configName: config.name,
      outputPath,
      logLevel,
      events,
      onStart: () => events.emit('kubb:format:start'),
      onEnd: () => events.emit('kubb:format:end'),
    })
  }

  if (config.output.lint) {
    await runToolPass({
      toolValue: config.output.lint,
      detect: detectLinter,
      toolMap: linters,
      toolLabel: 'linter',
      successPrefix: 'Linting',
      noToolMessage: 'No linter found (biome, oxlint, or eslint). Skipping linting.',
      configName: config.name,
      outputPath,
      logLevel,
      events,
      onStart: () => events.emit('kubb:lint:start'),
      onEnd: () => events.emit('kubb:lint:end'),
    })
  }

  if (config.hooks) {
    await events.emit('kubb:hooks:start')
    await executeHooks({ hooks: config.hooks, events })

    await events.emit('kubb:hooks:end')
  }

  // Only reached when there are no failures (process.exit(1) is called above otherwise)
  await events.emit('kubb:generation:summary', config, {
    failedPlugins,
    filesCreated: files.length,
    status: 'success',
    hrStart,
    pluginTimings,
  })

  const telemetryEvent = buildTelemetryEvent({
    command: 'generate',
    kubbVersion: version,
    plugins: Array.from(driver.plugins.values(), (p) => ({ name: p.name, options: p.options as Record<string, unknown> })),
    hrStart,
    filesCreated: files.length,
    status: 'success',
  })

  await sendTelemetry(telemetryEvent)
}

type GenerateCommandOptions = {
  input?: string
  configPath?: string
  logLevel: string
  watch: boolean
}

export async function runGenerateCommand({ input, configPath, logLevel: logLevelKey, watch }: GenerateCommandOptions): Promise<void> {
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const events = new AsyncEventEmitterClass<KubbEvents>()

  await setupLogger(events, { logLevel })

  await executeIfOnline(async () => {
    try {
      const res = await fetch(KUBB_NPM_PACKAGE_URL)
      const data = (await res.json()) as { version: string }
      const latestVersion = data.version

      if (latestVersion && version < latestVersion) {
        await events.emit('kubb:version:new', version, latestVersion)
      }
    } catch {
      // Ignore network errors for version check
    }
  })

  try {
    const result = await getCosmiConfig('kubb', configPath)
    const configs = await getConfigs(result.config, { input } as CLIOptions)

    await events.emit('kubb:config:start')
    await events.emit('kubb:info', 'Config loaded', path.relative(process.cwd(), result.filepath))
    await events.emit('kubb:success', 'Config loaded successfully', path.relative(process.cwd(), result.filepath))
    await events.emit('kubb:config:end', configs)

    await events.emit('kubb:lifecycle:start', version)

    for (const config of configs) {
      if (isInputPath(config) && watch) {
        await startWatcher([input || config.input.path], async (paths) => {
          // remove to avoid duplicate listeners after each change
          events.removeAll()

          await generate({ input, config, logLevel, events })

          clack.log.step(styleText('yellow', `Watching for changes in ${paths.join(' and ')}`))
        })
      } else {
        await generate({ input, config, logLevel, events })
      }
    }

    await events.emit('kubb:lifecycle:end')
  } catch (error) {
    await events.emit('kubb:error', toError(error))
    process.exit(1)
  }
}
