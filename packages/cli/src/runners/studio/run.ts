import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { KUBB_CONFIG_FILENAME } from '@internals/shared'
import { isCIEnvironment, openInBrowser, toError } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'
import { cliReporter, logLevel as logLevelMap } from '@kubb/core'
import {
  createFileStorage,
  type ClientOptions,
  defaultStudioUrl,
  type InvalidAgentTokenError,
  pairAgent,
  PairingCanceledError,
  runConnection,
  setStorage,
} from '@kubb/studio'
import { trackRun } from '../../Telemetry.ts'
import { plainLogger } from '../../loggers/plainLogger.ts'
import setupReporters from '../../loggers/reporters.ts'
import { createSpinner, logBlock, logIntro, logOutro, logTip } from '../../loggers/output.ts'
import { canUseTTY } from '../../utils/env.ts'
import { getConfigs } from '../../config.ts'
import { clearCredentials, type Credentials, getCredentialsPath, getProjectKubbHome, readCredentials, writeCredentials } from './credentials.ts'
import { version } from '../../../package.json'

type Permission = 'allowRead' | 'allowWrite' | 'allowConfigEdit' | 'allowExec'

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
  permission: Record<Permission, boolean>
  /**
   * Whether to open the approval page in a browser during pairing.
   */
  autoOpen: boolean
  logLevel?: CLIOptions['logLevel']
}

export type SnapshotOptions = StudioOptions & {
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
   * Seconds to wait for the job to finish.
   */
  timeout?: number
  /**
   * Print the result as one JSON object instead of a summary.
   */
  json?: boolean
}

type StudioValues = {
  config?: string
  url?: string
  allowRead: boolean
  allowWrite: boolean
  allowConfigEdit: boolean
  allowExec: boolean
  open?: boolean
  logLevel?: CLIOptions['logLevel']
}

export function createStudioOptions(values: StudioValues): StudioOptions {
  return {
    version,
    configPath: values.config,
    studioUrl: values.url ?? defaultStudioUrl,
    permission: {
      allowRead: values.allowRead,
      allowWrite: values.allowWrite,
      allowConfigEdit: values.allowConfigEdit,
      allowExec: values.allowExec,
    },
    autoOpen: values.open ?? true,
    logLevel: values.logLevel,
  }
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

  try {
    const { token, agent } = await pairAgent({
      studioUrl,
      type: 'cli',
      name: path.basename(process.cwd()),
      hostname: hostname(),
      signal,
      onCode: (session) => {
        console.log(`\nOpen ${styleText('cyan', session.verification_uri)} and approve the code ${styleText('bold', session.user_code)}`)

        if (autoOpen) {
          openInBrowser(session.verification_uri_complete)
        }

        spinner.start('Waiting for approval')
        waiting = true
      },
      onRetry: (error) => spinner.message(`Could not reach Kubb Studio, retrying: ${error.message}`),
    })
    spinner.stop(`Paired as ${agent.name}`)

    const keepsIdentity = previousCredentials?.studioUrl === studioUrl && previousCredentials.agentId === agent.id
    const credentials: Credentials = {
      studioUrl,
      token,
      agentId: agent.id,
      agentSlug: agent.slug,
      ...(keepsIdentity && previousCredentials?.projects ? { projects: previousCredentials.projects } : {}),
    }
    await writeCredentials(credentials)

    console.log(`Credentials stored in ${getCredentialsPath()}`)

    return credentials
  } catch (error) {
    if (waiting) {
      spinner.stop(error instanceof PairingCanceledError ? 'Pairing canceled' : 'Pairing failed')
    }
    throw error
  }
}

/**
 * What each permission is asked as, in the order the questions appear.
 */
