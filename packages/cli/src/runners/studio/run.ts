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
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import setupReporters from '../../loggers/utils.ts'
import { createSpinner, logBlock, logIntro, logOutro, logTip } from '../../loggers/output.ts'
import { canUseTTY } from '../../utils/env.ts'
import { getConfigs } from '../generate/utils.ts'
import { clearCredentials, type Credentials, getCredentialsPath, getProjectKubbHome, readCredentials, writeCredentials } from './credentials.ts'
import { version } from '../../../package.json'

type Permission = 'allowRead' | 'allowWrite' | 'allowConfigEdit' | 'allowInput' | 'allowExec'

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
  /**
   * Identity of another CI agent whose latest snapshot this one is also compared with. Falls back
   * to the base branch CI auto-detection finds.
   */
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
  allowInput: boolean
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
      allowInput: values.allowInput,
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
    key: 'allowInput',
    label: 'use a Studio spec',
    question: () => 'Let Kubb Studio generate from an OpenAPI spec it sends, instead of the one on disk?',
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
  const granted: Record<Permission, boolean> = { allowRead: false, allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false }
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

/**
 * One `kubb studio` connect run: pairing if needed, connecting, and pairing again whenever Studio
 * rejects the token. Reached through `connect()`, which is what the command runs.
 */
class StudioConnection {
  readonly #options: StudioOptions
  readonly #configPath: string
  readonly #shutdown = new AbortController()
  readonly #requestShutdown = (): void => this.#shutdown.abort()
  // `bun-types` narrows `process.on`/`process.off` to its own event union, which omits Node's
  // process signal events, so the listener is installed and removed through the plain emitter API.
  readonly #processEvents = process as unknown as NodeJS.EventEmitter

  // Known once `run()` resolves the initial credentials, before anything else reads this field.
  #credentials!: Credentials
  // Whether the "Press Ctrl+C" hint already printed, so a reconnect never repeats it.
  #hinted = false
  // One automatic re-pair per run, whether the rejection lands at startup or once the session is
  // live. A token rejected right after a fresh login is a hard failure, not a reason to keep
  // pairing.
  #hasReauthenticated = false
  // Resolved by `run()` from the flags and the project's saved answers, before anything reads it.
  #granted!: Record<Permission, boolean>

  constructor(options: StudioOptions, configPath: string) {
    this.#options = options
    this.#configPath = configPath
  }

  #reportDisconnected(): void {
    if (this.#options.logLevel === 'silent') {
      return
    }

