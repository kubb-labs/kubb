import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { copyToClipboard, isCIEnvironment, openInBrowser } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'
import { cliReporter, Diagnostics, Hookable, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import {
  connectAgent,
  defaultStudioUrl,
  generateAgentKey,
  InvalidAgentTokenError,
  PAIRING_CODE_PREFIX,
  pairAgent,
  PairingCanceledError,
  redeemPairingCode,
} from '@kubb/studio'
import { AgentPermission } from '@kubb/studio/protocol'
import { trackRun } from '../../telemetry.ts'
import { plainWriter } from '../../loggers/plainWriter.ts'
import installReporters from '../../loggers/reporters.ts'
import { logIntro, logOutro, logTip } from '../../ui/intro.ts'
import { logBlock, logStep } from '../../ui/log.ts'
import { createSpinner } from '../../ui/spinner.ts'
import { canUseTTY, isRichOutput } from '../../utils/env.ts'
import { getConfigs } from '../../config.ts'
import { clearCredentials, type Credentials, getCredentialsPath, getMachineId, readCredentials, readPairedStudioUrl, updateCredentials } from './credentials.ts'
import { formatPermissionSummary, resolvePermissions } from './permissions.ts'
import { startTokenRefresher, type TokenRefresher } from './tokenRefresher.ts'
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
  open?: boolean
  logLevel?: CLIOptions['logLevel']
} & Partial<Record<AgentPermission, boolean>>

export type LoginOptions = {
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
  // A retry notice stays on screen a while before the countdown takes the line back.
  let retryUntil = 0
  // The spinner only starts once a code is shown.
  let waiting = false
  let countdown: NodeJS.Timeout | undefined

  try {
    const privateKey = generateAgentKey()
    const { token, agent } = await pairAgent({
      studioUrl,
      type: 'cli',
      name: path.basename(process.cwd()),
      hostname: hostname(),
      machineId: await getMachineId(),
      privateKey,
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
        if (isRichOutput()) countdown = setInterval(() => Date.now() > retryUntil && spinner.message(waitingText()), 1000)
        // Not awaited: the code shows at once, and the spinner picks up the copy when it lands.
        void copyToClipboard(session.user_code).then((done) => {
          copied = done
        })
      },
      onRetry: (error) => {
        retryUntil = Date.now() + 5000
        spinner.message(`Could not reach Kubb Studio, retrying: ${error.message}`)
      },
    })
    clearInterval(countdown)
    spinner.stop(`Paired as ${agent.name}${agent.organizationSlug ? ` · org ${agent.organizationSlug}` : ''}`)

    const paired: Credentials = {
      studioUrl,
      token,
      issuedAt: new Date().toISOString(),
      privateKey,
      agentId: agent.id,
      agentSlug: agent.slug,
      ...(agent.organizationSlug ? { organizationSlug: agent.organizationSlug } : {}),
    }
    const credentials = await updateCredentials((stored) => {
      // Read under the lock, so permissions saved while the pairing waited are kept.
      const previous = stored ?? previousCredentials
      const keepsIdentity = previous?.studioUrl === studioUrl && previous.agentId === agent.id
      return { ...paired, ...(keepsIdentity && previous.projects ? { projects: previous.projects } : {}) }
    })

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

/**
 * The environment variable an MCP client sets to a one-time pairing code from `kubb_studio_connect`.
 * It is read from the environment, so the code never shows in the process list.
 */
export const PAIRING_CODE_ENV = 'KUBB_STUDIO_PAIRING_CODE'

/**
 * Takes the pairing code out of the environment, so a background worker, a reconnect, or a child
 * process never sends a spent code again. Resolves `undefined` when none is set.
 */
export function takePairingCode(): string | undefined {
  const code = process.env[PAIRING_CODE_ENV]?.trim()
  delete process.env[PAIRING_CODE_ENV]
  if (!code) return undefined
  if (!code.startsWith(PAIRING_CODE_PREFIX)) {
    // The value is not echoed: it may be a secret set in the wrong variable.
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `${PAIRING_CODE_ENV} is not a Kubb Studio pairing code. Codes start with \`${PAIRING_CODE_PREFIX}\`.`,
      help: 'Ask the MCP client for a new code with the kubb_studio_connect tool.',
    })
  }
  return code
}

