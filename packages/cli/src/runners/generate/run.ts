import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { AsyncEventEmitter } from '@internals/utils'
import { AsyncEventEmitter as AsyncEventEmitterClass, detectFormatter, detectLinter, executeIfOnline, formatters, linters, toError } from '@internals/utils'
import {
  type CLIOptions,
  type Config,
  createKubb,
  type Diagnostic,
  diagnosticCode,
  Diagnostics,
  isInputPath,
  isProblemDiagnostic,
  type KubbHooks,
  logLevel as logLevelMap,
  narrowDiagnostic,
  type ProblemDiagnostic,
  type ReporterName,
} from '@kubb/core'
import { version } from '../../../package.json'
import { KUBB_NPM_PACKAGE_URL } from '../../constants.ts'
import { setupReporters, type HookSinkFactory } from '../../loggers/utils.ts'
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
      // Don't render here. The caller turns this into a coded diagnostic and emits it through
      // `Diagnostics.emit`, so format/lint/hook failures render like every other diagnostic.
      toolError = toError(caughtError)
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
  // `performance` diagnostics feed the summary, not the log.
  for (const diagnostic of diagnostics) {
    if (!isProblemDiagnostic(diagnostic)) {
      continue
    }
    const unknown = narrowDiagnostic(diagnostic, diagnosticCode.unknown)
    if (unknown) {
      await hooks.emit('kubb:error', { error: unknown.cause ?? new Error(unknown.message) })
    } else {
      await Diagnostics.emit(hooks, diagnostic)
    }
  }

  // Only an error-severity diagnostic fails the run. Warnings and info do not.
  if (Diagnostics.hasError(diagnostics)) {
    await hooks.emit('kubb:generation:end', { config, storage: kubb.storage, diagnostics, filesCreated: files.length, status: 'failed', hrStart })

    await reportTelemetry('failed')
    return false
  }

  const outputPath = path.resolve(config.root, config.output.path)

  // The build succeeded. The formatter, linter, and post-generate hooks run after it. Their
  // failures used to only emit `kubb:error`, so they never reached the summary, the json report,
  // or the exit code. Collect them as coded diagnostics here.
  const outputDiagnostics: Array<Diagnostic> = []

  const toolPasses = [
    config.output.format && {
      code: diagnosticCode.formatFailed,
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
      code: diagnosticCode.lintFailed,
      toolValue: config.output.lint,
      detect: detectLinter,
      toolMap: linters,
      toolLabel: 'linter',
      successPrefix: 'Linting',
      noToolMessage: 'No linter found (oxlint, biome, or eslint). Skipping linting.',
      onStart: () => hooks.emit('kubb:lint:start'),
      onEnd: () => hooks.emit('kubb:lint:end'),
    },
  ].filter(Boolean) as Array<{ code: ProblemDiagnostic['code'] } & Omit<RunToolPassOptions, 'configName' | 'outputPath' | 'logLevel' | 'hooks'>>

  for (const { code, ...pass } of toolPasses) {
    try {
      await runToolPass({ ...pass, configName: config.name, outputPath, logLevel, hooks, makeSink })
    } catch (caughtError) {
      const diagnostic = outputDiagnostic(code, pass.toolLabel, caughtError)
      outputDiagnostics.push(diagnostic)
      await Diagnostics.emit(hooks, diagnostic)
    }
  }

  if (config.hooks) {
    await hooks.emit('kubb:hooks:start')
    // `runHook` reports a failed `done` hook via `kubb:hook:end` rather than throwing, so listen
    // for it across this pass and collect each failure.
    const hookFailures: Array<Error> = []
    const onHookEnd = (ctx: { success: boolean; error: Error | null }) => {
      if (!ctx.success) hookFailures.push(ctx.error ?? new Error('Post-generate hook failed'))
    }
    hooks.on('kubb:hook:end', onHookEnd)
    try {
      await executeHooks({ configHooks: config.hooks, hooks, makeSink })
    } finally {
      hooks.off('kubb:hook:end', onHookEnd)
    }
    for (const error of hookFailures) {
      const diagnostic = outputDiagnostic(diagnosticCode.hookFailed, 'Post-generate hook', error)
      outputDiagnostics.push(diagnostic)
      await Diagnostics.emit(hooks, diagnostic)
    }
    await hooks.emit('kubb:hooks:end')
  }

  const finalDiagnostics = [...diagnostics, ...outputDiagnostics]
  const failed = Diagnostics.hasError(outputDiagnostics)

  if (!failed) {
    await hooks.emit('kubb:success', { message: 'Generation succeeded', info: inputPath })
  }

  await hooks.emit('kubb:generation:end', {
    config,
    storage: kubb.storage,
    diagnostics: finalDiagnostics,
    filesCreated: files.length,
    status: failed ? 'failed' : 'success',
    hrStart,
  })

  await reportTelemetry(failed ? 'failed' : 'success')
  return !failed
}

