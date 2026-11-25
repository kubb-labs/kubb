import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { styleText } from 'node:util'
import { formatMs, formatters, getElapsedMs, linters } from '@internals/utils'
import {
  Hookable,
  type CLIOptions,
  cliReporter,
  type Config,
  Diagnostics,
  fileReporter,
  getInputKind,
  htmlReporter,
  jsonReporter,
  Kubb,
  LOCKFILE_NAME,
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
import { logError, logInfo, logStep, logWarn } from '../../ui/log.ts'
import { logBanner } from '../../ui/mascot.ts'
import { createSpinner } from '../../ui/spinner.ts'
import { getConfigs } from '../../config.ts'
import { isOutdated } from '../../utils/registry.ts'
import { getLatestVersion } from '../../utils/updateCheck.ts'
import { createOutputCheck, type OutputCheck } from './check.ts'
import { type BuildDiff, type BuildSnapshot, diffBuilds, listenForKeys, startWatcher, trackBuild } from './utils.ts'

/** The formatter names from `Config['output'].format`, without `'auto'` (detection, not a tool) and `false` (skip). */
type FormatterName = Exclude<NonNullable<Config['output']['format']>, 'auto' | false>
type LinterName = Exclude<NonNullable<Config['output']['lint']>, 'auto' | false>

// Pinned here, not in `@internals/utils` (which must not import `@kubb/core`): a tool added to the union without a descriptor fails to compile.
formatters satisfies Record<FormatterName, unknown>
linters satisfies Record<LinterName, unknown>

function toRunConfig({ config, input, dryRun }: { config: Config; input?: string; dryRun: boolean }): Config {
  return {
    ...config,
    input: input ?? config.input,
    // Dry-run never touches disk, regardless of the config's own storage driver.
    storage: dryRun ? memoryStorage() : config.storage,
    output: dryRun ? { ...config.output, format: false, lint: false, postGenerate: [] } : config.output,
  }
}

export type GenerateProps = {
  configs: Array<Config>
  hooks: Hookable<KubbHooks>
  force?: boolean
}

/**
 * Generates the configs and returns whether every build succeeded.
 */
export async function generate({ configs, hooks, force }: GenerateProps): Promise<boolean> {
  // Not awaited: a detached process sends each request, so it never delays the summary or the exit.
  const untrack = hooks.hook('kubb:generation:end', ({ config, filesCreated = 0, status = 'success', hrStart = process.hrtime(), diagnostics }) => {
    void trackRun({ command: 'generate', hrStart })({
      plugins: config.plugins.flatMap((p) =>
        p && typeof p === 'object' ? [{ name: p.meta?.name ?? p.name ?? '', options: (p.options ?? {}) as Record<string, unknown> }] : [],
      ),
      filesCreated,
      status,
      diagnostics,
    })
  })
  let succeeded = true
  try {
    for await (const { success, error } of Kubb.generate(configs, { hooks, force })) {
      if (error) await Diagnostics.emit(hooks, error)
      succeeded &&= success
    }
  } finally {
    untrack()
  }
  return succeeded
}

export type GenerateCommandOptions = {
  input?: string
  configPath?: string
  logLevel: string
  watch: boolean
  reporters?: Array<ReporterName>
  dryRun?: boolean
  /**
   * Generates in memory and compares the result with `output.path` through `kubb-lock.json`. Nothing is written.
   * The run exits with 1 when the output is out of date and with 2 when it fails.
   */
  check?: boolean
  /**
   * Prints a unified diff for each file `check` finds out of date. Needs `check`.
   */
  diff?: boolean
  /**
   * Generates even when `kubb-lock.json` says the output is up to date.
   */
  force?: boolean
}

/** Upper bound in milliseconds for the update check's cache read or write once generation is done. */
const UPDATE_WAIT_MS = 1_000

/** `promise`'s value, or `undefined` when it takes longer than `ms`. */
function withTimeout<T>({ promise, ms }: { promise: Promise<T>; ms: number }): Promise<T | undefined> {
  const timer = new AbortController()
  const timeout = delay(ms, undefined, { signal: timer.signal }).catch(() => undefined)
  return Promise.race([promise, timeout]).finally(() => timer.abort())
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
 * Generates the configs, then again whenever a local `input` file changes. Returns whether the build succeeded when there is no file to watch.
 */
async function watch({ configs, hooks, quiet }: GenerateProps & { quiet: boolean }): Promise<boolean> {
  const watchPaths = [...new Set(configs.flatMap(({ input }) => (typeof input === 'string' && getInputKind(input) === 'file' ? [input] : [])))]
  if (!watchPaths.length) {
    if (!quiet) logWarn('Watch mode only follows a local `input` file, so the configs are generated once.')
    return generate({ configs, hooks })
  }

  const label = styleText('yellow', `Watching ${watchPaths.map((watchPath) => path.relative(process.cwd(), watchPath)).join(', ')}`)
  const tracker = trackBuild(hooks)
  let previous: BuildSnapshot | undefined
  // Don't removeAll() between builds, that would also drop logger and lifecycle
  // listeners. Plugin listeners are already disposed by safeBuild's dispose()
  // in its finally block, so re-running generate() on the same hooks emitter is safe.
  const build = async () => {
    const hrStart = process.hrtime()
    // Every config builds again, since an edited spec can change what the configs share.
    const succeeded = await generate({ configs, hooks })
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
  // A trigger that lands while a build is queued joins it. One that lands during the build queues one more. Never rejects.
  let queue = Promise.resolve()
  let pending = false
  const rebuild = (): Promise<void> => {
    if (pending) return queue
    pending = true
    queue = queue
      .then(() => {
        pending = false
        return build()
      })
      .catch((error) => void Diagnostics.emit(hooks, error))
    return queue
  }
  const armKeys = quiet
    ? undefined
    : listenForKeys({
        rebuild: () => void rebuild(),
        quit: (code) => void Promise.resolve(hooks.callHook('kubb:lifecycle:end')).finally(() => process.exit(code)),
      })

  // The watcher ignores its startup state, so run the first build here. A failing one keeps watching so the user can fix the input.
  await rebuild()
  await startWatcher(watchPaths, rebuild, { info: logInfo, error: logError })
  return true
}

/**
 * Starts a check for `--check`, which cannot run with `--watch`. With a check, exit code 1 means
 * "out of date", so a failure moves to 2.
 */
function startOutputCheck({ check = false, diff = false, watch }: Pick<GenerateCommandOptions, 'check' | 'diff' | 'watch'>): {
  outputCheck?: OutputCheck
  failureExitCode: number
} {
  if (!check) return { failureExitCode: 1 }
  if (watch) {
    logError('--check cannot run with --watch. Remove one of them.')
    process.exit(2)
  }

  return { outputCheck: createOutputCheck({ diff }), failureExitCode: 2 }
}

// `--check` wins over `--dry-run`: it writes nothing either.
function toRunConfigs({
  configs,
  input,
  dryRun = false,
  outputCheck,
}: {
  configs: Array<Config>
  input?: string
  dryRun?: boolean
  outputCheck?: OutputCheck
}) {
  if (outputCheck) return outputCheck.prepare(configs.map((config) => toRunConfig({ config, input, dryRun: false })))

  return configs.map((config) => toRunConfig({ config, input, dryRun }))
}

/** A run that failed, or a check that found stale files, ends on what to fix, not on a tip. */
function showsTip({
  quiet,
  watchMode,
  succeeded,
  outputCheck,
}: {
  quiet: boolean
  watchMode: boolean
  succeeded: boolean
  outputCheck?: OutputCheck
}): boolean {
  return !quiet && !watchMode && succeeded && !outputCheck?.changed
}

// stdout belongs to the `json` report, so the warning goes to stderr there.
function warnMissingLockfile({ json }: { json: boolean }): void {
  const message = `No readable ${LOCKFILE_NAME} found. Run \`kubb generate\` and commit ${LOCKFILE_NAME}, so --check can recognize formatted output.`
  const warn = json ? console.error : logWarn
  warn(message)
}

/**
 * Ends a run: prints the diffs of a check and sets the exit code. A check that succeeded exits with 1
 * when the output is out of date. stdout belongs to the `json` report, so the diffs go to stderr there.
 */
function reportOutcome({
  succeeded,
  failureExitCode,
  outputCheck,
  json,
  silent,
}: {
  succeeded: boolean
  failureExitCode: number
  outputCheck?: OutputCheck
  json: boolean
  silent: boolean
}): void {
  for (const patch of outputCheck?.patches ?? []) (json ? console.error : console.log)(patch)
  if (outputCheck?.missingLockfile && !silent) warnMissingLockfile({ json })
  // `exitCode`, not `exit()`, so the payload piped to the telemetry process is flushed first.
  if (!succeeded) {
    process.exitCode = failureExitCode
    return
  }
  if (outputCheck?.changed) process.exitCode = 1
}

async function isUpToDate(configs: ReadonlyArray<Config>): Promise<boolean> {
  for (const config of configs) {
    if (!(await Kubb.isUpToDate(config))) return false
  }

  return true
}

async function generateOrSkip({
  configs,
  hooks,
  quiet,
  force,
  watchMode,
  canSkip,
}: GenerateProps & { quiet: boolean; watchMode: boolean; canSkip: boolean }): Promise<boolean> {
  if (canSkip && (await isUpToDate(configs))) {
    if (!quiet) logStep(`Up to date: the config, the spec, and the installed packages match ${LOCKFILE_NAME}. Use --force to generate anyway.`)
    return true
  }

  return watchMode ? watch({ configs, hooks, quiet }) : generate({ configs, hooks, force })
}

/**
 * Runs the full Kubb generation lifecycle for the given CLI options.
 * Loads configs, sets up the reporters (CLI `--reporter` picks which of `config.reporters` to trigger),
 * calls `generate` for each config entry, and prints an update notice when a newer version is known.
 */
export async function run({
  input,
  configPath,
  logLevel: logLevelKey,
  watch: watchMode,
  reporters: cliReporters,
  dryRun,
  check,
  diff,
  force,
}: GenerateCommandOptions): Promise<void> {
  const { outputCheck, failureExitCode } = startOutputCheck({ check, diff, watch: watchMode })

  // Started first: the notice prints at the end only when the stored answer or the registry is there by then.
  const updateCheck = new AbortController()
  const latestVersion = getLatestVersion(updateCheck.signal)
  const logLevel = logLevelMap[logLevelKey as keyof typeof logLevelMap] ?? logLevelMap.info
  const hooks = new Hookable<KubbHooks>()

  // CLI `--reporter` selects which reporters to trigger by name, defaulting to `cli`. `defineConfig`
  // registers the built-in reporters on the config; a config exported without it falls back to them below.
  const requestedNames: Array<ReporterName> = cliReporters?.length ? cliReporters : ['cli']

  // The `json` reporter owns stdout, so the command writes nothing of its own around it.
  const json = requestedNames.includes('json')
  const quiet = logLevel <= logLevelMap.silent || json

  // The run log goes to stderr in `json` mode, so an error with no report entry is never silent and stdout stays one JSON document.
  if (json) setupReporters(hooks, { logLevel, reporters: [cliReporter], writer: createPlainWriter(console.error) })

  // The config loads while the banner plays. Once it settles the banner jumps to its last frame, so
  // the build starts right away and no frame lands between log lines.
  const bannerCut = new AbortController()
  const banner = quiet ? undefined : logBanner({ version, signal: bannerCut.signal })
  const loading = getConfigs({
    configPath,
    input,
    watch: watchMode,
    logLevel: logLevelKey as CLIOptions['logLevel'],
    reporters: cliReporters,
  })
  // A rejection is handled below; this also keeps it from counting as unhandled during the banner.
  void loading.then(
    () => bannerCut.abort(),
    () => bannerCut.abort(),
  )
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
    await Diagnostics.emit(hooks, error)

    if (!quiet) logOutro(styleText('red', '✗ Configuration failed'))
    process.exit(failureExitCode)
  }

  // Without a reporter nothing is printed, not even an error, so a config written without
  // `defineConfig` gets the same built-ins it would have registered.
  const available = configs[0]?.reporters?.length ? configs[0].reporters : [cliReporter, jsonReporter, fileReporter, htmlReporter]
  const reporters = selectReporters(available, requestedNames)
  setupReporters(hooks, { logLevel, reporters, dryRun, outputCheck })

  await hooks.callHook('kubb:lifecycle:start', { version })

  if (!quiet) logOutro(`${pluralize(configs.length, 'config')} ready`)

  try {
    const runConfigs = toRunConfigs({ configs, input, dryRun, outputCheck })
    // Only the `cli` reporter can do without the results of a build. The others report on each config.
    const canSkip = ![force, watchMode, dryRun, outputCheck].some(Boolean) && requestedNames.every((name) => name === 'cli')
    const succeeded = await generateOrSkip({ configs: runConfigs, hooks, quiet, force, watchMode, canSkip })

    // Aborting settles a request in flight at once; the timeout covers a cache read or write on a stalled disk.
    updateCheck.abort()
    await checkForUpdate({ hooks, latestVersion: await withTimeout({ promise: latestVersion, ms: UPDATE_WAIT_MS }) })

    await hooks.callHook('kubb:lifecycle:end')
    reportOutcome({ succeeded, failureExitCode, outputCheck, json, silent: logLevel <= logLevelMap.silent })

    // Watch mode prints a tip after each successful build. Regular generate commands need to
    // print one explicitly after the lifecycle group has closed so it stays outside the group.
    if (showsTip({ quiet, watchMode, succeeded, outputCheck })) {
      logTip()
    }
  } catch (error) {
    await Diagnostics.emit(hooks, error)
    process.exit(failureExitCode)
  }
}
