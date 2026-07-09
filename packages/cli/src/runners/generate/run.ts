import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { toError } from '@internals/utils'
import {
  Hookable,
  type CLIOptions,
  cliReporter,
  type Config,
  createKubb,
  type Diagnostic,
  Diagnostics,
  getInputKind,
  type KubbHooks,
  logLevel as logLevelMap,
  type ProblemDiagnostic,
  type ReporterName,
} from '@kubb/core'
import { version } from '../../../package.json'
import { KUBB_NPM_PACKAGE_URL, UPDATE_CHECK_TIMEOUT_MS } from '../../constants.ts'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import setupReporters, { selectReporters } from '../../loggers/utils.ts'
import { executeHooks, getConfigs, isNewerVersion, runHook, startWatcher } from './utils.ts'
import { detectTool, formatters, linters } from '../../tools.ts'

type GenerateProps = {
  input?: string
  config: Config
  hooks: Hookable<KubbHooks>
  logLevel: number
}

type ToolMap = typeof formatters | typeof linters

type RunToolPassOptions = {
  toolValue: string
  detect: () => Promise<string | null>
  toolMap: ToolMap
  toolLabel: string
  successPrefix: string
  noToolMessage: string
  outputPath: string
  logLevel: number
  hooks: Hookable<KubbHooks>
  onStart: () => Promise<void> | void
  onEnd: () => Promise<void> | void
}

/**
 * Runs one formatter or linter pass over the output directory. Returns the failure instead of
 * throwing, so the caller can turn it into a coded diagnostic. Failures never render here:
 * the caller emits them through `Diagnostics.emit`, like every other diagnostic.
 */
async function runToolPass({
  toolValue,
  detect,
  toolMap,
  toolLabel,
  successPrefix,
  noToolMessage,
  outputPath,
  logLevel,
  hooks,
  onStart,
  onEnd,
}: RunToolPassOptions): Promise<Error | null> {
  await onStart()

  let resolvedTool = toolValue
  if (resolvedTool === 'auto') {
    const detected = await detect()
    if (!detected) {
      await hooks.callHook('kubb:warn', { message: noToolMessage })
    } else {
      resolvedTool = detected
      await hooks.callHook('kubb:info', { message: `Auto-detected ${toolLabel}: ${styleText('dim', resolvedTool)}` })
    }
  }

  let toolError: Error | null = null

  // Nothing to lint or format when the output dir was never written. Skip so the tool
  // (e.g. oxlint with --no-ignore) doesn't fail with "No files found to lint".
  if (resolvedTool && resolvedTool !== 'auto' && resolvedTool in toolMap && existsSync(outputPath)) {
    const toolConfig = toolMap[resolvedTool as keyof ToolMap]

    const successMessage = [
      `${successPrefix} with ${styleText('dim', resolvedTool)}`,
      logLevel >= logLevelMap.info ? `on ${styleText('dim', outputPath)}` : undefined,
      'successfully',
    ]
      .filter(Boolean)
      .join(' ')

    try {
      const hookId = randomUUID()
      const hookArgs = toolConfig.args(outputPath)
      const commandWithArgs = [toolConfig.command, ...hookArgs].join(' ')

      await hooks.callHook('kubb:hook:start', { id: hookId, command: toolConfig.command, args: hookArgs })

      const result = await runHook({ id: hookId, command: toolConfig.command, args: hookArgs, commandWithArgs, hooks })

      if (result.success) {
        await hooks.callHook('kubb:success', { message: successMessage })
      } else {
        toolError = result.error ?? new Error(toolConfig.errorMessage)
      }
    } catch (caughtError) {
      toolError = toError(caughtError)
    }
  }

  await onEnd()

  return toolError
}

