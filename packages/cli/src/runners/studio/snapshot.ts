import { dirname, join } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { exists, read } from '@internals/utils'
import { logLevel as logLevelMap } from '@kubb/core'
import { createAgent, createClient, createJob, machineTokenFrom, waitForJob, type StudioSnapshot } from '@kubb/studio'
import { createSpinner, logBlock } from '../../loggers/output.ts'
import { detectCi } from './ci.ts'
import { createStudioOptions, loadConfigs, run, type SnapshotOptions } from './run.ts'
import type { definition } from '../../commands/studio/snapshot.ts'
import type { CommandRunner } from 'gunshi'

/**
 * How long to wait for Studio's `studio:ready` acknowledgement, above the client's own 10s
 * handshake-ack timeout.
 */
const READY_TIMEOUT_MS = 15_000

/**
 * Longest `--timeout` accepted. Job records expire from Studio's storage after an hour.
 */
const MAX_TIMEOUT_SECONDS = 3600

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

async function findPackageJson(startDirectory: string): Promise<{ name: string; version: string }> {
  let directory = startDirectory

  for (;;) {
    const file = join(directory, 'package.json')

    if (await exists(file)) {
      const packageJson = JSON.parse(await read(file)) as Partial<{ name: string; version: string }>

      if (packageJson.name && packageJson.version) {
        return { name: packageJson.name, version: packageJson.version }
      }
    }

    const parent = dirname(directory)

    if (parent === directory) {
      break
    }

    directory = parent
  }

  throw new Error(`No package.json with a name and a version found above ${startDirectory}`)
}

/** Reads package.json only for whichever of name/version --name and --version did not supply. */
async function resolvePackageMetadata(options: SnapshotOptions): Promise<{ name: string; version: string }> {
  if (options.name && options.packageVersion) {
    return { name: options.name, version: options.packageVersion }
  }

  const packageMetadata = await findPackageJson(process.cwd())

  return { name: options.name ?? packageMetadata.name, version: options.packageVersion ?? packageMetadata.version }
}

function resolveToken(options: SnapshotOptions): string {
  const token = options.token ?? process.env.KUBB_TOKEN

  if (!token) {
    throw new Error('An organization CI API key is required. Pass --token or set KUBB_TOKEN.')
  }

  return token
}

function resolveCiIdentity(options: SnapshotOptions): { id: string; name: string } {
  const detected = detectCi()

  if (options.id) {
    return { id: options.id, name: detected?.name ?? options.id }
  }

  if (!detected) {
    throw new Error('Could not detect a supported CI provider (GitHub Actions, GitLab CI, Bitbucket Pipelines, CircleCI). Pass --id.')
  }

  return detected
}

/** Rejects a bad `--timeout` up front instead of letting it reach `waitForJob` as NaN or <= 0. */
function resolveTimeoutMs(options: SnapshotOptions): number {
  const seconds = options.timeout ?? 600

  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('--timeout must be a positive number of seconds')
  }

  return Math.min(seconds, MAX_TIMEOUT_SECONDS) * 1000
}

/** The CI key is a credential, so refuse to send it anywhere but HTTPS or a loopback dev host. */
function assertSecureStudioUrl(studioUrl: string): void {
  const url = new URL(studioUrl)

  if (url.protocol !== 'https:' && !LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing to send the CI API key to ${studioUrl}. Use an https:// Studio URL, or a loopback host for local development.`)
  }
}

function absoluteUrl(studioUrl: string, path: string): string {
  return new URL(path, `${studioUrl}/`).toString()
}

type SnapshotResult = {
  id: string
  name: string | null
  version: string | null
  integrity: string | null
  url: string
  snapshotIdUrl: string
  expiresAt: string
  agentUrl: string
}

function toResult(studioUrl: string, snapshot: StudioSnapshot, agentSlug: string): SnapshotResult {
  return {
    id: snapshot.id,
    name: snapshot.name,
    version: snapshot.version,
    integrity: snapshot.integrity,
    url: absoluteUrl(studioUrl, snapshot.url),
    snapshotIdUrl: absoluteUrl(studioUrl, snapshot.snapshotIdUrl),
    expiresAt: snapshot.expiresAt,
    agentUrl: absoluteUrl(studioUrl, `/agents/${agentSlug}`),
  }
}

