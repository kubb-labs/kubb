import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { formatters, linters, toError } from '@internals/utils'
import {
  Hookable,
  type CLIOptions,
  cliReporter,
  type Config,
  createKubb,
  Diagnostics,
  fileReporter,
  getInputKind,
  htmlReporter,
  jsonReporter,
  type KubbHooks,
  logLevel as logLevelMap,
  memoryStorage,
  type ReporterName,
} from '@kubb/core'
import { version } from '../../../package.json'
import { trackRun } from '../../Telemetry.ts'
import { pluralize } from '../../loggers/createLogger.ts'
import setupReporters, { selectReporters } from '../../loggers/reporters.ts'
import { createSpinner, logBanner, logError, logInfo, logIntro, logOutro, logSpacer, logStep, logTip } from '../../loggers/output.ts'
import { getConfigs } from '../../config.ts'
import { fetchUrlBody, isNewerVersion, startUrlWatcher, startWatcher } from './utils.ts'

/** NPM registry endpoint used to check for @kubb/cli updates. */
const KUBB_NPM_PACKAGE_URL = 'https://registry.npmjs.org/@kubb/cli/latest' as const

/** Upper bound in milliseconds for the npm update check, so a slow registry never stalls a run. */
const UPDATE_CHECK_TIMEOUT_MS = 3_000

/** The formatter names from `Config['output'].format`, without `'auto'` (detection, not a tool) and `false` (skip). */
type FormatterName = Exclude<NonNullable<Config['output']['format']>, 'auto' | false>
type LinterName = Exclude<NonNullable<Config['output']['lint']>, 'auto' | false>

// Pinned here, not in `@internals/utils` (which must not import `@kubb/core`): a tool added to the union without a descriptor fails to compile.
formatters satisfies Record<FormatterName, unknown>
linters satisfies Record<LinterName, unknown>

type GenerateProps = {
  input?: string
  config: Config
  hooks: Hookable<KubbHooks>
  /**
   * When `true`, generates in memory instead of writing to disk, and skips formatting, linting,
   * and post-generate commands.
   */
  dryRun?: boolean
}

async function generate(options: GenerateProps): Promise<boolean> {
  const { input, hooks, dryRun = false } = options

  const report = trackRun({ command: 'generate', hrStart: process.hrtime() })

  const config: Config = {
    ...options.config,
    input: input ?? options.config.input,
    // Dry-run never touches disk, regardless of the config's own storage driver.
    storage: dryRun ? memoryStorage() : options.config.storage,
    // Also keeps core's `hasOutputPasses` false, so dry-run skips the output manifest write too.
    output: dryRun ? { ...options.config.output, format: false, lint: false, postGenerate: [] } : options.config.output,
  }

  // Core formats, lints and runs `output.postGenerate` after an error-free build, and reports
  // their failures as coded diagnostics that reach the summary, the json report and the exit code.
  const kubb = createKubb(config, { hooks })
  const result = await kubb.generate()

  if (dryRun) {
    await hooks.callHook('kubb:info', { message: 'Dry run: no files were written', info: `${result.files.length} file(s) would be generated` })
  }

  await report({
    plugins: Array.from(kubb.driver.plugins.values(), (p) => ({ name: p.name, options: p.options as Record<string, unknown> })),
    filesCreated: result.files.length,
    status: result.success ? 'success' : 'failed',
  })

  return result.success
}

