import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { KUBB_CONFIG_FILENAME } from '@internals/shared'
import { copyToClipboard, isCIEnvironment, openInBrowser, toError } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'
import { cliReporter, Diagnostics, Hookable, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { connectAgent, defaultStudioUrl, InvalidAgentTokenError, pairAgent, PairingCanceledError } from '@kubb/studio'
import { AgentPermission } from '@kubb/studio/protocol'
import { trackRun } from '../../Telemetry.ts'
import { plainLogger } from '../../loggers/plainLogger.ts'
import setupReporters from '../../loggers/reporters.ts'
import { createSpinner, logBlock, logIntro, logOutro, logStep, logTip } from '../../loggers/output.ts'
import { canUseTTY, isRichOutput } from '../../utils/env.ts'
import { getConfigs } from '../../config.ts'
import { clearCredentials, type Credentials, getCredentialsPath, getMachineId, readCredentials, writeCredentials } from './credentials.ts'
import { version } from '../../../package.json'

export type StudioOptions = {
  /**
   * Current `@kubb/cli` version, reported to Studio and used for the telemetry payload.
   */
  version: string
  configPath?: string
  /**
   * Base URL of the Studio instance, for a self-hosted deployment. Resolved before it reaches here,
   * since stored credentials are bound to it.
   */
  studioUrl: string
  /**
   * What Studio may do in this project. Each flag grants outright; the rest are asked once per
   * project through {@link resolvePermissions}.
   */
  permission: Record<AgentPermission, boolean>
  /**
   * Whether to open the approval page in a browser during pairing.
   */
  autoOpen: boolean
  logLevel?: CLIOptions['logLevel']
}

export type SnapshotOptions = Pick<StudioOptions, 'configPath' | 'studioUrl' | 'logLevel'> & {
  /**
   * Organization CI API key. Falls back to `KUBB_TOKEN`.
   */
  token?: string
  /**
   * Stable identity for the CI agent. Falls back to CI auto-detection.
   */
  id?: string
  /** Identity of another CI agent to also compare with. Falls back to CI auto-detection. */
  baseId?: string
  /**
   * Package name for the generated tarball. Falls back to the nearest package.json.
   */
  name?: string
  /**
   * Package version for the generated tarball. Falls back to the nearest package.json.
   */
  packageVersion?: string
  /**
   * Print the result as one JSON object instead of a summary.
   */
  json?: boolean
}

/** The flags a `kubb studio` subcommand parsed; each one is optional since a subcommand declares only the flags it uses. */
export type StudioValues = {
  config?: string
  url?: string
  allowRead?: boolean
  allowReadAst?: boolean
  allowWrite?: boolean
  allowConfigEdit?: boolean
  allowExec?: boolean
  open?: boolean
  logLevel?: CLIOptions['logLevel']
}

type LoginOptions = {
  /**
   * Aborting this cancels an in-flight pairing request or poll and rejects with
   * {@link PairingCanceledError}. Wired to `kubb studio`'s shutdown signal, so Ctrl+C during
   * pairing cancels it instead of leaving the poll running.
   */
  signal?: AbortSignal
  /**
   * Credentials from before this login. When the fresh pairing resolves to the same agent on the
   * same Studio, its saved project permissions carry forward instead of being asked again.
   * Left out for an explicitly requested `kubb studio login`, which always starts clean.
   */
  previousCredentials?: Credentials | null
}

/**
 * Pairs this machine with Studio and stores the resulting token.
 *
 * The CLI holds a code and the browser approves it, rather than the user copying a token out of
 * the UI. The token comes back over the CLI's own HTTPS POST, so it never lands in a URL, a
 * server log, or a `Referer` header.
 */
export async function login({ studioUrl, autoOpen }: StudioOptions, { signal, previousCredentials }: LoginOptions = {}): Promise<Credentials> {
  const spinner = createSpinner()
  // The spinner only starts once a code is shown.
  let waiting = false
  let countdown: NodeJS.Timeout | undefined

  try {
    const { token, agent } = await pairAgent({
      studioUrl,
      type: 'cli',
      name: path.basename(process.cwd()),
      hostname: hostname(),
      machineId: await getMachineId(),
      signal,
      onCode: (session) => {
        logStep(
          [
            'Pair this machine',
            `${styleText('dim', 'Open')}   ${styleText('cyan', session.verification_uri)}`,
            `${styleText('dim', 'Code')}   ${styleText('bold', session.user_code)}`,
          ].join('\n'),
        )

        if (autoOpen) {
          openInBrowser(session.verification_uri_complete)
        }

        // Same fallback as the poll in `@kubb/studio`, so the countdown ends when polling does.
        const deadline = Date.now() + (session.expires_in > 0 ? session.expires_in : 600) * 1000
        let copied = false
        const waitingText = () =>
          `Waiting for approval  ${styleText('dim', `expires in ${formatCountdown(deadline - Date.now())}${copied ? ' · code copied' : ''} · ctrl+c to cancel`)}`
        clearInterval(countdown)
        spinner.start(waitingText())
        waiting = true
        // Plain output prints every message, so only an animated spinner ticks.
        if (isRichOutput()) countdown = setInterval(() => spinner.message(waitingText()), 1000)
        // Not awaited: the code shows at once, and the spinner picks up the copy when it lands.
        void copyToClipboard(session.user_code).then((done) => {
          copied = done
        })
      },
      onRetry: (error) => spinner.message(`Could not reach Kubb Studio, retrying: ${error.message}`),
    })
    clearInterval(countdown)
    spinner.stop(`Paired as ${agent.name}${agent.organizationSlug ? ` · org ${agent.organizationSlug}` : ''}`)

    const keepsIdentity = previousCredentials?.studioUrl === studioUrl && previousCredentials.agentId === agent.id
    const credentials: Credentials = {
      studioUrl,
      token,
      agentId: agent.id,
      agentSlug: agent.slug,
      ...(agent.organizationSlug ? { organizationSlug: agent.organizationSlug } : {}),
      ...(keepsIdentity && previousCredentials?.projects ? { projects: previousCredentials.projects } : {}),
    }
    await writeCredentials(credentials)

    console.log(`Credentials stored in ${getCredentialsPath()}`)

    return credentials
  } catch (error) {
    clearInterval(countdown)
    if (waiting) {
      spinner.stop(error instanceof PairingCanceledError ? 'Pairing canceled' : 'Pairing failed')
    }
    throw error
  }
}

/** Time left on a pairing code as `m:ss`, never below `0:00`. */
export function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000))

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * What each permission is asked as, in the order the list shows them.
 */
