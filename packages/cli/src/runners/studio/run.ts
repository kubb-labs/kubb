import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { KUBB_CONFIG_FILENAME } from '@internals/shared'
import { toError } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'
import { createFileStorage, createClient, defaultStudioUrl, InvalidAgentTokenError, pollForPairingToken, setStorage, startPairing } from '@kubb/studio'
import { x } from 'tinyexec'
import type { CommandRunner } from 'gunshi'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import { version } from '../../../package.json'
import type { definition } from '../../commands/studio.ts'
import { canUseTTY, isCIEnvironment } from '../../utils/env.ts'
import { getConfigs } from '../generate/utils.ts'
import { clearCredentials, type Credentials, getKubbHome, readCredentials, writeCredentials } from './credentials.ts'

const ACTIONS = ['connect', 'login', 'logout', 'status'] as const

export type StudioAction = (typeof ACTIONS)[number]

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
  allowWrite: boolean
  /**
   * Whether Studio may change plugin options in the project's `kubb.config.ts`.
   */
  allowConfigEdit: boolean
  allowInput: boolean
  allowExec: boolean
  /**
   * Whether to open the approval page in a browser during pairing.
   */
  open: boolean
  logLevel?: CLIOptions['logLevel']
}

/**
 * Opens a URL in the user's browser. Best effort: a failure just means the user follows the
 * printed link instead.
 */
async function openInBrowser(url: string): Promise<void> {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'

  try {
    await x(command, [url])
  } catch {}
}

/**
 * Pairs this machine with Studio and stores the resulting token.
 *
 * The CLI holds a code and the browser approves it, rather than the user copying a token out of
 * the UI. The token comes back over the CLI's own HTTPS POST, so it never lands in a URL, a
 * server log, or a `Referer` header.
 */
async function login({ studioUrl, open }: StudioOptions): Promise<Credentials> {
  const session = await startPairing({ studioUrl, name: path.basename(process.cwd()), hostname: hostname() })

  console.log(`\nOpen ${styleText('cyan', session.verification_uri)} and approve the code ${styleText('bold', session.user_code)}`)

  if (open) {
    await openInBrowser(session.verification_uri_complete)
  }

  const spinner = canUseTTY() ? prompts.spinner() : null
  spinner?.start('Waiting for approval')

  try {
    const { token, agent } = await pollForPairingToken({ studioUrl, session })
    spinner?.stop(`Paired as ${agent.name}`)

    const credentials: Credentials = { studioUrl, token, agentId: agent.id, agentSlug: agent.slug }
    await writeCredentials(credentials)

    console.log(`Credentials stored in ${path.join(getKubbHome(), 'credentials.json')}`)

    return credentials
  } catch (error) {
    spinner?.stop('Pairing failed')
    throw error
  }
}

type Permission = 'allowWrite' | 'allowConfigEdit' | 'allowInput' | 'allowExec'

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
 * One-line summary of what this session granted, for the connect banner and `kubb studio status`.
 */
export function formatPermissionSummary(granted: Record<Permission, boolean>): string {
  return PERMISSIONS.map(({ key, label }) => `${label}: ${granted[key] ? 'yes' : 'no'}`).join(', ')
}

/**
 * Resolves every permission for this project.
 *
 * A `--allow*` flag grants that one outright. The rest are asked once per project and the answers
 * are remembered, and in CI they stay off, since there is nobody to ask.
 *
 * ponytail: asks at connect rather than at the first write or exec, so the permissions are fixed
 * for the session and never have to change mid-connection. Move them to first use if the up-front
 * questions turn out to annoy people who only ever preview.
 */
export async function resolvePermissions(
  options: StudioOptions,
  credentials: Credentials,
  configPath: string = KUBB_CONFIG_FILENAME,
): Promise<Record<Permission, boolean>> {
  const project = process.cwd()
  const remembered = credentials.projects?.[project]
  const granted: Record<Permission, boolean> = { allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false }
  const answers: Partial<Record<Permission, boolean>> = {}

  for (const { key, question } of PERMISSIONS) {
    if (options[key] || typeof remembered?.[key] === 'boolean') {
      granted[key] = options[key] || remembered?.[key] === true
      continue
    }

    if (isCIEnvironment() || !canUseTTY()) {
      granted[key] = false
      continue
    }

    granted[key] = (await prompts.confirm({ message: question(project, configPath), initialValue: false })) === true
    answers[key] = granted[key]
  }

  // Only the answers are stored: a flag grants for one run, so persisting it would silently keep
  // the permission on every later run without the flag.
  if (Object.keys(answers).length) {
    await writeCredentials({
      ...credentials,
      projects: { ...credentials.projects, [project]: { ...remembered, ...answers } },
    })
  }

  return granted
}