function printSummary(result: SnapshotResult): void {
  logBlock([
    `${styleText('dim', 'Package'.padEnd(10))}  ${result.name ?? '(unnamed)'}@${result.version ?? '0.0.0'}`,
    `${styleText('dim', 'Tarball'.padEnd(10))}  ${styleText('cyan', result.url)}`,
    `${styleText('dim', 'Agent'.padEnd(10))}  ${result.agentUrl}`,
    `${styleText('dim', 'Expires'.padEnd(10))}  ${result.expiresAt}`,
  ])
}

/**
 * Generates a Kubb Studio snapshot from a script: registers or reuses a CI agent, connects it,
 * queues a snapshot job, and polls until the tarball is ready. A snapshot job runs generation and
 * packs the tarball in one step, so this needs no separate generation run.
 */
export async function snapshot(options: SnapshotOptions): Promise<void> {
  const timeoutMs = resolveTimeoutMs(options)
  const token = resolveToken(options)
  assertSecureStudioUrl(options.studioUrl)
  const { configPath } = await loadConfigs(options)
  const ci = resolveCiIdentity(options)
  const { name, version: packageVersion } = await resolvePackageMetadata(options)

  // Set before the first `getMachineToken()` call (inside `client.connect()`), so the WebSocket
  // session registers under the same machine token `createAgent` just registered with Studio.
  process.env.KUBB_AGENT_SECRET = ci.id

  const spinner = options.json ? null : createSpinner()
  const log = (message: string) => {
    if (options.json) {
      console.error(message)
      return
    }

    spinner?.message(message)
  }

  if (options.json) {
    log('Creating Kubb Studio agent')
  }
  if (!options.json) {
    spinner?.start('Creating Kubb Studio agent')
  }

  const agent = await createAgent({ studioUrl: options.studioUrl, token, name: ci.name, machineToken: machineTokenFrom(ci.id) })

  const { promise: ready, reject: markFailed, resolve: markReady } = Promise.withResolvers<void>()

  const client = createClient({
    studioUrl: options.studioUrl,
    token: agent.token,
    configPath,
    root: process.cwd(),
    version: options.version,
    client: { kind: 'cli' },
    logLevel: logLevelMap[options.logLevel ?? 'info'],
    loadConfig: async () => (await loadConfigs(options)).config,
    installLogger: (hooks) => {
      hooks.hook('studio:connecting', ({ url }) => log(`Connecting to Kubb Studio at ${url}`))
      hooks.hook('studio:connected', ({ url }) => log(`Connected to Kubb Studio at ${url}`))
      hooks.hook('studio:ready', () => {
        log('Kubb Studio connection ready')
        markReady()
      })
      hooks.hook('studio:warn', ({ message }) => log(`Kubb Studio warning: ${message}`))
      hooks.hook('studio:error', ({ error }) => markFailed(error))
    },
  })

  await client.connect()

  try {
    let readyTimeoutHandle: ReturnType<typeof setTimeout> | undefined

    try {
      await Promise.race([
        ready,
        new Promise<void>((_, reject) => {
          readyTimeoutHandle = setTimeout(() => reject(new Error('Timed out waiting for Kubb Studio to confirm the agent was ready')), READY_TIMEOUT_MS)
        }),
      ])
    } finally {
      clearTimeout(readyTimeoutHandle)
    }

    log('Creating snapshot job')

    const job = await createJob({ studioUrl: options.studioUrl, token, type: 'snapshot', agentId: agent.id, name, version: packageVersion })
    log(`Snapshot job queued: ${job.id}`)
    const finished = await waitForJob({ studioUrl: options.studioUrl, token, id: job.id, timeoutMs })

    if (finished.status === 'failed') {
      throw new Error(finished.error ?? 'Snapshot job failed')
    }

    if (!finished.snapshot) {
      throw new Error('Snapshot job succeeded without a snapshot')
    }

    const result = toResult(options.studioUrl, finished.snapshot, agent.slug)

    if (options.json) {
      log('Snapshot published')
    }
    if (!options.json) {
      spinner?.stop('Snapshot published')
    }

    if (options.json) {
      console.log(JSON.stringify(result))
    }
    if (!options.json) {
      printSummary(result)
    }
  } catch (error) {
    if (options.json) {
      log('Snapshot failed')
    }
    if (!options.json) {
      spinner?.stop('Snapshot failed')
    }
    throw error
  } finally {
    if (options.json) {
      log('Disconnecting from Kubb Studio')
    }
    client.disconnect()
  }
}

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options: SnapshotOptions = {
    ...createStudioOptions(values),
    token: values.token,
    id: values.id,
    name: values.name,
    packageVersion: values.packageVersion,
    timeout: values.timeout,
    json: values.json,
  }
  await run(options, () => snapshot(options), { json: options.json })
}