/**
 * Builds a coded diagnostic for an output-phase failure (formatter, linter, or `done` hook).
 */
function outputDiagnostic(code: ProblemDiagnostic['code'], label: string, caughtError: unknown): ProblemDiagnostic {
  const error = toError(caughtError)
  return {
    code,
    severity: 'error',
    message: `${label} failed: ${error.message}`,
    help: 'Check that the tool is installed and that the command and its config are correct.',
    location: { kind: 'config' },
    cause: error,
  }
}

type GenerateCommandOptions = {
  input?: string
  configPath?: string
  logLevel: string
  watch: boolean
  reporters?: Array<ReporterName>
}

async function checkForUpdate(hooks: AsyncEventEmitter<KubbHooks>): Promise<void> {
  await executeIfOnline(async () => {
    try {
      const res = await fetch(KUBB_NPM_PACKAGE_URL)
      const data = (await res.json()) as { version: string }
      if (data.version && version < data.version) {
        await Diagnostics.emit(hooks, Diagnostics.update({ currentVersion: version, latestVersion: data.version }))
      }
    } catch {
      // Ignore network errors
    }
  })
}

/**
 * Runs the full Kubb generation lifecycle for the given CLI options.
 * Loads configs, sets up the selected reporters (CLI `--reporter` overrides `config.reporters`),
 * checks for a newer version, and calls `generate` for each config entry.
 */
export async function run({ input, configPath, logLevel: logLevelKey, watch, reporters: cliReporters }: GenerateCommandOptions): Promise<void> {
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new AsyncEventEmitterClass<KubbHooks>()

  // Load the config first so `config.reporters` can pick the reporters. A failure here has no
  // reporter installed yet, so fall back to the default `cli` reporter to surface it.
  let configs: Array<Config>
  let resolvedConfigPath: string
  try {
    const loaded = await getConfigs({
      configPath,
      input,
      watch,
      logLevel: logLevelKey as CLIOptions['logLevel'],
    })
    configs = loaded.configs
    resolvedConfigPath = loaded.configPath
  } catch (error) {
    await setupReporters(hooks, { logLevel, reporters: ['cli'] })
    await hooks.emit('kubb:error', { error: toError(error) })
    process.exit(1)
  }

  // CLI `--reporter` wins. Otherwise the first config's `reporters`. Otherwise the default.
  const reporters: Array<ReporterName> = cliReporters?.length ? cliReporters : (configs[0]?.reporters ?? ['cli'])
  const makeSink = await setupReporters(hooks, { logLevel, reporters })

  await hooks.emit('kubb:lifecycle:start', { version })

  await checkForUpdate(hooks)

  try {
    const relativeConfigPath = path.relative(process.cwd(), resolvedConfigPath)

    await hooks.emit('kubb:config:start')
    await hooks.emit('kubb:info', { message: 'Config loaded', info: relativeConfigPath })
    await hooks.emit('kubb:success', { message: 'Config loaded successfully', info: relativeConfigPath })
    await hooks.emit('kubb:config:end', { configs })

    let anyFailed = false
    for (const config of configs) {
      if (isInputPath(config) && watch) {
        await startWatcher(
          [input || config.input.path],
          async (paths) => {
            // Don't removeAll(), that would also drop logger and lifecycle listeners.
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
