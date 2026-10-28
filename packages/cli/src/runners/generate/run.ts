import { availableParallelism } from 'node:os'
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
import { pluralize } from '../../ui/text.ts'
import setupReporters, { selectReporters } from '../../loggers/reporters.ts'
import { createPlainWriter } from '../../loggers/plainWriter.ts'
import { logIntro, logOutro, logSpacer, logTip } from '../../ui/intro.ts'
import { logError, logInfo, logStep, logWarn, writer } from '../../ui/log.ts'
import { logBanner } from '../../ui/mascot.ts'
import { createSpinner } from '../../ui/spinner.ts'
import { getConfigs } from '../../config.ts'
import { generateInWorkers } from './pool.ts'
import { isOutdated } from '../../utils/registry.ts'
import { type BuildDiff, type BuildSnapshot, diffBuilds, listenForKeys, startWatcher, trackBuild } from './utils.ts'

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

  // Not awaited: the request finishes in the background, capped by its timeout, so it never delays the summary.
  void report({
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

/** The latest published version, `undefined` when the registry does not answer in time or `signal` aborts. Never rejects. */
async function fetchLatestVersion(signal: AbortSignal): Promise<string | undefined> {
  try {
    const res = await fetch(KUBB_NPM_PACKAGE_URL, { signal: AbortSignal.any([signal, AbortSignal.timeout(UPDATE_CHECK_TIMEOUT_MS)]) })
    const data = (await res.json()) as { version: string }
    return data.version
  } catch {
    // Ignore network errors
    return undefined
  }
}

async function checkForUpdate({ hooks, latestVersion }: { hooks: Hookable<KubbHooks>; latestVersion: string | undefined }): Promise<void> {
  if (latestVersion && isOutdated({ installed: version, latest: latestVersion })) {
    await Diagnostics.emit(hooks, Diagnostics.update({ currentVersion: version, latestVersion }))
  }
}

/** Prints `Rebuilt in 1.2s · +1 schema -2 operations`, without the names part when the spec kept the same names. */
function logRebuild({ diff: { schemas, operations }, durationMs }: { diff: BuildDiff; durationMs: number }): void {
  const specChange = [
    schemas.added && styleText('green', `+${pluralize(schemas.added, 'schema')}`),
    schemas.removed && styleText('red', `-${pluralize(schemas.removed, 'schema')}`),
    operations.added && styleText('green', `+${pluralize(operations.added, 'operation')}`),
    operations.removed && styleText('red', `-${pluralize(operations.removed, 'operation')}`),
  ]
    .filter(Boolean)
    .join(' ')
  logStep([`Rebuilt in ${formatMs(durationMs)}`, specChange].filter(Boolean).join(styleText('dim', ' · ')))
}

/**
 * Runs the full Kubb generation lifecycle for the given CLI options.
 * Loads configs, sets up the reporters (CLI `--reporter` picks which of `config.reporters` to trigger),
 * calls `generate` for each config entry, and prints an update notice when the registry answered in time.
 */
export async function run({ input, configPath, logLevel: logLevelKey, watch, reporters: cliReporters, dryRun }: GenerateCommandOptions): Promise<void> {
  // Started first and never awaited: the notice prints at the end only when the registry has answered by then.
  const updateCheck = new AbortController()
  let latestVersion: string | undefined
  void fetchLatestVersion(updateCheck.signal).then((value) => {
    latestVersion = value
  })
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
  if (json) setupReporters(errorHooks, { logLevel, reporters: [cliReporter], writer: createPlainWriter(console.error) })

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

  if (!quiet) logOutro(`${pluralize(configs.length, 'config')} ready`)

  try {
    let anyFailed = false
    // One tracker, one key listener and one build queue serve every watched config, so several configs never mix diffs or answer `r` twice.
    const tracker = watch ? trackBuild(hooks) : undefined
    const rebuilds: Array<() => Promise<void>> = []
    let armKeys: (() => void) | undefined
    // Configs share the hooks emitter, so every build, from any watcher or the `r` key, waits for the one before it.
    let queue = Promise.resolve()
    // Watch mode serializes its rebuilds on this one hooks emitter; a plain run spreads the entries over the cores.
    const workers = watch ? 1 : Math.min(availableParallelism(), configs.length)
    if (workers > 1) {
      if (!quiet) logStep(`Generating ${pluralize(configs.length, 'config')} on ${pluralize(workers, 'worker')}`)
      const draw = writer()
      anyFailed = await generateInWorkers({
        configs,
        workers,
        writer: draw,
        reporters,
        logLevel,
        errorHooks,
        launch: {
          configPath: resolvedConfigPath,
          input,
          logLevel: logLevelKey as CLIOptions['logLevel'],
          dryRun,
          audience: draw.audience,
          reporters: reporters.map(({ name, needsPluginFiles }) => ({ name, needsPluginFiles })),
        },
      })
    } else {
      for (const config of configs) {
        const effectiveInput = input ?? config.input
        const inputKind = typeof effectiveInput === 'string' ? getInputKind(effectiveInput) : undefined
        const watchPath = inputKind === 'file' ? (effectiveInput as string) : undefined
        if (watchPath && tracker) {
          const label = styleText('yellow', `Watching ${path.relative(process.cwd(), watchPath)}`)
          let previous: BuildSnapshot | undefined
          // Don't removeAll() between builds, that would also drop logger and lifecycle
          // listeners. Plugin listeners are already disposed by safeBuild's dispose()
          // in its finally block, so re-running generate() on the same hooks emitter is safe.
          const build = async () => {
            const hrStart = process.hrtime()
            const succeeded = await generate({ input, config, hooks, dryRun })
            const snapshot = tracker.take()
            if (previous) logRebuild({ diff: diffBuilds(previous, snapshot), durationMs: getElapsedMs(hrStart) })
            previous = snapshot

            logStep(armKeys ? `${label}  ${styleText('dim', 'r rebuild · q quit')}` : label)
            armKeys?.()
            if (succeeded) {
              logSpacer()
              logTip()
            }
          }
          // A trigger that lands while this config's build is queued joins it; one that lands during the build queues one more. Never rejects.
          let pending = false
          const rebuild = (): Promise<void> => {
            if (pending) return queue
            pending = true
            queue = queue
              .then(() => {
                pending = false
                return build()
              })
              .catch((error) => void Diagnostics.emit(errorHooks, error))
            return queue
          }
          rebuilds.push(rebuild)
          if (!quiet) {
            armKeys ??= listenForKeys({
              rebuild: () => rebuilds.forEach((trigger) => void trigger()),
              quit: (code) => void Promise.resolve(hooks.callHook('kubb:lifecycle:end')).finally(() => process.exit(code)),
            })
          }

          // The watcher ignores its startup state, so run the first build here; a failing one keeps watching so the user can fix the input.
          await rebuild()

          await startWatcher([watchPath], rebuild, { info: logInfo, error: logError })
        } else {
          if (tracker && !quiet) logWarn('Watch mode only follows a local `input` file, so this config is generated once.')
          try {
            const succeeded = await generate({ input, config, hooks, dryRun })
            if (!succeeded) anyFailed = true
          } catch (configError) {
            await Diagnostics.emit(errorHooks, configError)
            anyFailed = true
          }
        }
      }
    }

    // A request still in flight would keep the process alive until its timeout.
    updateCheck.abort()
    await checkForUpdate({ hooks, latestVersion })

    await hooks.callHook('kubb:lifecycle:end')

    // Watch mode prints a tip after each successful build. Regular generate commands need to
    // print one explicitly after the lifecycle group has closed so it stays outside the group.
    if (!quiet && !watch && !anyFailed) {
      logTip()
    }

    // `exitCode`, not `exit()`, so a telemetry request still in flight can finish within its timeout.
    if (anyFailed) {
      process.exitCode = 1
    }
  } catch (error) {
    await Diagnostics.emit(errorHooks, error)
    process.exit(1)
  }
}