    logOutro('Disconnected')
  }

  /**
   * Connects and streams generation events until the process is stopped or Studio rejects the
   * token.
   *
   * One `AbortController` covers the whole run: it cancels an in-flight pairing poll on Ctrl+C and
   * ends the wait in `#connectAndWait`. Its signal listeners are armed once here, so a retried
   * pairing cannot leave a duplicate behind.
   */
  async run(): Promise<void> {
    this.#processEvents.once('SIGINT', this.#requestShutdown)
    this.#processEvents.once('SIGTERM', this.#requestShutdown)

    try {
      this.#credentials = await this.#resolveInitialCredentials()

      this.#granted = await resolvePermissions(this.#options, this.#credentials, this.#configPath, !process.env.KUBB_AGENT_TOKEN)

      this.#printBanner()

      const outcome = await runConnection({
        credentials: this.#credentials,
        signal: this.#shutdown.signal,
        clientOptions: () => this.#clientOptions(),
        onTokenRejected: ({ error, live }) => this.#handleRejection(error, live),
      })

      if (outcome === 'shutdown') {
        this.#reportDisconnected()
      }
    } catch (error) {
      // Canceling the very first pairing (before anything was ever connected) is Ctrl+C working as
      // intended, not a failure to report.
      if (error instanceof PairingCanceledError) {
        return
      }

      throw error
    } finally {
      this.#processEvents.off('SIGINT', this.#requestShutdown)
      this.#processEvents.off('SIGTERM', this.#requestShutdown)
    }
  }

  async #resolveInitialCredentials(): Promise<Credentials> {
    const envToken = process.env.KUBB_AGENT_TOKEN
    const stored = envToken ? null : await readCredentials()

    // A credential is only reused for the Studio it was issued by, so switching `--url` re-pairs
    // instead of sending one instance's token to another.
    const resolved = envToken
      ? { studioUrl: this.#options.studioUrl, token: envToken, agentId: '', agentSlug: '' }
      : stored?.studioUrl === this.#options.studioUrl
        ? stored
        : null

    if (resolved) {
      return resolved
    }

    if (isCIEnvironment()) {
      throw new Error(`Not paired with ${this.#options.studioUrl}. Set KUBB_AGENT_TOKEN, or run \`kubb studio login\` on a machine with a browser.`)
    }

    return login(this.#options, { signal: this.#shutdown.signal })
  }

  #printBanner(): void {
    if (this.#options.logLevel === 'silent') {
      return
    }

    const detail = (label: string, value: string) => `${styleText('dim', label.padEnd(7))}  ${value}`

    logBlock([
      detail('Studio', styleText('cyan', this.#options.studioUrl)),
      detail('Project', path.basename(process.cwd())),
      detail('Config', path.relative(process.cwd(), this.#configPath) || this.#configPath),
      '',
      styleText('dim', 'Permissions'),
      ...formatPermissionRows(this.#granted),
    ])
  }

  /**
   * What every connection attempt opens with. Rebuilt per attempt, so a re-pair that changed the
   * granted permissions takes effect on the next one.
   */
  #clientOptions(): Omit<ClientOptions, 'token' | 'onAuthRequired'> {
    return {
      studioUrl: this.#options.studioUrl,
      configPath: this.#configPath,
      version: this.#options.version,
      // Reloaded on every generate, so an edit to kubb.config.ts is picked up without reconnecting.
      loadConfig: async () => (await loadConfigs(this.#options)).config,
      root: process.cwd(),
      permissions: this.#granted,
      // The loggers `kubb generate` installs, so one place renders the session events and the
      // generations it drives.
      installLogger: async (hooks) => {
        await setupReporters(hooks, { logLevel: logLevelMap[this.#options.logLevel ?? 'info'], reporters: [cliReporter] })

        // `client.connect()` resolves once the agent is registered, not once a session is open, so
        // this is the only point that knows the connection is live. Registered after the loggers so
        // it lands under their "Connected to ..." line, and once, since every reconnect fires again.
        hooks.hook('studio:connected', () => {
          if (this.#hinted || this.#options.logLevel === 'silent') {
            return
          }
          this.#hinted = true

          logBlock(styleText('dim', 'Press Ctrl+C to disconnect'))
        })
        // Registered after the CLI reporter so the tip is printed immediately before its
        // "Ready to receive jobs" spinner when the Studio session becomes ready.
        hooks.hook('studio:ready', () => {
          logTip()
        })
      },
    }
  }

  /**
   * Throws when a rejected token cannot be replaced by pairing again: this run already paired once
   * and was rejected anyway, or there is no browser to approve a new pairing.
   */
  #assertCanReauthenticate(error: InvalidAgentTokenError): void {
    if (this.#hasReauthenticated) {
      throw explainRejectedToken(error, 'reauthExhausted')
    }

    if (isCIEnvironment() || !canUseTTY()) {
      throw explainRejectedToken(error, 'nonInteractive')
    }
  }

  /**
   * Studio rejected the token, either before a session ever opened or once one was already live.
   * Keeping a rejected token only produces 401s on every run, so it is forgotten and paired again.
   * Returns the credential to reconnect with, or null when the run is over.
   */
  async #handleRejection(error: InvalidAgentTokenError, live: boolean): Promise<Credentials | null> {
    // An operator-supplied token is never replaced automatically.
    if (process.env.KUBB_AGENT_TOKEN) {
      throw explainRejectedToken(error, 'envToken')
    }

    // A token dead at startup is forgotten either way. A live one is only forgotten once this run
    // knows it can pair again, so a CI run keeps the credential it could not replace.
    if (!live) {
      await clearCredentials()
    }

    this.#assertCanReauthenticate(error)

    console.log(styleText('yellow', live ? `${error.message} Studio needs you to approve access again.` : `${error.message} Pairing again...`))

    if (live) {
      await clearCredentials()
    }

    const credentials = await this.#reauthenticate()

    // Nothing was ever connected at startup, so there is no session to report the end of.
    if (!credentials && live) {
      this.#reportDisconnected()
    }

    return credentials
  }

  /**
   * Re-pairs and stores the resulting credentials. Returns null when the operator canceled it.
   */
  async #reauthenticate(): Promise<Credentials | null> {
    try {
      this.#credentials = await login(this.#options, { signal: this.#shutdown.signal, previousCredentials: this.#credentials })
    } catch (loginError) {
      if (loginError instanceof PairingCanceledError) {
        return null
      }
      throw loginError
    }

    this.#hasReauthenticated = true

    // The approved agent may be a different identity, whose saved permissions did not carry
    // forward. Resolving again asks for whatever this credential does not already hold, instead
    // of handing the new agent what the previous one was granted.
    this.#granted = await resolvePermissions(this.#options, this.#credentials, this.#configPath, !process.env.KUBB_AGENT_TOKEN)

    return this.#credentials
  }
}

/**
 * Connects this project to Studio and streams generation events until the process is stopped or
 * Studio rejects the token.
 */
export async function connect(options: StudioOptions): Promise<void> {
  // Resolved before any network call to Studio (pairing included), so a project with no config
  // fails fast instead of starting a device-authorization flow it can never use.
  const { configPath } = await loadConfigs(options)

  await new StudioConnection(options, configPath).run()
}

/**
 * Reports the paired agent and any saved permissions for the current project.
 */
export async function status(options: StudioOptions): Promise<void> {
  const credentials = await readCredentials()

  if (!credentials) {
    console.log('Not paired. Run `kubb studio login`.')

    return
  }

  console.log(`Paired with ${credentials.studioUrl} as ${styleText('cyan', credentials.agentSlug || credentials.agentId)}`)

  if (credentials.studioUrl !== options.studioUrl) {
    console.log(styleText('yellow', `Connecting to ${options.studioUrl} needs pairing again.`))
  }

  const remembered = credentials.projects?.[process.cwd()]

  if (!remembered) {
    console.log(styleText('dim', 'No saved permissions for this project. Run `kubb studio` to connect and choose.'))

    return
  }

  console.log(styleText('dim', 'Saved permissions'))

  for (const row of formatPermissionRows({
    allowRead: remembered.allowRead === true,
    allowWrite: remembered.allowWrite === true,
    allowConfigEdit: remembered.allowConfigEdit === true,
    allowInput: remembered.allowInput === true,
    allowExec: remembered.allowExec === true,
  })) {
    console.log(row)
  }
}

/**
 * Runs a Studio command with shared setup and telemetry reporting.
 */
export async function run(options: StudioOptions, action: () => Promise<unknown>, { block = false, json = false } = {}): Promise<void> {
  // The machine secret lives here and pairing binds it, so storage is installed before anything
  // reads `getMachineToken()`, which `startPairing` does, before any client exists.
  setStorage(createFileStorage(getProjectKubbHome()))

  const hrStart = process.hrtime()
  const report = (status: 'success' | 'failed') => sendTelemetry(buildTelemetryEvent({ command: 'studio', kubbVersion: options.version, hrStart, status }))

  try {
    if (options.logLevel !== 'silent' && !json) {
      logIntro({
        warning: styleText('yellow', 'This feature is still under development, use with caution'),
        block,
      })
    }

    await action()

    await report('success')
  } catch (error) {
    await report('failed')
    console.error(toError(error).message)
    process.exitCode = 1
  }
}