const PERMISSIONS: ReadonlyArray<{
  key: AgentPermission
  /**
   * Short label for status output and the connect summary.
   */
  label: string
  title: (configPath: string) => string
  hint: string
}> = [
  { key: AgentPermission.READ, label: 'read source', title: () => 'Read generated files', hint: 'show code in the browser' },
  { key: AgentPermission.READ_AST, label: 'read spec', title: () => 'Read the parsed spec', hint: 'browse schemas and operations' },
  { key: AgentPermission.WRITE, label: 'write files', title: () => 'Write files to disk', hint: 'generate from the browser' },
  { key: AgentPermission.CONFIG_EDIT, label: 'edit config', title: (configPath) => `Change ${configPath}`, hint: 'edit plugin options' },
  { key: AgentPermission.EXEC, label: 'run tools', title: () => 'Run the formatter, linter, and postGenerate', hint: 'after each generation' },
]

/** The flag that grants a permission, such as `--allow-read-ast`. */
export function toPermissionFlag(key: AgentPermission): string {
  return `--${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`
}

/** The granted permissions as one line, such as `read source · read spec`. */
export function formatPermissionSummary(granted: Record<AgentPermission, boolean>): string {
  return (
    PERMISSIONS.filter(({ key }) => granted[key])
      .map(({ label }) => label)
      .join(' · ') || 'no permissions'
  )
}

/**
 * Two permissions per row, each marked granted or not, with the flags that grant the missing ones
 * after the last row. For `kubb studio status`.
 */
export function formatPermissionRows(granted: Record<AgentPermission, boolean>): Array<string> {
  const width = Math.max(...PERMISSIONS.map(({ label }) => label.length))
  const cells = PERMISSIONS.map(({ key, label }) => `${granted[key] ? styleText('green', '✓') : styleText('red', '✖')} ${label.padEnd(width)}`)
  const rows = Array.from({ length: Math.ceil(cells.length / 2) }, (_, index) => cells.slice(index * 2, index * 2 + 2).join('  '))
  const flags = PERMISSIONS.filter(({ key }) => !granted[key])
    .map(({ key }) => toPermissionFlag(key))
    .join(' ')

  return flags ? [...rows.slice(0, -1), `${rows.at(-1)}   ${styleText('dim', flags)}`] : rows
}

/**
 * Resolves Studio permissions for the current project.
 * Flags win, saved answers are reused, and the rest are asked in one list whose answers are stored
 * in `~/.kubb/credentials.json`.
 */