async function generate(options: GenerateProps): Promise<boolean> {
  const { input, hooks, logLevel } = options

  const hrStart = process.hrtime()
  const inputPath = input ?? (typeof options.config.input === 'string' ? options.config.input : undefined)

  const config: Config = {
    ...options.config,
    input: input ?? options.config.input,
  }

  const kubb = createKubb(config, { hooks })

  await hooks.callHook('kubb:generation:start', { config })
  await hooks.callHook('kubb:info', { message: config.name ? `Setup generation ${styleText('bold', config.name)}` : 'Setup generation', info: inputPath })

  await kubb.setup()

  await hooks.callHook('kubb:info', { message: config.name ? `Build generation ${styleText('bold', config.name)}` : 'Build generation', info: inputPath })

  const { files, diagnostics, driver } = await kubb.safeBuild()

  await hooks.callHook('kubb:info', { message: 'Load summary' })

  const telemetryPlugins = Array.from(driver.plugins.values(), (p) => ({ name: p.name, options: p.options as Record<string, unknown> }))

  const reportTelemetry = (status: 'success' | 'failed') =>
    sendTelemetry(buildTelemetryEvent({ command: 'generate', kubbVersion: version, plugins: telemetryPlugins, hrStart, filesCreated: files.length, status }))

  // Render every problem, not just on failure, so warnings and info surface too.
  // `performance` diagnostics feed the summary, not the log.
  for (const diagnostic of diagnostics) {
    if (!Diagnostics.isProblem(diagnostic)) {
      continue
    }
    if (diagnostic.code === Diagnostics.code.unknown) {
      await hooks.callHook('kubb:error', { error: diagnostic.cause ?? new Error(diagnostic.message) })
    } else {
      await Diagnostics.emit(hooks, diagnostic)
    }
  }

  // Only an error-severity diagnostic fails the run. Warnings and info do not.
  if (Diagnostics.hasError(diagnostics)) {
    await hooks.callHook('kubb:generation:end', { config, storage: kubb.storage, diagnostics, filesCreated: files.length, status: 'failed', hrStart })

    await reportTelemetry('failed')
    return false
  }

  const outputPath = path.resolve(config.root, config.output.path)

  // The build succeeded. The formatter, linter, and post-generate hooks run after it. Their
  // failures used to only emit `kubb:error`, so they never reached the summary, the json report,
  // or the exit code. Collect them as coded diagnostics here.
  const outputDiagnostics: Array<Diagnostic> = []
  const reportOutputFailure = async (code: ProblemDiagnostic['code'], label: string, error: Error) => {
    const diagnostic = outputDiagnostic(code, label, error)
    outputDiagnostics.push(diagnostic)
    await Diagnostics.emit(hooks, diagnostic)
  }

  if (config.output.format) {
    const error = await runToolPass({
      toolValue: config.output.format,
      detect: () => detectTool(['oxfmt', 'biome', 'prettier'] as const),
      toolMap: formatters,
      toolLabel: 'formatter',
      successPrefix: 'Formatting',
      noToolMessage: 'No formatter found (oxfmt, biome, or prettier). Skipping formatting.',
      onStart: () => hooks.callHook('kubb:format:start'),
      onEnd: () => hooks.callHook('kubb:format:end'),
      outputPath,
      logLevel,
      hooks,
    })
    if (error) await reportOutputFailure(Diagnostics.code.formatFailed, 'formatter', error)
  }

  if (config.output.lint) {
    const error = await runToolPass({
      toolValue: config.output.lint,
      detect: () => detectTool(['oxlint', 'biome', 'eslint'] as const),
      toolMap: linters,
      toolLabel: 'linter',
      successPrefix: 'Linting',
      noToolMessage: 'No linter found (oxlint, biome, or eslint). Skipping linting.',
      onStart: () => hooks.callHook('kubb:lint:start'),
      onEnd: () => hooks.callHook('kubb:lint:end'),
      outputPath,
      logLevel,
      hooks,
    })
    if (error) await reportOutputFailure(Diagnostics.code.lintFailed, 'linter', error)
  }

  if (config.hooks) {
    await hooks.callHook('kubb:hooks:start')
    const hookResults = await executeHooks({ configHooks: config.hooks, hooks })
    for (const result of hookResults) {
      if (result.success) continue
      await reportOutputFailure(Diagnostics.code.hookFailed, 'Post-generate hook', result.error ?? new Error('Post-generate hook failed'))
    }
    await hooks.callHook('kubb:hooks:end')
  }

  const finalDiagnostics = [...diagnostics, ...outputDiagnostics]
  const failed = Diagnostics.hasError(outputDiagnostics)

  if (!failed) {
    await hooks.callHook('kubb:success', { message: 'Generation succeeded', info: inputPath })
  }

  await hooks.callHook('kubb:generation:end', {
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

async function checkForUpdate(hooks: Hookable<KubbHooks>): Promise<void> {
  try {
    const res = await fetch(KUBB_NPM_PACKAGE_URL, { signal: AbortSignal.timeout(UPDATE_CHECK_TIMEOUT_MS) })
    const data = (await res.json()) as { version: string }
    if (data.version && isNewerVersion(version, data.version)) {
      await Diagnostics.emit(hooks, Diagnostics.update({ currentVersion: version, latestVersion: data.version }))
    }
  } catch {
    // Ignore network errors
  }
}

/**
 * Runs the full Kubb generation lifecycle for the given CLI options.
 * Loads configs, sets up the reporters (CLI `--reporter` picks which of `config.reporters` to trigger),
 * checks for a newer version, and calls `generate` for each config entry.
 */
export async function run({ input, configPath, logLevel: logLevelKey, watch, reporters: cliReporters }: GenerateCommandOptions): Promise<void> {
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new Hookable<KubbHooks>()

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
    await setupReporters(hooks, { logLevel, reporters: [cliReporter] })
    await hooks.callHook('kubb:error', { error: toError(error) })
    process.exit(1)
  }

  // CLI `--reporter` selects which reporters to trigger by name, defaulting to `cli`. The config
  // always carries the available reporters (defineConfig registers the built-ins).
  const requestedNames: Array<ReporterName> = cliReporters?.length ? cliReporters : ['cli']
  const available = configs[0]?.reporters ?? []
  const reporters = selectReporters(available, requestedNames)
  await setupReporters(hooks, { logLevel, reporters })

  await hooks.callHook('kubb:lifecycle:start', { version })

  await checkForUpdate(hooks)

  try {
    const relativeConfigPath = path.relative(process.cwd(), resolvedConfigPath)

    await hooks.callHook('kubb:info', { message: 'Config loaded', info: relativeConfigPath })
    await hooks.callHook('kubb:success', { message: 'Config loaded successfully', info: relativeConfigPath })

    let anyFailed = false
    for (const config of configs) {
      const effectiveInput = input ?? config.input
      const watchPath = typeof effectiveInput === 'string' && getInputKind(effectiveInput) === 'file' ? effectiveInput : undefined
      if (watchPath && watch) {
        const watchedPaths = [watchPath]
        // Don't removeAll() between builds, that would also drop logger and lifecycle
        // listeners. Plugin listeners are already disposed by safeBuild's dispose()
        // in its finally block, so re-running generate() on the same hooks emitter is safe.
        const build = async (paths: Array<string>) => {
          await generate({ input, config, logLevel, hooks })
          clack.log.step(styleText('yellow', `Watching for changes in ${paths.join(' and ')}`))
        }

        // The watcher ignores chokidar's startup events, so run the first build here. A failing
        // first build keeps watching, since the user can fix the input and save.
        try {
          await build(watchedPaths)
        } catch (buildError) {
          await hooks.callHook('kubb:error', { error: toError(buildError) })
        }

        await startWatcher(watchedPaths, build, { info: (msg) => clack.log.info(msg), error: (msg) => clack.log.error(msg) })
      } else {
        try {
          const succeeded = await generate({ input, config, logLevel, hooks })
          if (!succeeded) anyFailed = true
        } catch (configError) {
          await hooks.callHook('kubb:error', { error: toError(configError) })
          anyFailed = true
        }
      }
    }

    await hooks.callHook('kubb:lifecycle:end')

    if (anyFailed) {
      process.exit(1)
    }
  } catch (error) {
    await hooks.callHook('kubb:error', { error: toError(error) })
    process.exit(1)
  }
}
