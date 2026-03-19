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
  detect: () => Promise<string | undefined>
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
      await events.emit('warn', noToolMessage)
    } else {
      resolvedTool = detected
      await events.emit('info', `Auto-detected ${toolLabel}: ${styleText('dim', resolvedTool)}`)
    }
  }

  if (resolvedTool && resolvedTool !== 'auto' && resolvedTool in toolMap) {
    const toolConfig = toolMap[resolvedTool as keyof ToolMap]

    try {
      const hookId = createHash('sha256').update([configName, resolvedTool].filter(Boolean).join('-')).digest('hex')

      // Wire up the hook:end listener BEFORE emitting hook:start to avoid the race condition
      // where hook:end fires synchronously inside emit('hook:start') before the listener is registered.
      const hookEndPromise = new Promise<void>((resolve, reject) => {
        const handler = ({ id, success, error }: { id?: string; command: string; args?: readonly string[]; success: boolean; error: Error | null }) => {
          if (id !== hookId) return
          events.off('hook:end', handler)
          if (!success) {
            reject(error ?? new Error(`${toolConfig.errorMessage}`))
            return
          }
          events
            .emit(
              'success',
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
        events.on('hook:end', handler)
      })

      await events.emit('hook:start', {
        id: hookId,
        command: toolConfig.command,
        args: toolConfig.args(outputPath),
      })

      await hookEndPromise
    } catch (caughtError) {
      const err = new Error(toolConfig.errorMessage)
      err.cause = caughtError
      await events.emit('error', err)
    }
  }

  await onEnd()
}

async function generate({ input, config: userConfig, events, logLevel }: GenerateProps): Promise<void> {
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)
  const hrStart = process.hrtime()

  const config: Config = {
    ...userConfig,
    root: userConfig.root || process.cwd(),
    input: inputPath
      ? {
          ...userConfig.input,
          path: inputPath,
        }
      : userConfig.input,
    output: {
      write: true,
      barrelType: 'named',
      extension: {
        '.ts': '.ts',
      },
      format: 'prettier',
      ...userConfig.output,
    },
  }

  await events.emit('generation:start', config)

  await events.emit('info', config.name ? `Setup generation ${styleText('bold', config.name)}` : 'Setup generation', inputPath)

  const { sources, fabric, driver } = await setup({
    config,
    events,
  })

  await events.emit('info', config.name ? `Build generation ${styleText('bold', config.name)}` : 'Build generation', inputPath)

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config,
      events,
    },
    { driver, fabric, events, sources },
  )

  await events.emit('info', 'Load summary')

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
      await events.emit('error', err)
    }

    await events.emit('generation:end', config, files, sources)

    await events.emit('generation:summary', config, {
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
        plugins: driver.plugins.map((p) => ({ name: p.name, options: p.options as Record<string, unknown> })),
        hrStart,
        filesCreated: files.length,
        status: 'failed',
      }),
    )

    process.exit(1)
  }

  await events.emit('success', 'Generation successfully', inputPath)
  await events.emit('generation:end', config, files, sources)

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
      onStart: () => events.emit('format:start'),
      onEnd: () => events.emit('format:end'),
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
      onStart: () => events.emit('lint:start'),
      onEnd: () => events.emit('lint:end'),
    })
  }

  if (config.hooks) {
    await events.emit('hooks:start')
    await executeHooks({ hooks: config.hooks, events })

    await events.emit('hooks:end')
  }

  // Only reached when there are no failures (process.exit(1) is called above otherwise)
  await events.emit('generation:summary', config, {
    failedPlugins,
    filesCreated: files.length,
    status: 'success',
    hrStart,
    pluginTimings,
  })

  const telemetryEvent = buildTelemetryEvent({
    command: 'generate',
    kubbVersion: version,
    plugins: driver.plugins.map((p) => ({ name: p.name, options: p.options as Record<string, unknown> })),
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
        await events.emit('version:new', version, latestVersion)
      }
    } catch {
      // Ignore network errors for version check
    }
  })

  try {
    const result = await getCosmiConfig('kubb', configPath)
    const configs = await getConfigs(result.config, { input } as CLIOptions)

    await events.emit('config:start')
    await events.emit('info', 'Config loaded', path.relative(process.cwd(), result.filepath))
    await events.emit('success', 'Config loaded successfully', path.relative(process.cwd(), result.filepath))
    await events.emit('config:end', configs)

    await events.emit('lifecycle:start', version)

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

    await events.emit('lifecycle:end')
  } catch (error) {
    await events.emit('error', toError(error))
    process.exit(1)
  }
}
