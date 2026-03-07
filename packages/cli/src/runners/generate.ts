import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { type Config, type KubbEvents, LogLevel, safeBuild, setup } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { detectFormatter, detectLinter, formatters, linters } from '@kubb/core/utils'
import { version } from '../../package.json'
import { executeHooks } from '../utils/executeHooks.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

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

async function runToolPass({ toolValue, detect, toolMap, toolLabel, successPrefix, noToolMessage, configName, outputPath, logLevel, events, onStart, onEnd }: RunToolPassOptions) {
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
      await events.emit('hook:start', {
        id: hookId,
        command: toolConfig.command,
        args: toolConfig.args(outputPath),
      })

      await events.onOnce('hook:end', async ({ success, error }) => {
        if (!success) throw error

        await events.emit(
          'success',
          [`${successPrefix} with ${styleText('dim', resolvedTool)}`, logLevel >= LogLevel.info ? `on ${styleText('dim', outputPath)}` : undefined, 'successfully']
            .filter(Boolean)
            .join(' '),
        )
      })
    } catch (caughtError) {
      const err = new Error(toolConfig.errorMessage)
      err.cause = caughtError
      await events.emit('error', err)
    }
  }

  await onEnd()
}

export async function generate({ input, config: userConfig, events, logLevel }: GenerateProps): Promise<void> {
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

  const { sources, fabric, pluginManager } = await setup({
    config,
    events,
  })

  await events.emit('info', config.name ? `Build generation ${styleText('bold', config.name)}` : 'Build generation', inputPath)

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config,
      events,
    },
    { pluginManager, fabric, events, sources },
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
      pluginTimings: logLevel >= LogLevel.verbose ? pluginTimings : undefined,
    })

    await sendTelemetry(
      buildTelemetryEvent({
        command: 'generate',
        kubbVersion: version,
        plugins: pluginManager.plugins.map((p) => ({ name: p.name, options: p.options as Record<string, unknown> })),
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
    plugins: pluginManager.plugins.map((p) => ({ name: p.name, options: p.options as Record<string, unknown> })),
    hrStart,
    filesCreated: files.length,
    status: 'success',
  })

  await sendTelemetry(telemetryEvent)
}