/**
 * Pairs this machine with a one-time code from an MCP client and stores the token. No person
 * approves it and no browser opens. Studio answers at once, so a refused code fails the run.
 */
export async function redeemPairing(
  { studioUrl }: Pick<StudioOptions, 'studioUrl'>,
  { pairingCode, signal }: { pairingCode: string; signal?: AbortSignal },
): Promise<Credentials> {
  const privateKey = generateAgentKey()
  const { token, agent, expiresIn } = await redeemPairingCode({
    studioUrl,
    pairingCode,
    name: path.basename(process.cwd()),
    machineId: await getMachineId(),
    privateKey,
    signal,
  })
  const issuedAt = Date.now()
  const paired: Credentials = {
    studioUrl,
    token,
    issuedAt: new Date(issuedAt).toISOString(),
    expiresAt: new Date(issuedAt + expiresIn * 1000).toISOString(),
    pairedWith: 'code',
    privateKey,
    agentId: agent.id,
    agentSlug: agent.slug,
    ...(agent.organizationSlug ? { organizationSlug: agent.organizationSlug } : {}),
  }
  // Pairing again from the same client and machine finds the same agent, so its saved permissions carry forward.
  const credentials = await updateCredentials((stored) => {
    const keepsIdentity = stored?.studioUrl === studioUrl && stored.agentId === agent.id
    return { ...paired, ...(keepsIdentity && stored.projects ? { projects: stored.projects } : {}) }
  })

  logStep(`Paired as ${agent.name}${agent.organizationSlug ? ` · org ${agent.organizationSlug}` : ''} with a pairing code`)
  console.log(`Credentials stored in ${getCredentialsPath()}`)

  return credentials
}

/** Time left on a pairing code as `m:ss`, never below `0:00`. */
function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000))

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * Loads the project's Kubb config the same way `kubb generate` does, one entry per `defineConfig(...)` entry.
 */
export async function loadConfigs(options: Pick<StudioOptions, 'configPath' | 'logLevel'>): Promise<{ configPath: string; configs: Array<Config> }> {
  const { configPath, configs } = await getConfigs({ configPath: options.configPath, logLevel: options.logLevel })

  if (!configs.length) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: 'Config not defined, create a kubb.config.ts or pass it with --config',
    })
  }

  // `getConfigs` resolves this to an absolute path. Relativized here, once, so the permission
  // prompt and the path Studio receives over the wire both show the project-relative form instead
  // of leaking the local filesystem layout.
  return { configPath: path.relative(process.cwd(), configPath) || configPath, configs }
}

export type PreparedConnection = {
  configPath: string
  credentials: Credentials
  permissions: StudioOptions['permission']
}

