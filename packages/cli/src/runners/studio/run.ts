import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { KUBB_CONFIG_FILENAME } from '@internals/shared'
import { toError } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'
import { cliReporter, logLevel as logLevelMap } from '@kubb/core'
import { createFileStorage, createClient, defaultStudioUrl, InvalidAgentTokenError, pollForPairingToken, setStorage, startPairing } from '@kubb/studio'
import { x } from 'tinyexec'
import type { CommandRunner } from 'gunshi'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import { version } from '../../../package.json'
import type { definition } from '../../commands/studio.ts'
import setupReporters from '../../loggers/utils.ts'
import { canUseTTY, isCIEnvironment, isRichOutput } from '../../utils/env.ts'
import { getConfigs } from '../generate/utils.ts'
import { installStudioLogger, writeLine } from './logger.ts'
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

/**
 * Pairs this machine with Studio and stores the resulting token.
 *
 * The CLI holds a code and the browser approves it, rather than the user copying a token out of
 * the UI. The token comes back over the CLI's own HTTPS POST, so it never lands in a URL, a
 * server log, or a `Referer` header.
 */
async function login({ studioUrl, autoOpen }: StudioOptions): Promise<Credentials> {
  const session = await startPairing({ studioUrl, name: path.basename(process.cwd()), hostname: hostname() })

  console.log(`\nOpen ${styleText('cyan', session.verification_uri)} and approve the code ${styleText('bold', session.user_code)}`)

  if (autoOpen) {
    await openInBrowser(session.verification_uri_complete)
  }

  const spinner = canUseTTY() ? prompts.spinner() : null
  spinner?.start('Waiting for approval')

  try {
    const { token, agent } = await pollForPairingToken({ studioUrl, session })
    spinner?.stop(`Paired as ${agent.name}`)

    const credentials: Credentials = { studioUrl, token, agentId: agent.id, agentSlug: agent.slug }
    await writeCredentials(credentials)

    console.log(`Credentials stored in ${getCredentialsPath()}`)

    return credentials
  } catch (error) {
    spinner?.stop('Pairing failed')
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
 * joined line: four labels of this length read as one run-on sentence side by side.
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
 * Returns the first config and the full config array.
 */
async function loadConfigs(options: StudioOptions): Promise<{ configPath: string; config: Config; configs: Array<Config> }> {
  const { configPath, configs } = await getConfigs({ configPath: options.configPath, logLevel: options.logLevel })
  const [config] = configs

  if (!config) {
    throw new Error('Config not defined, create a kubb.config.ts or pass it with --config')
  }

  return { configPath, config, configs }
}

/**
 * Connects this project to Studio and streams generation events until the process is stopped.
 */
async function connect(options: StudioOptions, retryPairing = true): Promise<void> {
  const envToken = process.env.KUBB_AGENT_TOKEN
  const stored = envToken ? null : await readCredentials()

  const credentials: Credentials = await (async () => {
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

    return login(options)
  })()

  const { configPath, configs } = await loadConfigs(options)
  const { allowWrite, allowConfigEdit, allowInput, allowExec } = await resolvePermissions(options, credentials, configPath, !envToken)
  const granted = { allowWrite, allowConfigEdit, allowInput, allowExec }

  const logLevel = logLevelMap[(options.logLevel ?? 'info') as keyof typeof logLevelMap]
  const isRich = isRichOutput()
  // One clack gutter block, or the same lines plainly.
  const say = (lines: string | Array<string>) => (isRich ? prompts.log.message(lines) : console.log([lines].flat().join('\n')))
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

  // Sessions connect without being awaited, so the spinner is what reports the wait. The logger
  // stops it on `studio:connected`, which is why the Ctrl+C hint below can finally be honest.
  const spinner = isRich && options.logLevel !== 'silent' ? prompts.spinner() : undefined
  spinner?.start('Connecting to Kubb Studio')

  const client = createClient({
    token: credentials.token,
    studioUrl: options.studioUrl,
    configPath,
    version: options.version,
    // Reloaded on every generate, so an edit to kubb.config.ts is picked up without reconnecting.
    loadConfig: async () => (await loadConfigs(options)).config,
    client: { kind: 'cli' },
    root: process.cwd(),
    allowWrite,
    allowConfigEdit,
    allowInput,
    allowExec,
    // One function for both emitters: the session events go to the studio logger, and a
    // generation's `kubb:*` events go to the same clack/plain loggers `kubb generate` installs.
    installLogger: async (hooks) => {
      installStudioLogger(hooks, { logLevel, spinner })
      await setupReporters(hooks, { logLevel, reporters: [cliReporter] })
    },
    // The local config bounds what Studio may import. Without this a `generate` payload could name
    // any module in the project's node_modules and the runtime would import it. Union of every
    // config entry's plugins, since Studio edits any entry, not only the one it generates from.
    allowedPlugins: [...new Set(configs.flatMap((entry) => entry.plugins.map((plugin) => plugin.name)))],
  })

  try {
    await client.connect()
  } catch (error) {
    if (!(error instanceof InvalidAgentTokenError)) {
      throw error
    }

    // The token is dead: the agent was deleted in Studio, or the token was revoked. Keeping it
    // only produces 401s on every run, so forget it and pair again.
    if (envToken) {
      throw new Error(`${error.message} Pair again and update KUBB_AGENT_TOKEN.`)
    }

    await clearCredentials()

    if (isCIEnvironment() || !retryPairing) {
      throw new Error(`${error.message} Run \`kubb studio login\` to pair again.`)
    }

    console.log(styleText('yellow', `${error.message} Pairing again...`))

    return connect(options, false)
  }

  if (options.logLevel !== 'silent') {
    say(styleText('dim', 'Press Ctrl+C to disconnect'))
  }

  await new Promise<void>((resolve) => {
    const stop = () => {
      client.disconnect()

      if (options.logLevel !== 'silent') {
        // `outro` closes the block clack's `intro` opened, so it is not the same as a written line.
        if (isRich) {
          prompts.outro('Disconnected')
        } else {
          console.log('Disconnected')
        }
      }

      resolve()
    }

    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
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
  // reads `getMachineToken()` — which `startPairing` does, before any client exists.
  setStorage(createFileStorage(path.join(getKubbHome(), 'cache')))

  const hrStart = process.hrtime()
  const report = (status: 'success' | 'failed') => sendTelemetry(buildTelemetryEvent({ command: 'studio', kubbVersion: options.version, hrStart, status }))

  try {
    if (options.logLevel !== 'silent') {
      if (isRichOutput() && options.action === 'connect') {
        prompts.intro(`Kubb Studio  ${styleText('dim', `v${options.version}`)}`)
      }

      writeLine('warn', styleText('yellow', 'This feature is still under development, use with caution'))
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