/**
 * Resolves the project's Kubb config the same way `kubb generate` does, and returns its first
 * entry alongside every entry the file defines. Studio generates from the first entry only, but
 * edits the file through the whole array, so callers that bound what Studio may import need every
 * entry's plugins, not just the one it generates from.
 */
async function loadFirstConfig(options: StudioOptions): Promise<{ configPath: string; config: Config; configs: Array<Config> }> {
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
async function connect(options: StudioOptions, retryAfterPairing = true): Promise<void> {
  const envToken = process.env.KUBB_AGENT_TOKEN
  const stored = envToken ? null : await readCredentials()
  // A credential is only reused for the Studio it was issued by, so switching `--url` re-pairs
  // instead of sending one instance's token to another.
  let credentials: Credentials | null = envToken
    ? { studioUrl: options.studioUrl, token: envToken, agentId: '', agentSlug: '' }
    : stored?.studioUrl === options.studioUrl
      ? stored
      : null

  if (!credentials) {
    if (isCIEnvironment()) {
      throw new Error(`Not paired with ${options.studioUrl}. Set KUBB_AGENT_TOKEN, or run \`kubb studio login\` on a machine with a browser.`)
    }

    credentials = await login(options)
  }

  const { configPath, configs } = await loadFirstConfig(options)
  const { allowWrite, allowConfigEdit, allowInput, allowExec } = await resolvePermissions(options, credentials, configPath)
  const granted = { allowWrite, allowConfigEdit, allowInput, allowExec }

  if (options.logLevel !== 'silent') {
    console.log(styleText('dim', formatPermissionSummary(granted)))
  }

  const client = createClient({
    token: credentials.token,
    studioUrl: options.studioUrl,
    configPath,
    version: options.version,
    // Reloaded on every generate, so an edit to kubb.config.ts is picked up without reconnecting.
    loadConfig: async () => (await loadFirstConfig(options)).config,
    client: {
      kind: 'cli',
      version: options.version,
      cwd: process.cwd(),
      projectName: path.basename(process.cwd()),
    },
    root: process.cwd(),
    allowWrite,
    allowConfigEdit,
    allowInput,
    allowExec,
    // The local config bounds what Studio may import. Without this a `generate` payload could name
    // any module in the project's node_modules and the runtime would import it. Union of every
    // config entry's plugins, since Studio edits any entry, not only the one it generates from.
    allowedPlugins: [...new Set(configs.flatMap((entry) => entry.plugins.map((plugin) => plugin.name)))],
    logLevel: options.logLevel,
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

    if (isCIEnvironment() || !retryAfterPairing) {
      throw new Error(`${error.message} Run \`kubb studio login\` to pair again.`)
    }

    console.log(styleText('yellow', `${error.message} Pairing again...`))

    return connect(options, false)
  }

  if (options.logLevel !== 'silent') {
    console.log(styleText('dim', 'Connected. Press Ctrl+C to disconnect.'))
  }

  await new Promise<void>((resolve) => {
    const stop = () => {
      client.disconnect()
      resolve()
    }

    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
}

/**
 * Reports what this machine is paired as and which permissions were saved for this project.
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

  console.log(
    styleText(
      'dim',
      `Saved permissions — ${formatPermissionSummary({
        allowWrite: remembered.allowWrite === true,
        allowConfigEdit: remembered.allowConfigEdit === true,
        allowInput: remembered.allowInput === true,
        allowExec: remembered.allowExec === true,
      })}`,
    ),
  )
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
      console.warn(styleText('yellow', 'This feature is still under development, use with caution'))
    }

    if (!ACTIONS.includes(options.action)) {
      throw new Error(`Unknown action "${options.action}", expected one of ${ACTIONS.join(', ')}`)
    }

    if (options.action === 'login') {
      await login(options)
    } else if (options.action === 'logout') {
      await clearCredentials()
      console.log('Signed out of Kubb Studio.')
    } else if (options.action === 'status') {
      await status(options)
    } else {
      await connect(options)
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
    allowWrite: values.allowWrite,
    allowConfigEdit: values.allowConfigEdit,
    allowInput: values.allowInput,
    allowExec: values.allowExec,
    open: values.open,
    logLevel: values.logLevel,
  })
}
