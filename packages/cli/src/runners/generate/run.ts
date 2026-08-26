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
import type { DevtoolsServer } from '@kubb/devtools'
import { version } from '../../../package.json'
import { KUBB_NPM_PACKAGE_URL, UPDATE_CHECK_TIMEOUT_MS } from '../../constants.ts'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import setupReporters, { selectReporters } from '../../loggers/utils.ts'
import { getConfigs, isNewerVersion, runHook, runPostGenerate, startWatcher } from './utils.ts'
import { detectTool, formatters, linters } from '../../tools.ts'

type GenerateProps = {
  input?: string
  config: Config
  hooks: Hookable<KubbHooks>
  logLevel: number
  /**
   * Running devtools server, when `KUBB_DEVTOOLS` is set. Its store needs the parsed AST,
   * which no lifecycle hook carries.
   */
  devtools?: DevtoolsServer
}

type ToolMap = typeof formatters | typeof linters

/**
 * Static description of one output tool: its command table, the label and messages the pass logs,
 * and how to auto-detect it. Format and lint differ only in these values.
 */
type Tool = {
  label: string
  map: ToolMap
  detect: () => Promise<string | null>
  successPrefix: string
  noToolMessage: string
}

type RunToolPassOptions = {
  toolValue: string
  tool: Tool
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
async function runToolPass({ toolValue, tool, outputPath, logLevel, hooks, onStart, onEnd }: RunToolPassOptions): Promise<Error | null> {
  await onStart()

  let resolvedTool = toolValue
  if (resolvedTool === 'auto') {
    const detected = await tool.detect()
    if (!detected) {
      await hooks.callHook('kubb:warn', { message: tool.noToolMessage })
    } else {
      resolvedTool = detected
      await hooks.callHook('kubb:info', { message: `Auto-detected ${tool.label}: ${styleText('dim', resolvedTool)}` })
    }
  }

  let toolError: Error | null = null

  // Nothing to lint or format when the output dir was never written. Skip so the tool
  // (e.g. oxlint with --no-ignore) doesn't fail with "No files found to lint".
  if (resolvedTool && resolvedTool !== 'auto' && resolvedTool in tool.map && existsSync(outputPath)) {
    const toolConfig = tool.map[resolvedTool as keyof ToolMap]

    const successMessage = [
      `${tool.successPrefix} with ${styleText('dim', resolvedTool)}`,
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
  const { input, hooks, logLevel, devtools } = options

  const hrStart = process.hrtime()
  const inputPath = input ?? (typeof options.config.input === 'string' ? options.config.input : undefined)

  const config: Config = {
    ...options.config,
    input: input ?? options.config.input,
  }

  // The formatter, linter, and post-generate commands run after a successful build. Collect their
  // failures as coded diagnostics so they reach the summary, the json report, and the exit code.
  const processOutput = async ({ config: resolvedConfig, outputPath }: { config: Config; outputPath: string }): Promise<Array<Diagnostic>> => {
    const outputDiagnostics: Array<Diagnostic> = []
    const reportOutputFailure = async (code: ProblemDiagnostic['code'], label: string, error: Error) => {
      const diagnostic = outputDiagnostic(code, label, error)
      outputDiagnostics.push(diagnostic)
      await Diagnostics.emit(hooks, diagnostic)
    }

    // Format and lint are the same pass over the output directory, differing only in the tool
    // table and the hooks they announce themselves with, so run them from one descriptor list.
    const toolPasses = [
      {
        value: resolvedConfig.output.format,
        code: Diagnostics.code.formatFailed,
        tool: {
          label: 'formatter',
          map: formatters,
          detect: () => detectTool(['oxfmt', 'biome', 'prettier'] as const),
          successPrefix: 'Formatting',
          noToolMessage: 'No formatter found (oxfmt, biome, or prettier). Skipping formatting.',
        },
        onStart: () => hooks.callHook('kubb:format:start'),
        onEnd: () => hooks.callHook('kubb:format:end'),
      },
      {
        value: resolvedConfig.output.lint,
        code: Diagnostics.code.lintFailed,
        tool: {
          label: 'linter',
          map: linters,
          detect: () => detectTool(['oxlint', 'biome', 'eslint'] as const),
          successPrefix: 'Linting',
          noToolMessage: 'No linter found (oxlint, biome, or eslint). Skipping linting.',
        },
        onStart: () => hooks.callHook('kubb:lint:start'),
        onEnd: () => hooks.callHook('kubb:lint:end'),
      },
    ]

    for (const pass of toolPasses) {
      if (!pass.value) continue
      const error = await runToolPass({
        toolValue: pass.value,
        tool: pass.tool,
        onStart: pass.onStart,
        onEnd: pass.onEnd,
        outputPath,
        logLevel,
        hooks,
      })
      if (error) await reportOutputFailure(pass.code, pass.tool.label, error)
    }

    if (resolvedConfig.output.postGenerate?.length) {
      await hooks.callHook('kubb:hooks:start')
      const hookResults = await runPostGenerate({ commands: resolvedConfig.output.postGenerate, hooks })
      for (const hookResult of hookResults) {
        if (hookResult.success) continue
        await reportOutputFailure(Diagnostics.code.postGenerateFailed, 'Post-generate command', hookResult.error ?? new Error('Post-generate command failed'))
      }
      await hooks.callHook('kubb:hooks:end')
    }

    return outputDiagnostics
  }

  hooks.hook('kubb:generation:end', ({ status }) => {
    if (status === 'success') return hooks.callHook('kubb:success', { message: 'Generation succeeded', info: inputPath })
  })

  const kubb = createKubb(config, { hooks })

  // `driver.dispose()` nulls `inputNode` at the end of every build, so the devtools store
  // gets its copy while the build is still running. Unhooked straight after, since each
  // config builds through its own `kubb` instance on the shared emitter.
  const unhookDevtools = devtools
    ? hooks.hook('kubb:build:start', () => {
        const { inputNode } = kubb.driver
        if (!inputNode) return
        devtools.store.setAst({ schemas: inputNode.schemas, operations: inputNode.operations, meta: inputNode.meta })
      })
    : null

  let result: Awaited<ReturnType<typeof kubb.generate>>
  try {
    result = await kubb.generate({ processOutput })
  } finally {
    unhookDevtools?.()
  }

  const telemetryPlugins = Array.from(kubb.driver.plugins.values(), (p) => ({ name: p.name, options: p.options as Record<string, unknown> }))
  await sendTelemetry(
    buildTelemetryEvent({
      command: 'generate',
      kubbVersion: version,
      plugins: telemetryPlugins,
      hrStart,
      filesCreated: result.files.length,
      status: result.success ? 'success' : 'failed',
    }),
  )

  return result.success
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

/**
 * Starts the devtools server, or reports why it could not start and lets the build continue.
 *
 * `@kubb/devtools` is a proof of concept and a devDependency, so it is absent from a published
 * install. The import is dynamic and the failure non-fatal: nothing about a normal run should
 * depend on it. Reported through clack rather than a `kubb:warn` hook so it surfaces at the
 * same point as the success line beside it, before any config starts building.
 */
async function startDevtoolsServer(hooks: Hookable<KubbHooks>): Promise<DevtoolsServer | undefined> {
  try {
    const { startDevtools } = await import('@kubb/devtools')
    return await startDevtools({ hooks })
  } catch (caughtError) {
    clack.log.warn(styleText('yellow', `KUBB_DEVTOOLS is set but the devtools did not start: ${toError(caughtError).message}`))
    return undefined
  }
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

  // Proof-of-concept entry point. A real `--devtools` flag belongs on the command itself.
  const devtools = process.env.KUBB_DEVTOOLS === '1' ? await startDevtoolsServer(hooks) : undefined
  if (devtools) {
    clack.log.step(styleText('cyan', `Kubb DevTools running on ${devtools.origin}`))
    if (!watch) {
      clack.log.warn('DevTools close when the build finishes. Pass --watch to keep them running.')
    } else {
      // Its listening socket is a handle `startWatcher`'s own SIGINT/SIGTERM handler
      // (scoped to the file watcher) doesn't know about and would otherwise leave open,
      // hanging the process past a Ctrl+C.
      const closeDevtools = () => {
        void devtools.close()
      }
      process.once('SIGINT', closeDevtools)
      process.once('SIGTERM', closeDevtools)
    }
  }

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
          await generate({ input, config, logLevel, hooks, devtools })
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
          const succeeded = await generate({ input, config, logLevel, hooks, devtools })
          if (!succeeded) anyFailed = true
        } catch (configError) {
          await hooks.callHook('kubb:error', { error: toError(configError) })
          anyFailed = true
        }
      }
    }

    await hooks.callHook('kubb:lifecycle:end')

    // `startWatcher` returns as soon as the watcher is registered, so this line is reached
    // under --watch too. Closing there would kill the server the watcher exists to feed.
    if (!watch) {
      await devtools?.close()
    }

    if (anyFailed) {
      process.exit(1)
    }
  } catch (error) {
    await hooks.callHook('kubb:error', { error: toError(error) })
    process.exit(1)
  }
}