const PERMISSIONS: ReadonlyArray<{
  key: Permission
  /**
   * Short label for status output and the connect summary.
   */
  label: string
  question: (project: string, configPath: string) => string
}> = [
  {
    key: 'allowRead',
    label: 'read generated files',
    question: () => 'Let Kubb Studio read the files a generation produced?',
  },
  { key: 'allowWrite', label: 'write generated files', question: (project) => `Let Kubb Studio write generated files into ${project}?` },
  {
    key: 'allowConfigEdit',
    label: 'edit kubb.config.ts',
    question: (_project, configPath) => `Let Kubb Studio change plugin options in ${configPath}?`,
  },
  {
    key: 'allowExec',
    label: 'run formatter, linter, postGenerate',
    question: () => 'Let Kubb Studio run the formatter, the linter, and output.postGenerate?',
  },
]

/**
 * One row per permission, for the connect banner and `kubb studio status`. A list rather than a
 * joined line: four labels this long read as one run-on sentence side by side.
 */
export function formatPermissionRows(granted: Record<Permission, boolean>): Array<string> {
  return PERMISSIONS.map(({ key, label }) => `${granted[key] ? styleText('green', '✔') : styleText('red', '✘')} ${label}`)
}

/**
 * Resolves Studio permissions for the current project.
 * Flags win, saved answers are reused, and new answers are stored unless `persist` is false.
 */
export async function resolvePermissions(
  options: StudioOptions,
  credentials: Credentials,
  configPath: string = KUBB_CONFIG_FILENAME,
  /**
   * Stores new answers in `~/.kubb/credentials.json`.
   * Pass `false` for `KUBB_AGENT_TOKEN` sessions so a temporary token is not written back to disk.
   */
  persist = true,
): Promise<Record<Permission, boolean>> {
  const project = process.cwd()
  const remembered = credentials.projects?.[project]
  const granted: Record<Permission, boolean> = { allowRead: false, allowWrite: false, allowConfigEdit: false, allowExec: false }
  const answers: Partial<Record<Permission, boolean>> = {}
  prompts.updateSettings({ withGuide: true })

  for (const { key, question } of PERMISSIONS) {
    if (options.permission[key] || typeof remembered?.[key] === 'boolean') {
      granted[key] = options.permission[key] || remembered?.[key] === true
      continue
    }

    if (isCIEnvironment() || !canUseTTY()) {
      granted[key] = false
      continue
    }

    granted[key] = (await prompts.confirm({ message: question(project, configPath), initialValue: false })) === true
    answers[key] = granted[key]
  }
  if (persist && Object.keys(answers).length) {
    await writeCredentials({
      ...credentials,
      projects: { ...credentials.projects, [project]: { ...remembered, ...answers } },
    })
  }

  return granted
}

/**
 * Loads the project's Kubb config the same way `kubb generate` does.
 * Returns the first config.
 */
export async function loadConfigs(options: StudioOptions): Promise<{ configPath: string; config: Config }> {
  const { configPath, configs } = await getConfigs({ configPath: options.configPath, logLevel: options.logLevel })
  const [config] = configs

  if (!config) {
    throw new Error('Config not defined, create a kubb.config.ts or pass it with --config')
  }

  // `getConfigs` resolves this to an absolute path. Relativized here, once, so the permission
  // prompt and the path Studio receives over the wire both show the project-relative form instead
  // of leaking the local filesystem layout.
  return { configPath: path.relative(process.cwd(), configPath) || configPath, config }
}

/**
 * Why a rejected token could not be recovered automatically: it came from `KUBB_AGENT_TOKEN`, no
 * browser is available to re-pair with, or the token this run already re-paired for was rejected
 * again.
 */
type RejectedTokenReason = 'envToken' | 'nonInteractive' | 'reauthExhausted'

/**
 * Explains a rejected token to the operator. Builds the error and nothing else, so each caller
 * decides what happens to the credentials.
 */