export async function resolvePermissions(
  options: StudioOptions,
  credentials: Credentials,
  configPath: string = KUBB_CONFIG_FILENAME,
): Promise<Record<AgentPermission, boolean>> {
  const project = process.cwd()
  const remembered = credentials.projects?.[project]
  const granted = Object.fromEntries(PERMISSIONS.map(({ key }) => [key, options.permission[key] || remembered?.[key] === true])) as Record<
    AgentPermission,
    boolean
  >
  const pending = PERMISSIONS.filter(({ key }) => !options.permission[key] && typeof remembered?.[key] !== 'boolean')

  if (!pending.length || isCIEnvironment() || !canUseTTY()) return granted

  prompts.updateSettings({ withGuide: true })
  const selected = await prompts.multiselect({
    message: 'What may Kubb Studio do in this project?',
    options: pending.map(({ key, title, hint }) => ({ value: key, label: title(configPath), hint })),
    initialValues: pending.filter(({ key }) => key === AgentPermission.READ || key === AgentPermission.READ_AST).map(({ key }) => key),
    required: false,
  })
  // A canceled list grants nothing and saves nothing, so the next run asks again.
  if (prompts.isCancel(selected)) return granted

  const answers = Object.fromEntries(pending.map(({ key }) => [key, selected.includes(key)]))
  await writeCredentials({
    ...credentials,
    projects: { ...credentials.projects, [project]: { ...remembered, ...answers } },
  })

  return { ...granted, ...answers }
}

/**
 * Loads the project's Kubb config the same way `kubb generate` does.
 * Returns the first config.
 */
export async function loadConfigs(options: Pick<StudioOptions, 'configPath' | 'logLevel'>): Promise<{ configPath: string; config: Config }> {
  const { configPath, configs } = await getConfigs({ configPath: options.configPath, logLevel: options.logLevel })
  const [config] = configs

  if (!config) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: 'Config not defined, create a kubb.config.ts or pass it with --config',
    })
  }

  // `getConfigs` resolves this to an absolute path. Relativized here, once, so the permission
  // prompt and the path Studio receives over the wire both show the project-relative form instead
  // of leaking the local filesystem layout.
  return { configPath: path.relative(process.cwd(), configPath) || configPath, config }
}

/**
 * Why a rejected token could not be recovered automatically: no browser is available to re-pair
 * with, or the token this run already re-paired for was rejected again.
 */
type RejectedTokenReason = 'nonInteractive' | 'reauthExhausted'

/**
 * Explains a rejected token to the operator. Builds the error and nothing else, so each caller
 * decides what happens to the credentials.
 */
function explainRejectedToken(error: InvalidAgentTokenError, reason: RejectedTokenReason): Error {
  if (reason === 'reauthExhausted') {
    return new Error(`${error.message} Studio rejected the newly approved token too. Run \`kubb studio login\` and try again.`)
  }

  return new Error(`${error.message} Run \`kubb studio login\` to pair again.`)
}

export type PreparedConnection = {
  configPath: string
  credentials: Credentials
  permissions: StudioOptions['permission']
}

/** Validates the project and resolves pairing and permissions before starting its worker. */
export async function prepareConnection(options: StudioOptions, signal?: AbortSignal): Promise<PreparedConnection> {
  const { configPath } = await loadConfigs(options)
  const stored = await readCredentials()
  const credentials = await (async () => {
    if (stored?.studioUrl === options.studioUrl) return stored
    if (isCIEnvironment()) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: `Not paired with ${options.studioUrl}. In CI, run \`kubb studio snapshot\` instead, or run \`kubb studio login\` on a machine with a browser.`,
      })
    }
    return login(options, { signal })
  })()
  const permissions = await resolvePermissions(options, credentials, configPath)
  return { configPath, credentials, permissions }
}

export type WorkerState = 'starting' | 'connected' | 'reconnecting' | 'authentication required' | 'stopped'

