import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { canUseTTY, toError } from '@internals/utils'
import type { CLIOptions } from '@kubb/core'
import { createFileStorage, createClient, pollForPairingToken, setStorage, startPairing } from '@kubb/studio'
import { x } from 'tinyexec'
import type { CommandRunner } from 'gunshi'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import { version } from '../../../package.json'
import type { definition } from '../../commands/studio.ts'
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
   * Base URL of the Studio instance, for a self-hosted deployment.
   */
  studioUrl: string
  allowWrite: boolean
  allowInput: boolean
  allowExec: boolean
  /**
   * Whether to open the approval page in a browser during pairing.
   */
  open: boolean
  logLevel?: CLIOptions['logLevel']
}

function isCI(): boolean {
  return Boolean(process.env.CI)
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
  // The machine secret lives here, and pairing binds it, so storage is installed before the first
  // `getMachineToken()` rather than at `createClient` time.
  setStorage(createFileStorage(path.join(getKubbHome(), 'cache')))

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

/**
 * Resolves the write permission for this project.
 *
 * `--allow-write` grants it outright. Otherwise the CLI asks once per project and remembers the
 * answer, and in CI it stays off, since there is nobody to ask.
 *
 * ponytail: asks at connect rather than at the first write, so the permission is fixed for the
 * session and never has to change mid-connection. Move it to the first write if the up-front
 * question turns out to annoy people who only ever preview.
 */
async function resolveAllowWrite(options: StudioOptions, credentials: Credentials): Promise<boolean> {
  if (options.allowWrite) {
    return true
  }

  const project = process.cwd()
  const remembered = credentials.projects?.[project]?.allowWrite

  if (typeof remembered === 'boolean') {
    return remembered
  }

  if (isCI() || !canUseTTY()) {
    return false
  }

  const answer = await prompts.confirm({
    message: `Let Kubb Studio write generated files into ${project}?`,
    initialValue: false,
  })
  const allowWrite = answer === true

  await writeCredentials({
    ...credentials,
    projects: { ...credentials.projects, [project]: { allowWrite } },
  })

  return allowWrite
}

/**
 * Connects this project to Studio and streams generation events until the process is stopped.
 */
async function connect(options: StudioOptions): Promise<void> {
  const envToken = process.env.KUBB_AGENT_TOKEN
  const stored = await readCredentials()
  // A credential is only reused for the Studio it was issued by, so switching `--url` re-pairs
  // instead of sending one instance's token to another.
  let credentials: Credentials | null = envToken
    ? { studioUrl: options.studioUrl, token: envToken, agentId: '', agentSlug: '' }
    : stored?.studioUrl === options.studioUrl
      ? stored
      : null

  if (!credentials) {
    if (isCI()) {
      throw new Error(`Not paired with ${options.studioUrl}. Set KUBB_AGENT_TOKEN, or run \`kubb studio login\` on a machine with a browser.`)
    }

    credentials = await login(options)
  }

  const { configPath, configs } = await getConfigs({ configPath: options.configPath, logLevel: options.logLevel })
  const [config] = configs

  if (!config) {
    throw new Error('Config not defined, create a kubb.config.ts or pass it with --config')
  }

  const allowWrite = await resolveAllowWrite(options, credentials)

  if (!isCI() && !options.allowExec) {
    console.log(styleText('dim', 'Read-only run. Pass --allow-exec to run the formatter, the linter, and postGenerate.'))
  }

  const client = createClient({
    token: credentials.token,
    storage: createFileStorage(path.join(getKubbHome(), 'cache')),
    studioUrl: options.studioUrl,
    configPath,
    version: options.version,
    // Reloaded on every generate, so an edit to kubb.config.ts is picked up without reconnecting.
    loadConfig: async () => {
      const { configs: fresh } = await getConfigs({ configPath: options.configPath, logLevel: options.logLevel })
      const [first] = fresh
      if (!first) {
        throw new Error('Config not defined, create a kubb.config.ts or pass it with --config')
      }
      return first
    },
    client: {
      kind: 'cli',
      version: options.version,
      cwd: process.cwd(),
      projectName: path.basename(process.cwd()),
    },
    root: process.cwd(),
    allowWrite,
    allowInput: options.allowInput,
    allowExec: options.allowExec,
    // The local config bounds what Studio may import. Without this a `generate` payload could name
    // any module in the project's node_modules and the runtime would import it.
    allowedPlugins: config.plugins.map((plugin) => plugin.name),
  })

  await client.connect()

  console.log(styleText('dim', 'Connected. Press Ctrl+C to disconnect.'))

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
 * Reports what this machine is paired as.
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
}

/**
 * Runs a `kubb studio` action and reports the outcome to telemetry.
 */
export async function run(options: StudioOptions): Promise<void> {
  const hrStart = process.hrtime()
  const report = (status: 'success' | 'failed') => sendTelemetry(buildTelemetryEvent({ command: 'studio', kubbVersion: options.version, hrStart, status }))

  try {
    console.warn(styleText('yellow', 'This feature is still under development, use with caution'))

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
    studioUrl: values.url,
    allowWrite: values.allowWrite,
    allowInput: values.allowInput,
    allowExec: values.allowExec,
    open: values.open,
    logLevel: values.logLevel,
  })
}
