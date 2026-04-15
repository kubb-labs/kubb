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
  createKubb,
  detectFormatter,
  detectLinter,
  formatters,
  getConfigs,
  isInputPath,
  type KubbHooks,
  linters,
  logLevel as logLevelMap,
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
  hooks: AsyncEventEmitter<KubbHooks>
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
  hooks: AsyncEventEmitter<KubbHooks>
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
  hooks,
  onStart,
  onEnd,
}: RunToolPassOptions) {
  await onStart()

  let resolvedTool = toolValue
  if (resolvedTool === 'auto') {
    const detected = await detect()
    if (!detected) {
      await hooks.emit('kubb:warn', noToolMessage)
    } else {
      resolvedTool = detected
      await hooks.emit('kubb:info', `Auto-detected ${toolLabel}: ${styleText('dim', resolvedTool)}`)
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
          hooks.off('kubb:hook:end', handler)
          if (!success) {
            reject(error ?? new Error(`${toolConfig.errorMessage}`))
            return
          }
          hooks
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
        hooks.on('kubb:hook:end', handler)
      })

      await hooks.emit('kubb:hook:start', {
        id: hookId,
        command: toolConfig.command,
        args: toolConfig.args(outputPath),
      })

      await hookEndPromise
    } catch (caughtError) {
      const err = new Error(toolConfig.errorMessage)
      err.cause = caughtError
      await hooks.emit('kubb:error', err)
      toolError = err
    }
  }

  await onEnd()

  if (toolError) {
    throw toolError
  }
}

async function generate(options: GenerateProps): Promise<void> {
  const { input, hooks, logLevel } = options

  const hrStart = process.hrtime()
  const inputPath = input ?? ('path' in options.config.input ? options.config.input.path : undefined)

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

  const kubb = createKubb({ config, hooks })
  await kubb.setup()

  await hooks.emit('kubb:generation:start', config)

  await hooks.emit('kubb:info', config.name ? `Setup generation ${styleText('bold', config.name)}` : 'Setup generation', inputPath)

  await hooks.emit('kubb:info', config.name ? `Build generation ${styleText('bold', config.name)}` : 'Build generation', inputPath)

  const { files, failedPlugins, pluginTimings, error, driver } = await kubb.safeBuild()

  await hooks.emit('kubb:info', 'Load summary')

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
      await hooks.emit('kubb:error', err)
    }

    await hooks.emit('kubb:generation:end', config, files, kubb.sources)

    await hooks.emit('kubb:generation:summary', config, {
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

  await hooks.emit('kubb:success', 'Generation successfully', inputPath)
  await hooks.emit('kubb:generation:end', config, files, kubb.sources)

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
      hooks,
      onStart: () => hooks.emit('kubb:format:start'),
      onEnd: () => hooks.emit('kubb:format:end'),
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
      hooks,
      onStart: () => hooks.emit('kubb:lint:start'),
      onEnd: () => hooks.emit('kubb:lint:end'),
    })
  }

  if (config.hooks) {
    await hooks.emit('kubb:hooks:start')
    await executeHooks({ configHooks: config.hooks, hooks })

    await hooks.emit('kubb:hooks:end')
  }

  // Only reached when there are no failures (process.exit(1) is called above otherwise)
  await hooks.emit('kubb:generation:summary', config, {
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
  const hooks = new AsyncEventEmitterClass<KubbHooks>()

  await setupLogger(hooks, { logLevel })

  await executeIfOnline(async () => {
    try {
      const res = await fetch(KUBB_NPM_PACKAGE_URL)
      const data = (await res.json()) as { version: string }
      const latestVersion = data.version

      if (latestVersion && version < latestVersion) {
        await hooks.emit('kubb:version:new', version, latestVersion)
      }
    } catch {
      // Ignore network errors for version check
    }
  })

  try {
    const result = await getCosmiConfig('kubb', configPath)
    const configs = await getConfigs(result.config, { input } as CLIOptions)

    await hooks.emit('kubb:config:start')
    await hooks.emit('kubb:info', 'Config loaded', path.relative(process.cwd(), result.filepath))
    await hooks.emit('kubb:success', 'Config loaded successfully', path.relative(process.cwd(), result.filepath))
    await hooks.emit('kubb:config:end', configs)

    await hooks.emit('kubb:lifecycle:start', version)

    for (const config of configs) {
      if (isInputPath(config) && watch) {
        await startWatcher([input || config.input.path], async (paths) => {
          // remove to avoid duplicate listeners after each change
          hooks.removeAll()

          await generate({ input, config, logLevel, hooks })

          clack.log.step(styleText('yellow', `Watching for changes in ${paths.join(' and ')}`))
        })
      } else {
        await generate({ input, config, logLevel, hooks })
      }
    }

    await hooks.emit('kubb:lifecycle:end')
  } catch (error) {
    await hooks.emit('kubb:error', toError(error))
    process.exit(1)
  }
}
