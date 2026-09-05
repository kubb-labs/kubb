import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { KUBB_CONFIG_FILENAME } from '@internals/shared'
import { toError } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'
import { cliReporter, logLevel as logLevelMap } from '@kubb/core'
import {
  createFileStorage,
  createClient,
  defaultStudioUrl,
  InvalidAgentTokenError,
  PairingCanceledError,
  pollForPairingToken,
  setStorage,
  startPairing,
} from '@kubb/studio'
import { x } from 'tinyexec'
import type { CommandRunner } from 'gunshi'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import { version } from '../../../package.json'
import type { definition } from '../../commands/studio.ts'
import setupReporters from '../../loggers/utils.ts'
import { canUseTTY, isCIEnvironment, isRichOutput } from '../../utils/env.ts'
import { getConfigs } from '../generate/utils.ts'
import { clearCredentials, type Credentials, getCredentialsPath, getKubbHome, readCredentials, writeCredentials } from './credentials.ts'

const ACTIONS = ['connect', 'login', 'logout', 'status'] as const

export type StudioAction = (typeof ACTIONS)[number]

type Permission = 'allowWrite' | 'allowConfigEdit' | 'allowInput' | 'allowExec'

export type StudioOptions = {
  action: StudioAction
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

/**
 * Opens a URL in the user's browser. Best effort: a failure just means the user follows the
 * printed link instead.
 *
 * `start` is a `cmd.exe` builtin, not an executable on PATH, so Windows runs it through `cmd`.
 * The empty string is the window-title argument `start` expects before the URL.
 */
async function openInBrowser(url: string): Promise<void> {
  try {
    if (process.platform === 'win32') {
      await x('cmd', ['/c', 'start', '', url])
    } else {
      await x(process.platform === 'darwin' ? 'open' : 'xdg-open', [url])
    }
  } catch {}
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
async function login({ studioUrl, autoOpen }: StudioOptions, { signal, previousCredentials }: LoginOptions = {}): Promise<Credentials> {
  const session = await startPairing({ studioUrl, name: path.basename(process.cwd()), hostname: hostname(), signal })

  console.log(`\nOpen ${styleText('cyan', session.verification_uri)} and approve the code ${styleText('bold', session.user_code)}`)

  if (autoOpen) {
    await openInBrowser(session.verification_uri_complete)
  }

  const spinner = isRichOutput() ? prompts.spinner() : null
  spinner?.start('Waiting for approval')

  try {
    const { token, agent } = await pollForPairingToken({ studioUrl, session, signal })
    spinner?.stop(`Paired as ${agent.name}`)

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
    spinner?.stop(error instanceof PairingCanceledError ? 'Pairing canceled' : 'Pairing failed')
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
  const granted: Record<Permission, boolean> = { allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false }
  const answers: Partial<Record<Permission, boolean>> = {}

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
async function loadConfigs(options: StudioOptions): Promise<{ configPath: string; config: Config }> {
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
 * Explains a rejected token to the operator. Never touches stored or environment credentials
 * itself, since a message-only path must not have side effects the caller did not ask for.
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
 * One `kubb studio` connect run: pairing if needed, connecting, and reconnecting with a fresh
 * pairing whenever Studio rejects the token. `connect()` is the module's only entry point; this
 * class exists so the run's mutable state (credentials, whether the Ctrl+C hint already printed,
 * whether it already re-paired once) lives as fields instead of one closed-over `state` object
 * threaded through a `while (true)` loop, the same reasoning behind `@kubb/studio`'s
 * `StudioSession`.
 */
class StudioConnection {
  readonly #options: StudioOptions
  readonly #configPath: string
  readonly #logLevel: number
  readonly #isRich: boolean
  readonly #shutdown = new AbortController()
  readonly #requestShutdown = (): void => this.#shutdown.abort()
  // `bun-types` narrows `process.on`/`process.off` to its own event union, which omits Node's
  // process signal events, so the listener is installed and removed through the plain emitter API.
  readonly #processEvents = process as unknown as NodeJS.EventEmitter

  // Known once `run()` resolves the initial credentials, before anything else reads this field.
  #credentials!: Credentials
  // `envToken` itself never changes, but once a browser login has replaced the credentials, later
  // rejections are no longer about the environment variable and need the paired-again message.
  #usingEnvToken = !!process.env.KUBB_AGENT_TOKEN
  // Whether the "Press Ctrl+C" hint already printed, so a reconnect never repeats it.
  #hinted = false
  // A rejection right after a fresh login means the newly approved token was no good either, so
  // one automatic re-pair is all this ever attempts, whether the rejection lands at startup or
  // once the session is already live. A second one is treated as a hard failure instead of pairing
  // forever.
  #hasReauthenticated = false
  // Resolved by `run()` from the flags and the project's saved answers, before anything reads it.
  #granted!: Record<Permission, boolean>

  constructor(options: StudioOptions, configPath: string) {
    this.#options = options
    this.#configPath = configPath
    this.#logLevel = logLevelMap[options.logLevel ?? 'info']
    this.#isRich = isRichOutput()
  }

  // One clack gutter block, or the same lines plainly.
  #say(lines: string | Array<string>): void {
    if (this.#isRich) {
      prompts.log.message(lines)
    } else {
      console.log([lines].flat().join('\n'))
    }
  }

  #reportDisconnected(): void {
    if (this.#options.logLevel === 'silent') {
      return
    }
    // `outro` closes the block `intro` opened, so it is not a written line.
    if (this.#isRich) {
      prompts.outro('Disconnected')
    } else {
      console.log('Disconnected')
    }
  }

  /**
   * Connects and streams generation events until the process is stopped or Studio rejects the
   * token.
   *
   * One `AbortController` covers the whole run: it cancels an in-flight pairing poll on Ctrl+C and
   * lets a live token rejection race a shutdown signal, armed once and torn down in `finally` so a
   * retried pairing never leaves behind a duplicate `SIGINT`/`SIGTERM` listener.
   */
  async run(): Promise<void> {
    this.#processEvents.once('SIGINT', this.#requestShutdown)
    this.#processEvents.once('SIGTERM', this.#requestShutdown)

    try {
      this.#credentials = await this.#resolveInitialCredentials()

      this.#granted = await resolvePermissions(this.#options, this.#credentials, this.#configPath, !this.#usingEnvToken)

      this.#printBanner()

      // Each iteration is one connection attempt. It returns once the run is over (a shutdown, or
      // a canceled re-pair) or falls through to try again with whatever credentials are now current.
      while (!(await this.#connectAndWait())) {}
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

    this.#say([
      detail('Studio', styleText('cyan', this.#options.studioUrl)),
      detail('Project', path.basename(process.cwd())),
      detail('Config', path.relative(process.cwd(), this.#configPath) || this.#configPath),
      '',
      styleText('dim', 'Permissions'),
      ...formatPermissionRows(this.#granted),
    ])
  }

  /**
   * Opens one client and waits for whichever comes first: a shutdown signal, or Studio rejecting
   * the token, whether that rejection surfaces from `client.connect()` itself (a startup rejection)
   * or later through `onAuthRequired` (a rejection during background reconnect). Returns whether
   * the run is over.
   */
  async #connectAndWait(): Promise<boolean> {
    const { promise: authRequired, resolve: notifyAuthRequired } = Promise.withResolvers<InvalidAgentTokenError>()

    const client = createClient({
      token: this.#credentials.token,
      studioUrl: this.#options.studioUrl,
      configPath: this.#configPath,
      version: this.#options.version,
      // Reloaded on every generate, so an edit to kubb.config.ts is picked up without reconnecting.
      loadConfig: async () => (await loadConfigs(this.#options)).config,
      client: { kind: 'cli' },
      root: process.cwd(),
      ...this.#granted,
      // Fires once the pool is already stopped, only for a token rejected during background
      // reconnect. A startup rejection is handled below through `client.connect()` itself.
      onAuthRequired: notifyAuthRequired,
      // The loggers `kubb generate` installs, on both emitters, so one place renders the session
      // events and the generations it drives.
      installLogger: async (hooks) => {
        await setupReporters(hooks, { logLevel: this.#logLevel, reporters: [cliReporter] })

        // `client.connect()` resolves once the agent is registered, not once a session is open, so
        // this is the only point that knows the connection is live. Registered after the loggers so
        // it lands under their "Connected to ..." line, and once, since every reconnect fires again.
        hooks.hook('studio:connected', () => {
          if (this.#hinted || this.#options.logLevel === 'silent') {
            return
          }
          this.#hinted = true

          this.#say(styleText('dim', 'Press Ctrl+C to disconnect'))
        })
      },
    })

    try {
      await client.connect()
    } catch (error) {
      if (!(error instanceof InvalidAgentTokenError)) {
        throw error
      }

      client.disconnect()

      return this.#handleStartupRejection(error)
    }

    // `{ once: true }` only removes the listener once the abort event fires, not once this race is
    // settled by the other side, so `settled` drops it either way. Without that, a token rejection
    // that gets reauthenticated leaves one behind on `#shutdown.signal` for every reconnect.
    const settled = new AbortController()
    const shutdownWait = new Promise<{ kind: 'shutdown' }>((resolve) => {
      if (this.#shutdown.signal.aborted) {
        resolve({ kind: 'shutdown' })
        return
      }
      this.#shutdown.signal.addEventListener('abort', () => resolve({ kind: 'shutdown' }), { once: true, signal: settled.signal })
    })
    const authRequiredWait = authRequired.then((error) => ({ kind: 'authRequired' as const, error }))

    const outcome = await Promise.race([shutdownWait, authRequiredWait])

    settled.abort()

    client.disconnect()

    if (outcome.kind === 'shutdown') {
      this.#reportDisconnected()

      return true
    }

    return this.#handleLiveRejection(outcome.error)
  }

  /**
   * Throws when a rejected token cannot be replaced by pairing again: this run already paired once
   * and was rejected anyway, or there is no browser to approve a new pairing with.
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
   * The token was dead before a session ever opened: the agent was deleted in Studio, or the token
   * was revoked. Keeping it only produces 401s on every run, so it is forgotten and paired again.
   * Returns whether the run is over.
   */
  async #handleStartupRejection(error: InvalidAgentTokenError): Promise<boolean> {
    if (this.#usingEnvToken) {
      throw explainRejectedToken(error, 'envToken')
    }

    await clearCredentials()

    this.#assertCanReauthenticate(error)

    console.log(styleText('yellow', `${error.message} Pairing again...`))

    if (!(await this.#reauthenticate())) {
      return true
    }

    this.#usingEnvToken = false

    return false
  }

  /**
   * Studio rejected the token in the background, well after the session was already live. Returns
   * whether the run is over.
   */
  async #handleLiveRejection(error: InvalidAgentTokenError): Promise<boolean> {
    if (this.#usingEnvToken) {
      throw explainRejectedToken(error, 'envToken')
    }

    this.#assertCanReauthenticate(error)

    console.log(styleText('yellow', `${error.message} Studio needs you to approve access again.`))

    // Forget the dead token before pairing again, the same as a rejection at startup: `login`
    // overwrites the file regardless, but a failed re-pair should not leave a rejected token
    // behind for the next run to try again.
    await clearCredentials()

    if (!(await this.#reauthenticate())) {
      this.#reportDisconnected()

      return true
    }

    return false
  }

  /**
   * Re-pairs and stores the resulting credentials. Returns false when the operator canceled it.
   */
  async #reauthenticate(): Promise<boolean> {
    try {
      this.#credentials = await login(this.#options, { signal: this.#shutdown.signal, previousCredentials: this.#credentials })
    } catch (loginError) {
      if (loginError instanceof PairingCanceledError) {
        return false
      }
      throw loginError
    }

    this.#hasReauthenticated = true

    return true
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
async function status(options: StudioOptions): Promise<void> {
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
    allowWrite: remembered.allowWrite === true,
    allowConfigEdit: remembered.allowConfigEdit === true,
    allowInput: remembered.allowInput === true,
    allowExec: remembered.allowExec === true,
  })) {
    console.log(row)
  }
}

/**
 * Runs a `kubb studio` action and reports the outcome to telemetry.
 */
async function run(options: StudioOptions): Promise<void> {
  // The machine secret lives here and pairing binds it, so storage is installed before anything
  // reads `getMachineToken()`, which `startPairing` does, before any client exists.
  setStorage(createFileStorage(path.join(getKubbHome(), 'cache')))

  const hrStart = process.hrtime()
  const report = (status: 'success' | 'failed') => sendTelemetry(buildTelemetryEvent({ command: 'studio', kubbVersion: options.version, hrStart, status }))

  try {
    if (options.logLevel !== 'silent') {
      const banner = `Kubb Studio  ${styleText('dim', `v${options.version}`)}`
      const caution = styleText('yellow', 'This feature is still under development, use with caution')

      if (isRichOutput() && options.action === 'connect') {
        prompts.intro(banner)
        prompts.log.warn(caution)
      } else {
        console.log(banner)
        console.warn(caution)
        console.log()
      }
    }

    switch (options.action) {
      case 'login':
        await login(options)
        break
      case 'logout':
        await clearCredentials()
        console.log('Signed out of Kubb Studio.')
        break
      case 'status':
        await status(options)
        break
      case 'connect':
        await connect(options)
        break
      default:
        throw new Error(`Unknown action "${options.action}", expected one of ${ACTIONS.join(', ')}`)
    }

    await report('success')
  } catch (error) {
    await report('failed')
    console.error(toError(error).message)
    process.exitCode = 1
  }
}

/**
 * Maps the parsed `kubb studio` flags onto {@link run}. Loaded on demand by `index.ts`, so the
 * Studio client stays out of the process for every other command.
 */
export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  await run({
    action: (values.action ?? 'connect') as StudioAction,
    version,
    configPath: values.config,
    studioUrl: values.url ?? defaultStudioUrl,
    permission: {
      allowWrite: values.allowWrite,
      allowConfigEdit: values.allowConfigEdit,
      allowInput: values.allowInput,
      allowExec: values.allowExec,
    },
    autoOpen: values.open,
    logLevel: values.logLevel,
  })
}