type GenerateCommandOptions = {
  input?: string
  configPath?: string
  logLevel: string
  watch: boolean
  reporters?: Array<ReporterName>
  dryRun?: boolean
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
export async function run({ input, configPath, logLevel: logLevelKey, watch, reporters: cliReporters, dryRun }: GenerateCommandOptions): Promise<void> {
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new Hookable<KubbHooks>()

  // CLI `--reporter` selects which reporters to trigger by name, defaulting to `cli`. `defineConfig`
  // registers the built-in reporters on the config; a config exported without it falls back to them below.
  const requestedNames: Array<ReporterName> = cliReporters?.length ? cliReporters : ['cli']

  // The `json` reporter owns stdout, so the command writes nothing of its own around it.
  const quiet = logLevel <= logLevelMap.silent || requestedNames.includes('json')

  if (!quiet) {
    logBanner(version)
    logIntro({ title: 'Configuration' })
  }

  // Load the config first so `config.reporters` can pick the reporters. A failure here has no
  // reporter installed yet, so fall back to the default `cli` reporter to surface it.
  const configSpinner = createSpinner()
  let configs: Array<Config>
  let resolvedConfigPath: string
  try {
    if (!quiet) configSpinner.start('Loading config')

    const loaded = await getConfigs({
      configPath,
      input,
      watch,
      logLevel: logLevelKey as CLIOptions['logLevel'],
    })
    configs = loaded.configs
    resolvedConfigPath = loaded.configPath

    if (!quiet) configSpinner.stop(`Loaded ${styleText('dim', path.relative(process.cwd(), resolvedConfigPath))}`)
  } catch (error) {
    if (!quiet) configSpinner.error('Config failed loading')

    setupReporters(hooks, { logLevel, reporters: [cliReporter] })
    await hooks.callHook('kubb:error', { error: toError(error) })

    if (!quiet) logOutro(styleText('red', '✗ Configuration failed'))
    process.exit(1)
  }

  // Without a reporter nothing is printed, not even an error, so a config written without
  // `defineConfig` gets the same built-ins it would have registered.
  const available = configs[0]?.reporters?.length ? configs[0].reporters : [cliReporter, jsonReporter, fileReporter, htmlReporter]
  const reporters = selectReporters(available, requestedNames)
  setupReporters(hooks, { logLevel, reporters })

  await hooks.callHook('kubb:lifecycle:start', { version })

  // Inside the bootstrap group, so an update notice reads as part of the setup rather than as part
  // of the first config's generation.
  await checkForUpdate(hooks)

  if (!quiet) logOutro(`${pluralize(configs.length, 'config')} ready`)

  try {
    let anyFailed = false
    for (const config of configs) {
      const effectiveInput = input ?? config.input
      const inputKind = typeof effectiveInput === 'string' ? getInputKind(effectiveInput) : undefined
      const watchPath = inputKind === 'file' || inputKind === 'url' ? (effectiveInput as string) : undefined
      if (watchPath && watch) {
        const watchedPaths = [watchPath]
        // Don't removeAll() between builds, that would also drop logger and lifecycle
        // listeners. Plugin listeners are already disposed by safeBuild's dispose()
        // in its finally block, so re-running generate() on the same hooks emitter is safe.
        const build = async (paths: Array<string>) => {
          const succeeded = await generate({ input, config, hooks, dryRun })
          logStep(styleText('yellow', `Watching for changes in ${paths.join(' and ')}`))
          if (succeeded) {
            logSpacer()
            logTip()
          }
        }

        // For a URL input, capture the document before the build: it becomes the watcher's
        // change-detection baseline, so an edit landing before the first poll still rebuilds.
        // When the server is down the baseline stays undefined and the watcher rebuilds on its
        // first successful poll, so recovery with an unchanged document still generates output.
        const initialBody = inputKind === 'url' ? await fetchUrlBody(watchPath) : undefined

        // The watchers ignore their startup state, so run the first build here; a failing one keeps watching so the user can fix the input.
        try {
          await build(watchedPaths)
        } catch (buildError) {
          await hooks.callHook('kubb:error', { error: toError(buildError) })
        }

        if (inputKind === 'url') {
          startUrlWatcher(watchPath, build, { log: { info: logInfo, error: logError }, initialBody })
        } else {
          startWatcher(watchedPaths, build, { info: logInfo, error: logError })
        }
      } else {
        try {
          const succeeded = await generate({ input, config, hooks, dryRun })
          if (!succeeded) anyFailed = true
        } catch (configError) {
          await hooks.callHook('kubb:error', { error: toError(configError) })
          anyFailed = true
        }
      }
    }

    await hooks.callHook('kubb:lifecycle:end')

    // Watch mode prints a tip after each successful build. Regular generate commands need to
    // print one explicitly after the lifecycle group has closed so it stays outside the group.
    if (!quiet && !watch && !anyFailed) {
      logTip()
    }

    if (anyFailed) {
      process.exit(1)
    }
  } catch (error) {
    await hooks.callHook('kubb:error', { error: toError(error) })
    process.exit(1)
  }
}