/** Validates the project and resolves pairing and permissions before starting its worker. */
export async function prepareConnection(options: StudioOptions, signal?: AbortSignal): Promise<PreparedConnection> {
  const { configPath } = await loadConfigs(options)
  const pairingCode = takePairingCode()
  const stored = pairingCode ? null : await readCredentials()
  const credentials = await (async () => {
    // A pairing code is a fresh request to pair, so it wins over a stored pairing.
    if (pairingCode) return redeemPairing(options, { pairingCode, signal })
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
  const permissions = await resolveConnectionPermissions(options, credentials, configPath)
  return { configPath, credentials, permissions }
}

/**
 * An agent paired with a code runs with no person to answer, so only the flags grant permissions,
 * such as `--allow-write` alone for a factory. Any other agent asks once per project.
 */
function resolveConnectionPermissions(options: StudioOptions, credentials: Credentials, configPath: string): Promise<StudioOptions['permission']> {
  if (credentials.pairedWith === 'code') return Promise.resolve({ ...options.permission })
  return resolvePermissions(options, credentials, configPath)
}

export type WorkerState = 'starting' | 'connected' | 'reconnecting' | 'authentication required' | 'stopped'

/** Runs the same project connection in the foreground or in a background worker. */
export async function connect(
  options: StudioOptions,
  context: {
    prepared?: PreparedConnection
    signal?: AbortSignal
    onState?: (state: WorkerState) => void | Promise<void>
    onCredentials?: (credentials: Credentials) => void
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
  let refresher: TokenRefresher | undefined
  try {
    if (!context.prepared) await assertNoBackgroundWorker()
    const prepared = context.prepared ?? (await prepareConnection(options, signal))
    let { credentials, permissions } = prepared
    const { configPath } = prepared
    let hinted = false
    // Set by a fresh pairing until it connects, so a token rejected right after approval fails the run instead of looping.
    let pairedAgain = false
    let recovered = false

    refresher = await startTokenRefresher({
      studioUrl: options.studioUrl,
      signal,
      warn: (message) => options.logLevel !== 'silent' && console.log(styleText('yellow', message)),
      credentials: {
        get: () => credentials,
        set: (next) => {
          credentials = next
          context.onCredentials?.(credentials)
        },
      },
    })

    // The background worker writes to a log file, so it gets the plain logger rather than the
    // animated one. The logger also covers the `studio:*` events and each generation run.
    const hooks = new Hookable<KubbHooks>()
    installReporters({
      hooks,
      logLevel: logLevelMap[options.logLevel ?? 'info'],
      reporters: [cliReporter],
      ...(context.onState ? { writer: plainWriter } : {}),
    })
    // `b` hands the session to the background worker; only a foreground run in a terminal listens.
    const listens = !context.onState && process.stdin.isTTY === true && canUseTTY()
    let background = false
    hooks.hook('studio:connected', async () => {
      pairedAgain = false
      recovered = false
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
      logConnected({ agentId: credentials.agentId, permissions, listens })
    })
    hooks.hook('studio:reconnecting', () => context.onState?.('reconnecting'))

    while (true) {
      try {
        await connectAgent({
          token: () => credentials.token,
          privateKey: credentials.privateKey,
          studioUrl: options.studioUrl,
          configPath,
          version: options.version,
          root: process.cwd(),
          agentType: 'cli',
          permissions,
          debug: options.logLevel === 'verbose',
          loadConfigs: async () => (await loadConfigs(options)).configs,
          hooks,
          signal,
        })
        break
      } catch (error) {
        if (!(error instanceof InvalidAgentTokenError)) throw error
        // The answer to an earlier refresh may have been lost, so the token is traded in once more.
        if (!recovered && !pairedAgain) {
          recovered = true
          if (await refresher.refresh({ force: true })) continue
        }
        await context.onState?.('authentication required')
        await clearCredentials(credentials.token)
        // A spent code cannot be redeemed again, and no person is there to approve a browser pairing.
        if (credentials.pairedWith === 'code') throw refused(error.message, 'Ask the MCP client for a new pairing code.')
        const loginCommand = loginCommandFor(options.studioUrl)
        if (pairedAgain) throw refused(`${error.message} Studio rejected the newly approved token too.`, `Run \`${loginCommand}\` and try again.`)
        if (context.onState || isCIEnvironment() || !canUseTTY()) throw refused(error.message, `Run \`${loginCommand}\` to pair again.`)

        // The pairing prompts need stdin back.
        unwatch?.()
        unwatch = undefined
        console.log(styleText('yellow', `${error.message} Pairing again...`))
        credentials = await login(options, { signal, previousCredentials: credentials })
        context.onCredentials?.(credentials)
        pairedAgain = true
        permissions = await resolveConnectionPermissions(options, credentials, configPath)
      }
    }
    // Stops the "Ready for jobs" spinner, which would otherwise keep drawing under the closing line.
    await hooks.callHook('kubb:lifecycle:end')
    unwatch?.()
    if (background) return await handOffToWorker(options)
    if (!context.onState && signal.aborted && options.logLevel !== 'silent') logOutro('Disconnected')
  } catch (error) {
    if (!(error instanceof PairingCanceledError)) throw error
  } finally {
    refresher?.stop()
    // A refreshed token is the only one Studio still accepts, so it reaches disk before the run ends.
    await refresher?.written()
    unwatch?.()
    events.off('SIGINT', stop)
    events.off('SIGTERM', stop)
  }
}

/** Starts the background worker for this project after `b` ends the foreground session. */
async function handOffToWorker(options: StudioOptions): Promise<void> {
  const { startWorker } = await import('./background.ts')
  await startWorker(options, () => prepareConnection(options))
  if (options.logLevel !== 'silent') logOutro('Running in the background · kubb studio stop')
}

/** Refuses a foreground run while the background worker owns this project. */
async function assertNoBackgroundWorker(): Promise<void> {
  const { getWorkerStatus } = await import('./background.ts')
  if (!(await getWorkerStatus()).running) return
  throw new Diagnostics.Error({
    code: Diagnostics.code.unknown,
    severity: 'error',
    message: 'This project is running in the background. Run `kubb studio stop` first.',
  })
}

/** The cleared credentials take the paired URL with them, so a hint names a self-hosted Studio. */
function loginCommandFor(studioUrl: string): string {
  return studioUrl === defaultStudioUrl ? 'kubb studio login' : `kubb studio login --url ${studioUrl}`
}

function refused(message: string, help: string): Error {
  return new Diagnostics.Error({ code: Diagnostics.code.studioRefused, severity: 'error', message, help })
}

/** Prints the agent ID, the project, and its permissions once, after the first connect. */
function logConnected({ agentId, permissions, listens }: { agentId: string; permissions: StudioOptions['permission']; listens: boolean }): void {
  logBlock([
    // An MCP client passes this ID to `kubb_studio_generate`.
    `${styleText('dim', 'Agent ID')}  ${agentId}`,
    `${styleText('dim', 'Project')}  ${path.basename(process.cwd())}   ${styleText('dim', formatPermissionSummary(permissions))}`,
    styleText('dim', listens ? 'Press b to keep running in the background, Ctrl+C to disconnect' : 'Press Ctrl+C to disconnect'),
  ])
  logTip()
}

/**
 * Listens for single keys on a TTY stdin. Raw mode turns Ctrl+C into a key instead of SIGINT, so it
 * is handled here too. Returns the function that restores the terminal, safe to call twice.
 */
function watchKeys({ onBackground, onStop }: { onBackground: () => void; onStop: () => void }): () => void {
  const stdin = process.stdin
  const onData = (data: Buffer) => {
    const key = data.toString()
    if (key === 'b' || key === 'B') onBackground()
    if (key === '\u0003') onStop()
  }
  // A clack spinner reads stdin too and exits the process on Ctrl+C, before the session can close
  // its socket, so its Ctrl+C alias is lifted while these keys are read.
  const cancelAlias = prompts.settings.aliases.get('\u0003')
  prompts.settings.aliases.delete('\u0003')
  stdin.setRawMode(true)
  stdin.on('data', onData)
  stdin.resume()
  let restored = false

  return () => {
    if (restored) return
    restored = true
    if (cancelAlias) prompts.settings.aliases.set('\u0003', cancelAlias)
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
    // Without `--url`, a project keeps talking to the Studio it paired with.
    studioUrl: values.url ?? (await readPairedStudioUrl()) ?? defaultStudioUrl,
    permission: Object.fromEntries(Object.values(AgentPermission).map((key) => [key, values[key] ?? false])) as Record<AgentPermission, boolean>,
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
    console.error(Diagnostics.format(Diagnostics.from(error)).join('\n'))
    process.exitCode = 1
  }
}
