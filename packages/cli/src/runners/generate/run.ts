import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { formatMs, formatters, getElapsedMs, linters } from '@internals/utils'
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
import { createPlainLogger } from '../../loggers/plainLogger.ts'
import { createSpinner, logBanner, logError, logFileChanges, logInfo, logIntro, logOutro, logSpacer, logStep, logTip } from '../../loggers/output.ts'
import { getConfigs } from '../../config.ts'
import { isOutdated } from '../../utils/registry.ts'
import {
  type BuildDiff,
  type BuildSnapshot,
  createSerialRunner,
  diffBuilds,
  fetchUrlBody,
  listenForKeys,
  startUrlWatcher,
  startWatcher,
  trackBuild,
} from './utils.ts'

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
   * When `true`, generates in memory instead of writing to disk, skips formatting, linting, and
   * post-generate commands, and prints what would change on disk.
   */
  dryRun?: boolean
}

export async function generate(options: GenerateProps): Promise<boolean> {
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

  await report({
    // A setup that threw leaves no driver, so read the configured plugins instead.
    plugins: kubb.config.plugins.flatMap((p) =>
      p && typeof p === 'object' ? [{ name: p.meta?.name ?? p.name ?? '', options: (p.options ?? {}) as Record<string, unknown> }] : [],
    ),
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

/** The latest published version, `undefined` when the registry does not answer in time. Never rejects. */
async function fetchLatestVersion(): Promise<string | undefined> {
  try {
    const res = await fetch(KUBB_NPM_PACKAGE_URL, { signal: AbortSignal.timeout(UPDATE_CHECK_TIMEOUT_MS) })
    const data = (await res.json()) as { version: string }
    return data.version
  } catch {
    // Ignore network errors
    return undefined
  }
}

async function checkForUpdate({ hooks, latest }: { hooks: Hookable<KubbHooks>; latest: Promise<string | undefined> }): Promise<void> {
  const latestVersion = await latest
  if (latestVersion && isOutdated({ installed: version, latest: latestVersion })) {
    await Diagnostics.emit(hooks, Diagnostics.update({ currentVersion: version, latestVersion }))
  }
}

/** `+1 schema -2 operations`, or an empty string when the spec kept the same names. */
function formatSpecChange({ schemas, operations }: BuildDiff): string {
  return [
    schemas.added && styleText('green', `+${pluralize(schemas.added, 'schema')}`),
    schemas.removed && styleText('red', `-${pluralize(schemas.removed, 'schema')}`),
    operations.added && styleText('green', `+${pluralize(operations.added, 'operation')}`),
    operations.removed && styleText('red', `-${pluralize(operations.removed, 'operation')}`),
  ]
    .filter(Boolean)
    .join(' ')
}

/** Prints what a watch rebuild changed: the spec's names, then each added, modified or removed file. */
function logRebuild({ diff, durationMs }: { diff: BuildDiff; durationMs: number }): void {
  const specChange = formatSpecChange(diff)
  logStep(
    [`Rebuilt in ${formatMs(durationMs)}`, specChange, `${pluralize(diff.files.length, 'file')} changed`, `${diff.unchanged} unchanged`]
      .filter(Boolean)
      .join(styleText('dim', ' · ')),
  )
  logFileChanges(diff.files)
}

/**
 * Runs the full Kubb generation lifecycle for the given CLI options.
 * Loads configs, sets up the reporters (CLI `--reporter` picks which of `config.reporters` to trigger),
 * checks for a newer version, and calls `generate` for each config entry.
 */
export async function run({ input, configPath, logLevel: logLevelKey, watch, reporters: cliReporters, dryRun }: GenerateCommandOptions): Promise<void> {
  // Started first so the registry request overlaps the banner and the config load.
  const latest = fetchLatestVersion()
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new Hookable<KubbHooks>()

  // CLI `--reporter` selects which reporters to trigger by name, defaulting to `cli`. `defineConfig`
  // registers the built-in reporters on the config; a config exported without it falls back to them below.
  const requestedNames: Array<ReporterName> = cliReporters?.length ? cliReporters : ['cli']

  // The `json` reporter owns stdout, so the command writes nothing of its own around it.
  const json = requestedNames.includes('json')
  const quiet = logLevel <= logLevelMap.silent || json

  // Errors raised outside a build have no report entry. In `json` mode they go to a stderr logger,
  // so they are never silent and stdout stays one JSON document.
  const errorHooks = json ? new Hookable<KubbHooks>() : hooks
  if (json) setupReporters(errorHooks, { logLevel, reporters: [cliReporter], logger: createPlainLogger(console.error) })

  // The config loads while the banner plays; the output still prints in order once the banner is done.
  const banner = quiet ? undefined : logBanner(version)
  const loading = getConfigs({
    configPath,
    input,
    watch,
    logLevel: logLevelKey as CLIOptions['logLevel'],
  })
  // Handled below; this keeps a rejection during the banner from counting as unhandled.
  loading.catch(() => undefined)
  await banner

  if (!quiet) {
    logIntro({ title: 'Configuration' })
  }

  // Load the config first so `config.reporters` can pick the reporters. A failure here has no
  // reporter installed yet, so fall back to the default `cli` reporter to surface it.
  const configSpinner = createSpinner()
  let configs: Array<Config>
  let resolvedConfigPath: string
  try {
    if (!quiet) configSpinner.start('Loading config')

    const loaded = await loading
    configs = loaded.configs
    resolvedConfigPath = loaded.configPath

    if (!quiet) configSpinner.stop(`Loaded ${styleText('dim', path.relative(process.cwd(), resolvedConfigPath))}`)
  } catch (error) {
    if (!quiet) configSpinner.error('Config failed loading')

    if (!json) setupReporters(hooks, { logLevel, reporters: [cliReporter] })
    // A diagnostic thrown while the config file runs, such as invalid extension options, sits in the cause chain.
    await Diagnostics.emit(errorHooks, error)

    if (!quiet) logOutro(styleText('red', '✗ Configuration failed'))
    process.exit(1)
  }

  // Without a reporter nothing is printed, not even an error, so a config written without
  // `defineConfig` gets the same built-ins it would have registered.
  const available = configs[0]?.reporters?.length ? configs[0].reporters : [cliReporter, jsonReporter, fileReporter, htmlReporter]
  const reporters = selectReporters(available, requestedNames)
  setupReporters(hooks, { logLevel, reporters, dryRun })

  await hooks.callHook('kubb:lifecycle:start', { version })

  // Inside the bootstrap group, so an update notice reads as part of the setup rather than as part
  // of the first config's generation.
  await checkForUpdate({ hooks, latest })

  if (!quiet) logOutro(`${pluralize(configs.length, 'config')} ready`)

  try {
    let anyFailed = false
    // One tracker, one key listener and one build queue serve every watched config, so several configs never mix diffs or answer `r` twice.
    const tracker = watch ? trackBuild(hooks) : undefined
    const rebuilds: Array<() => void> = []
    let armKeys: (() => void) | undefined
    let keysListening = false
    let queue = Promise.resolve()
    for (const config of configs) {
      const effectiveInput = input ?? config.input
      const inputKind = typeof effectiveInput === 'string' ? getInputKind(effectiveInput) : undefined
      const watchPath = inputKind === 'file' || inputKind === 'url' ? (effectiveInput as string) : undefined
      if (watchPath && watch) {
        const watchedPaths = [watchPath]
        let previous: BuildSnapshot | undefined
        // Don't removeAll() between builds, that would also drop logger and lifecycle
        // listeners. Plugin listeners are already disposed by safeBuild's dispose()
        // in its finally block, so re-running generate() on the same hooks emitter is safe.
        const build = async (paths: Array<string>) => {
          const hrStart = process.hrtime()
          const succeeded = await generate({ input, config, hooks, dryRun })
          const snapshot = tracker!.take()
          if (previous) logRebuild({ diff: diffBuilds(previous, snapshot), durationMs: getElapsedMs(hrStart) })
          previous = snapshot

          const watching = styleText(
            'yellow',
            `Watching ${paths.map((watched) => (getInputKind(watched) === 'url' ? watched : path.relative(process.cwd(), watched))).join(' and ')}`,
          )
          logStep(armKeys ? `${watching}  ${styleText('dim', 'r rebuild · q quit')}` : watching)
          armKeys?.()
          if (succeeded) {
            logSpacer()
            logTip()
          }
        }
        // Watcher events and the `r` key share one queue, so builds never overlap on the emitter.
        const rebuild = createSerialRunner({
          run: () => {
            // Configs share the emitter, so their builds also wait for each other.
            const next = queue.then(() => build(watchedPaths))
            queue = next.catch(() => undefined)
            return next
          },
          onError: (buildError) => void Diagnostics.emit(errorHooks, buildError),
        })
        rebuilds.push(() => void rebuild())
        if (!quiet && !keysListening) {
          keysListening = true
          armKeys = listenForKeys({
            rebuild: () => rebuilds.forEach((trigger) => trigger()),
            quit: (code) => void Promise.resolve(hooks.callHook('kubb:lifecycle:end')).finally(() => process.exit(code)),
          })
        }

        // For a URL input, capture the document before the build: it becomes the watcher's
        // change-detection baseline, so an edit landing before the first poll still rebuilds.
        // When the server is down the baseline stays undefined and the watcher rebuilds on its
        // first successful poll, so recovery with an unchanged document still generates output.
        const initialBody = inputKind === 'url' ? await fetchUrlBody(watchPath) : undefined

        // The watchers ignore their startup state, so run the first build here; a failing one keeps watching so the user can fix the input.
        await rebuild()

        if (inputKind === 'url') {
          startUrlWatcher(watchPath, rebuild, { log: { info: logInfo, error: logError }, initialBody })
        } else {
          await startWatcher(watchedPaths, rebuild, { info: logInfo, error: logError })
        }
      } else {
        try {
          const succeeded = await generate({ input, config, hooks, dryRun })
          if (!succeeded) anyFailed = true
        } catch (configError) {
          await Diagnostics.emit(errorHooks, configError)
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
    await Diagnostics.emit(errorHooks, error)
    process.exit(1)
  }
}
