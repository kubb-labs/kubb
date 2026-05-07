import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { AsyncEventEmitter } from '@internals/utils'
import { AsyncEventEmitter as AsyncEventEmitterClass, detectFormatter, detectLinter, executeIfOnline, formatters, linters, toError } from '@internals/utils'
import type { Adapter, CLIOptions, Config, KubbHooks } from '@kubb/core'
import { createKubb, isInputPath, logLevel as logLevelMap } from '@kubb/core'
import { version } from '../../package.json'
import { KUBB_NPM_PACKAGE_URL } from '../constants.ts'
import { setupLogger } from '../loggers/utils.ts'
import { executeHooks } from '../utils/executeHooks.ts'
import { getConfigs } from '../utils/getConfig.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'
import { startWatcher } from '../utils/watcher.ts'

export type GenerateAdapter = 'oas'

type GenerateProps = {
  input?: string
  config: Config
  hooks: AsyncEventEmitter<KubbHooks>
  logLevel: number
}

type ToolMap = typeof formatters | typeof linters
type GenerateAdapterModule = typeof import('@kubb/adapter-oas')
type GenerateCommandDependencies = {
  loadGenerateAdapter: (adapter: GenerateAdapter) => Promise<Adapter>
}

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
  const { input, hooks, logLevel } = options

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
        plugins: Array.from(driver.plugins.values(), (p) => ({
          name: p.name,
          options: p.options as Record<string, unknown>,
        })),
        hrStart,
        filesCreated: files.length,
        status: 'failed',
      }),
    )

    process.exit(1)
  }

  await hooks.emit('kubb:success', { message: 'Generation successfully', info: inputPath })
  await hooks.emit('kubb:generation:end', { config, files, sources: kubb.sources })

  const outputPath = path.resolve(config.root, config.output.path)

  if (config.output.format) {
    await runToolPass({
      toolValue: config.output.format,
      detect: detectFormatter,
      toolMap: formatters,
      toolLabel: 'formatter',
      successPrefix: 'Formatting',
      noToolMessage: 'No formatter found (oxfmt, biome, or prettier). Skipping formatting.',
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
      noToolMessage: 'No linter found (oxlint, biome, or eslint). Skipping linting.',
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
  await hooks.emit('kubb:generation:summary', {
    config,
    failedPlugins,
    filesCreated: files.length,
    status: 'success',
    hrStart,
    pluginTimings,
  })

  const telemetryEvent = buildTelemetryEvent({
    command: 'generate',
    kubbVersion: version,
    plugins: Array.from(driver.plugins.values(), (p) => ({
      name: p.name,
      options: p.options as Record<string, unknown>,
    })),
    hrStart,
    filesCreated: files.length,
    status: 'success',
  })

  await sendTelemetry(telemetryEvent)
}

type GenerateCommandOptions = {
  input?: string
  configPath?: string
  adapter?: GenerateAdapter
  logLevel: string
  watch: boolean
}

export async function loadGenerateAdapter(adapter: GenerateAdapter): Promise<Adapter> {
  switch (adapter) {
    case 'oas':
      try {
        const { adapterOas } = (await import('@kubb/adapter-oas')) as GenerateAdapterModule

        return adapterOas()
      } catch (error) {
        if (error instanceof Error && /@kubb\/adapter-oas/.test(error.message)) {
          throw new Error(
            [
              'The @kubb/adapter-oas package is not installed.',
              'Install it to use `kubb generate --adapter oas`:',
              '  npm install @kubb/adapter-oas',
              '  # or',
              '  pnpm install @kubb/adapter-oas',
            ].join('\n'),
          )
        }

        throw error
      }
  }
}

export async function resolveGenerateConfig(
  config: Config,
  adapter: GenerateAdapter | undefined,
  dependencies: GenerateCommandDependencies = { loadGenerateAdapter },
): Promise<Config> {
  if (!adapter) {
    return config
  }

  return {
    ...config,
    adapter: await dependencies.loadGenerateAdapter(adapter),
  }
}

export async function runGenerateCommand(
  { input, configPath, adapter, logLevel: logLevelKey, watch }: GenerateCommandOptions,
  dependencies: GenerateCommandDependencies = { loadGenerateAdapter },
): Promise<void> {
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new AsyncEventEmitterClass<KubbHooks>()

  await setupLogger(hooks, { logLevel })

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
    const result = await getCosmiConfig('kubb', configPath)
    const configs = await getConfigs(result.config, { adapter, config: configPath, input, logLevel: logLevelKey, watch } as CLIOptions)

    await hooks.emit('kubb:config:start')
    await hooks.emit('kubb:info', { message: 'Config loaded', info: path.relative(process.cwd(), result.filepath) })
    await hooks.emit('kubb:success', { message: 'Config loaded successfully', info: path.relative(process.cwd(), result.filepath) })
    await hooks.emit('kubb:config:end', { configs })

    await hooks.emit('kubb:lifecycle:start', { version })

    for (const config of configs) {
      const resolvedConfig = await resolveGenerateConfig(config, adapter, dependencies)

      if (isInputPath(resolvedConfig) && watch) {
        await startWatcher([input || resolvedConfig.input.path], async (paths) => {
          // remove to avoid duplicate listeners after each change
          hooks.removeAll()

          await generate({ input, config: resolvedConfig, logLevel, hooks })

          clack.log.step(styleText('yellow', `Watching for changes in ${paths.join(' and ')}`))
        })
      } else {
        await generate({ input, config: resolvedConfig, logLevel, hooks })
      }
    }

    await hooks.emit('kubb:lifecycle:end')
  } catch (error) {
    await hooks.emit('kubb:error', { error: toError(error) })
    process.exit(1)
  }
}