/** Runs the same project connection in the foreground or in a background worker. */
export async function connect(
  options: StudioOptions,
  context: {
    prepared?: PreparedConnection
    signal?: AbortSignal
    onState?: (state: WorkerState) => void | Promise<void>
  } = {},
): Promise<void> {
  const shutdown = new AbortController()
  const signal = context.signal ?? shutdown.signal
  const stop = () => shutdown.abort()
  const events = process as unknown as NodeJS.EventEmitter
  if (!context.signal) {
    events.once('SIGINT', stop)
    events.once('SIGTERM', stop)
  }
  let unwatch: (() => void) | undefined
  try {
    if (!context.prepared) {
      const { getWorkerStatus } = await import('./background.ts')
      const worker = await getWorkerStatus()
      if (worker.running)
        throw new Diagnostics.Error({
          code: Diagnostics.code.unknown,
          severity: 'error',
          message: 'This project is running in the background. Run `kubb studio stop` first.',
        })
    }
    const prepared = context.prepared ?? (await prepareConnection(options, signal))
    let { credentials, permissions } = prepared
    const { configPath } = prepared
    let hinted = false
    // Set by a fresh pairing until it connects, so a token rejected right after approval fails the run instead of looping.
    let pairedAgain = false

    // The background worker writes to a log file, so it gets the plain logger rather than the
    // animated one. The logger also covers the `studio:*` events and each generation run.
    const hooks = new Hookable<KubbHooks>()
    setupReporters(hooks, {
      logLevel: logLevelMap[options.logLevel ?? 'info'],
      reporters: [cliReporter],
      ...(context.onState ? { logger: plainLogger } : {}),
    })
    // `b` hands the session to the background worker; only a foreground run in a terminal listens.
    const listens = !context.onState && process.stdin.isTTY === true && canUseTTY()
    let background = false
    hooks.hook('studio:connected', async () => {
      pairedAgain = false
      await context.onState?.('connected')
      if (listens && !unwatch) {
        unwatch = watchKeys({
          onBackground: () => {
            background = true
            stop()
          },
          onStop: stop,
        })
      }
      if (hinted || context.onState || options.logLevel === 'silent') return
      hinted = true
      logBlock([
        `${styleText('dim', 'Project')}  ${path.basename(process.cwd())}   ${styleText('dim', formatPermissionSummary(permissions))}`,
        styleText('dim', listens ? 'Press b to keep running in the background, Ctrl+C to disconnect' : 'Press Ctrl+C to disconnect'),
      ])
      logTip()
    })
    hooks.hook('studio:reconnecting', () => context.onState?.('reconnecting'))

    for (;;) {
      try {
        await connectAgent({
          token: credentials.token,
          studioUrl: options.studioUrl,
          configPath,
          version: options.version,
          root: process.cwd(),
          permissions,
          loadConfig: async () => (await loadConfigs(options)).config,
          hooks,
          signal,
        })
        break
      } catch (error) {
        if (!(error instanceof InvalidAgentTokenError)) throw error
        await context.onState?.('authentication required')
        await clearCredentials()
        if (pairedAgain) throw explainRejectedToken(error, 'reauthExhausted')
        if (context.onState || isCIEnvironment() || !canUseTTY()) throw explainRejectedToken(error, 'nonInteractive')

        // The pairing prompts need stdin back.
        unwatch?.()
        unwatch = undefined
        console.log(styleText('yellow', `${error.message} Pairing again...`))
        credentials = await login(options, { signal, previousCredentials: credentials })
        pairedAgain = true
        permissions = await resolvePermissions(options, credentials, configPath)
      }
    }
    unwatch?.()
    if (background) {
      const { startWorker } = await import('./background.ts')
      await startWorker(options)
      if (options.logLevel !== 'silent') logOutro('Running in the background · kubb studio stop')
      return
    }
    if (!context.onState && signal.aborted && options.logLevel !== 'silent') logOutro('Disconnected')
  } catch (error) {
    if (!(error instanceof PairingCanceledError)) throw error
  } finally {
    unwatch?.()
    events.off('SIGINT', stop)
    events.off('SIGTERM', stop)
  }
}

/**
 * Listens for single keys on a TTY stdin. Raw mode turns Ctrl+C into a key instead of SIGINT, so it
 * is handled here too. Returns the function that restores the terminal, safe to call twice.
 */
export function watchKeys({ onBackground, onStop }: { onBackground: () => void; onStop: () => void }): () => void {
  const stdin = process.stdin
  const onData = (data: Buffer) => {
    const key = data.toString()
    if (key === 'b' || key === 'B') onBackground()
    if (key === '\u0003') onStop()
  }
  stdin.setRawMode(true)
  stdin.on('data', onData)
  stdin.resume()
  let restored = false

  return () => {
    if (restored) return
    restored = true
    stdin.off('data', onData)
    stdin.setRawMode(false)
    stdin.pause()
  }
}

/**
 * Runs a Studio command from its parsed flags: builds the {@link StudioOptions}, prints the intro,
 * and reports the run to telemetry. A failure is printed and sets the exit code instead of throwing.
 */
export async function runStudio(
  values: StudioValues,
  action: (options: StudioOptions) => Promise<unknown>,
  { block = false, json = false }: { block?: boolean; json?: boolean } = {},
): Promise<void> {
  const options: StudioOptions = {
    version,
    configPath: values.config,
    studioUrl: values.url ?? defaultStudioUrl,
    permission: {
      allowRead: values.allowRead ?? false,
      allowReadAst: values.allowReadAst ?? false,
      allowWrite: values.allowWrite ?? false,
      allowConfigEdit: values.allowConfigEdit ?? false,
      allowExec: values.allowExec ?? false,
    },
    autoOpen: values.open ?? true,
    logLevel: values.logLevel,
  }
  const report = trackRun({ command: 'studio', hrStart: process.hrtime() })

  try {
    if (options.logLevel !== 'silent' && !json) {
      logIntro({
        warning: styleText('yellow', 'This feature is still under development, use with caution'),
        block,
      })
    }

    await action(options)

    await report({ status: 'success' })
  } catch (error) {
    await report({ status: 'failed' })
    console.error(toError(error).message)
    process.exitCode = 1
  }
}
