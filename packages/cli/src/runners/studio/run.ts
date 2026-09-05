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
type RejectedTokenReason = 'envToken' | 'nonInteractive' | 'exhausted'

/**
 * Explains a rejected token to the operator. Never touches stored or environment credentials
 * itself, since a message-only path must not have side effects the caller did not ask for.
 */
function explainRejectedToken(error: InvalidAgentTokenError, reason: RejectedTokenReason): Error {
  if (reason === 'envToken') {
    return new Error(`${error.message} Pair again and update KUBB_AGENT_TOKEN.`)
  }

  if (reason === 'exhausted') {
    return new Error(`${error.message} Studio rejected the newly approved token too. Run \`kubb studio login\` and try again.`)
  }

  return new Error(`${error.message} Run \`kubb studio login\` to pair again.`)
}

/**
 * Connects this project to Studio and streams generation events until the process is stopped or
 * Studio rejects the token.
 *
 * One `AbortController` covers the whole call: it cancels an in-flight pairing poll on Ctrl+C and
 * lets a live token rejection race a shutdown signal, armed once and torn down in `finally` so a
 * retried pairing never leaves behind a duplicate `SIGINT`/`SIGTERM` listener.
 */
export async function connect(options: StudioOptions): Promise<void> {
  // Resolved before any network call to Studio (pairing included), so a project with no config
  // fails fast instead of starting a device-authorization flow it can never use.
  const { configPath } = await loadConfigs(options)

  const shutdown = new AbortController()
  const requestShutdown = () => shutdown.abort()
  // `bun-types` narrows `process.on`/`process.off` to its own event union, which omits Node's
  // process signal events, so the listener is installed and removed through the plain emitter API.
  const processEvents = process as unknown as NodeJS.EventEmitter
  processEvents.once('SIGINT', requestShutdown)
  processEvents.once('SIGTERM', requestShutdown)

  const logLevel = logLevelMap[options.logLevel ?? 'info']
  const isRich = isRichOutput()
  // One clack gutter block, or the same lines plainly.
  const say = (lines: string | Array<string>) => (isRich ? prompts.log.message(lines) : console.log([lines].flat().join('\n')))
  const reportDisconnected = () => {
    if (options.logLevel === 'silent') {
      return
    }
    // `outro` closes the block `intro` opened, so it is not a written line.
    if (isRich) {
      prompts.outro('Disconnected')
    } else {
      console.log('Disconnected')
    }
  }

  try {
    const envToken = process.env.KUBB_AGENT_TOKEN
    const stored = envToken ? null : await readCredentials()

    const initialCredentials: Credentials = await (async () => {
      // A credential is only reused for the Studio it was issued by, so switching `--url` re-pairs
      // instead of sending one instance's token to another.
      const resolved = envToken
        ? { studioUrl: options.studioUrl, token: envToken, agentId: '', agentSlug: '' }
        : stored?.studioUrl === options.studioUrl
          ? stored
          : null

      if (resolved) {
        return resolved
      }

      if (isCIEnvironment()) {
        throw new Error(`Not paired with ${options.studioUrl}. Set KUBB_AGENT_TOKEN, or run \`kubb studio login\` on a machine with a browser.`)
      }

      return login(options, { signal: shutdown.signal })
    })()

    // Everything the reconnect loop below mutates, on one object instead of separate `let`s: state.
    const state = {
      credentials: initialCredentials,
      // `envToken` itself never changes, but once a browser login has replaced the credentials,
      // later rejections are no longer about the environment variable and need the paired-again message.
      usingEnvToken: !!envToken,
      // Whether the "Press Ctrl+C" hint already printed, so a reconnect never repeats it.
      hinted: false,
      // A rejection right after a fresh login means the newly approved token was no good either, so
      // one automatic re-pair is all this ever attempts, whether the rejection lands at startup or
      // once the session is already live. A second one is treated as a hard failure instead of
      // pairing forever.
      hasReauthenticated: false,
    }

    const { allowWrite, allowConfigEdit, allowInput, allowExec } = await resolvePermissions(options, state.credentials, configPath, !state.usingEnvToken)
    const granted = { allowWrite, allowConfigEdit, allowInput, allowExec }

    const detail = (label: string, value: string) => `${styleText('dim', label.padEnd(7))}  ${value}`

    if (options.logLevel !== 'silent') {
      say([
        detail('Studio', styleText('cyan', options.studioUrl)),
        detail('Project', path.basename(process.cwd())),
        detail('Config', path.relative(process.cwd(), configPath) || configPath),
        '',
        styleText('dim', 'Permissions'),
        ...formatPermissionRows(granted),
      ])
    }

    while (true) {
      let notifyAuthRequired: (error: InvalidAgentTokenError) => void = () => {}
      const authRequired = new Promise<InvalidAgentTokenError>((resolve) => {
        notifyAuthRequired = resolve
      })

      const client = createClient({
        token: state.credentials.token,
        studioUrl: options.studioUrl,
        configPath,
        version: options.version,
        // Reloaded on every generate, so an edit to kubb.config.ts is picked up without reconnecting.
        loadConfig: async () => (await loadConfigs(options)).config,
        client: { kind: 'cli' },
        root: process.cwd(),
        ...granted,
        // Fires once the pool is already stopped, only for a token rejected during background
        // reconnect. A startup rejection is handled below through `client.connect()` itself.
        onAuthRequired: notifyAuthRequired,
        // The loggers `kubb generate` installs, on both emitters, so one place renders the session
        // events and the generations it drives.
        installLogger: async (hooks) => {
          await setupReporters(hooks, { logLevel, reporters: [cliReporter] })

          // `client.connect()` resolves once the agent is registered, not once a session is open, so
          // this is the only point that knows the connection is live. Registered after the loggers so
          // it lands under their "Connected to ..." line, and once, since every reconnect fires again.
          hooks.hook('studio:connected', () => {
            if (state.hinted || options.logLevel === 'silent') {
              return
            }
            state.hinted = true

            say(styleText('dim', 'Press Ctrl+C to disconnect'))
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

        // The token is dead: the agent was deleted in Studio, or the token was revoked. Keeping it
        // only produces 401s on every run, so forget it and pair again.
        if (state.usingEnvToken) {
          throw explainRejectedToken(error, 'envToken')
        }

        await clearCredentials()

        if (state.hasReauthenticated) {
          throw explainRejectedToken(error, 'exhausted')
        }

        if (isCIEnvironment() || !canUseTTY()) {
          throw explainRejectedToken(error, 'nonInteractive')
        }

        console.log(styleText('yellow', `${error.message} Pairing again...`))

        try {
          state.credentials = await login(options, { signal: shutdown.signal, previousCredentials: state.credentials })
        } catch (loginError) {
          if (loginError instanceof PairingCanceledError) {
            return
          }
          throw loginError
        }

        state.usingEnvToken = false
        state.hasReauthenticated = true

        continue
      }

      // Connected. Whichever comes first wins: a shutdown signal, or Studio rejecting the token
      // while reconnecting in the background, well after this session was already live.
      const shutdownWait = new Promise<{ kind: 'shutdown' }>((resolve) => {
        if (shutdown.signal.aborted) {
          resolve({ kind: 'shutdown' })
          return
        }
        shutdown.signal.addEventListener('abort', () => resolve({ kind: 'shutdown' }), { once: true })
      })
      const authRequiredWait = authRequired.then((error) => ({ kind: 'authRequired' as const, error }))

      const outcome = await Promise.race([shutdownWait, authRequiredWait])

      client.disconnect()

      if (outcome.kind === 'shutdown') {
        reportDisconnected()

        return
      }

      const { error } = outcome

      if (state.usingEnvToken) {
        throw explainRejectedToken(error, 'envToken')
      }

      if (state.hasReauthenticated) {
        throw explainRejectedToken(error, 'exhausted')
      }

      if (isCIEnvironment() || !canUseTTY()) {
        throw explainRejectedToken(error, 'nonInteractive')
      }

      console.log(styleText('yellow', `${error.message} Studio needs you to approve access again.`))

      // Forget the dead token before pairing again, the same as a rejection at startup: `login`
      // overwrites the file regardless, but a failed re-pair should not leave a rejected token
      // behind for the next run to try again.
      await clearCredentials()

      try {
        state.credentials = await login(options, { signal: shutdown.signal, previousCredentials: state.credentials })
      } catch (loginError) {
        if (loginError instanceof PairingCanceledError) {
          reportDisconnected()

          return
        }
        throw loginError
      }

      state.hasReauthenticated = true
    }
  } catch (error) {
    // Canceling the very first pairing (before anything was ever connected) is Ctrl+C working as
    // intended, not a failure to report.
    if (error instanceof PairingCanceledError) {
      return
    }

    throw error
  } finally {
    processEvents.off('SIGINT', requestShutdown)
    processEvents.off('SIGTERM', requestShutdown)
  }
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