function explainRejectedToken(error: InvalidAgentTokenError, reason: RejectedTokenReason): Error {
  if (reason === 'envToken') {
    return new Error(`${error.message} Pair again and update KUBB_AGENT_TOKEN.`)
  }

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
  const envToken = process.env.KUBB_AGENT_TOKEN
  const stored = envToken ? null : await readCredentials()
  const credentials = await (async () => {
    if (envToken) return { studioUrl: options.studioUrl, token: envToken, agentId: '', agentSlug: '' }
    if (stored?.studioUrl === options.studioUrl) return stored
    if (isCIEnvironment()) {
      throw new Error(`Not paired with ${options.studioUrl}. Set KUBB_AGENT_TOKEN, or run \`kubb studio login\` on a machine with a browser.`)
    }
    return login(options, { signal })
  })()
  const permissions = await resolvePermissions(options, credentials, configPath, !envToken)
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
  let hinted = false
  let reauthenticated = false
  try {
    if (!context.prepared) {
      const { getWorkerStatus } = await import('./background.ts')
      const worker = await getWorkerStatus()
      if (worker.running) throw new Error('This project is running in the background. Run `kubb studio stop` first.')
    }
    const prepared = context.prepared ?? (await prepareConnection(options, signal))
    let { credentials, permissions } = prepared
    const { configPath } = prepared
    await runConnection({
      credentials,
      signal,
      clientOptions: (): Omit<ClientOptions, 'token' | 'onAuthRequired'> => ({
        studioUrl: options.studioUrl,
        configPath,
        version: options.version,
        root: process.cwd(),
        permissions,
        loadConfig: async () => (await loadConfigs(options)).config,
        installLogger: async (hooks) => {
          // The background worker writes to a log file, so it gets the plain logger rather than the
          // animated one. The logger also covers the `studio:*` events and each generation run.
          setupReporters(hooks, {
            logLevel: logLevelMap[options.logLevel ?? 'info'],
            reporters: [cliReporter],
            ...(context.onState ? { logger: plainLogger } : {}),
          })
          hooks.hook('studio:connected', () => {
            if (!hinted && !context.onState && options.logLevel !== 'silent') logBlock(styleText('dim', 'Press Ctrl+C to disconnect'))
            hinted = true
          })
          hooks.hook('studio:ready', async () => {
            await context.onState?.('connected')
            if (!context.onState) logTip()
          })
          hooks.hook('studio:reconnecting', () => context.onState?.('reconnecting'))
        },
      }),
      onTokenRejected: async ({ error, live }) => {
        await context.onState?.('authentication required')
        if (process.env.KUBB_AGENT_TOKEN) throw explainRejectedToken(error, 'envToken')
        if (!live) await clearCredentials()
        if (reauthenticated) throw explainRejectedToken(error, 'reauthExhausted')
        if (context.onState || isCIEnvironment() || !canUseTTY()) throw explainRejectedToken(error, 'nonInteractive')
        console.log(styleText('yellow', live ? `${error.message} Studio needs you to approve access again.` : `${error.message} Pairing again...`))
        if (live) await clearCredentials()
        try {
          credentials = await login(options, { signal, previousCredentials: credentials })
        } catch (error) {
          if (error instanceof PairingCanceledError) {
            if (live && options.logLevel !== 'silent') logOutro('Disconnected')
            return null
          }
          throw error
        }
        reauthenticated = true
        permissions = await resolvePermissions(options, credentials, configPath, !process.env.KUBB_AGENT_TOKEN)
        return credentials
      },
    })
    if (!context.onState && signal.aborted && options.logLevel !== 'silent') logOutro('Disconnected')
  } catch (error) {
    if (!(error instanceof PairingCanceledError)) throw error
  } finally {
    events.off('SIGINT', stop)
    events.off('SIGTERM', stop)
  }
}

/**
 * Runs a Studio command with shared setup and telemetry reporting.
 */
export async function run(options: StudioOptions, action: () => Promise<unknown>, { block = false, json = false } = {}): Promise<void> {
  // The machine secret lives here and pairing binds it, so storage is installed before anything
  // reads `getMachineToken()`, which `startPairing` does, before any client exists.
  setStorage(createFileStorage(getProjectKubbHome()))

  const report = trackRun({ command: 'studio', hrStart: process.hrtime() })

  try {
    if (options.logLevel !== 'silent' && !json) {
      logIntro({
        warning: styleText('yellow', 'This feature is still under development, use with caution'),
        block,
      })
    }

    await action()

    await report({ status: 'success' })
  } catch (error) {
    await report({ status: 'failed' })
    console.error(toError(error).message)
    process.exitCode = 1
  }
}
