import { dirname, join } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { exists, read } from '@internals/utils'
import { cliReporter, logLevel as logLevelMap } from '@kubb/core'
import {
  createAgent,
  createJob,
  machineTokenFrom,
  runConnection,
  waitForJob,
  type StudioFileChanges,
  type StudioSnapshot,
  type StudioSnapshotChanges,
} from '@kubb/studio'
import { logBlock } from '../../loggers/output.ts'
import { createPlainLogger } from '../../loggers/plainLogger.ts'
import setupReporters from '../../loggers/utils.ts'
import { type CiContext, detectCi } from './ci.ts'
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

function resolveCiIdentity(options: SnapshotOptions): CiContext {
  const detected = detectCi()
  const ci = resolveIdentity(options, detected)

  // A run on the base branch itself has nothing else to compare with.
  return ci.baseId && ci.baseId !== ci.id ? ci : { ...ci, baseBranch: undefined, baseId: undefined }
}

function resolveIdentity(options: SnapshotOptions, detected: CiContext | null): CiContext {
  if (options.id) {
    // A custom --id means runs on the base branch use a custom id too, so only --base-id names it.
    return { id: options.id, name: detected?.name ?? options.id, commit: detected?.commit, baseBranch: detected?.baseBranch, baseId: options.baseId }
  }

  if (!detected) {
    throw new Error('Could not detect a supported CI provider (GitHub Actions, GitLab CI, Bitbucket Pipelines, CircleCI). Pass --id.')
  }

  return { ...detected, baseId: options.baseId ?? detected.baseId }
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
  /** What changed since the previous snapshot of this package on this agent. */
  changes?: StudioSnapshotChanges
  /** What differs from the latest snapshot of the base branch, named by `branch`. */
  branchChanges?: StudioSnapshotChanges & { branch: string }
  /** What differs from the output directory on disk before the run. */
  diskChanges?: StudioFileChanges
}

function toResult(studioUrl: string, snapshot: StudioSnapshot, agentSlug: string, ci: CiContext): SnapshotResult {
  return {
    id: snapshot.id,
    name: snapshot.name,
    version: snapshot.version,
    integrity: snapshot.integrity,
    url: absoluteUrl(studioUrl, snapshot.url),
    snapshotIdUrl: absoluteUrl(studioUrl, snapshot.snapshotIdUrl),
    expiresAt: snapshot.expiresAt,
    agentUrl: absoluteUrl(studioUrl, `/agents/${agentSlug}`),
    changes: snapshot.changes,
    branchChanges: snapshot.branchChanges ? { ...snapshot.branchChanges, branch: ci.baseBranch ?? ci.baseId ?? 'base' } : undefined,
    diskChanges: snapshot.diskChanges,
  }
}

function countChanges(changes: StudioFileChanges): string {
  return [`${changes.added.length} added`, `${changes.changed.length} changed`, `${changes.removed.length} removed`].join(', ')
}

function hasChanges(changes: StudioFileChanges): boolean {
  return changes.added.length + changes.changed.length + changes.removed.length > 0
}

/** One summary line: how many files changed, and since which run. */
export function formatChanges(changes: StudioSnapshotChanges): string {
  if (!changes.base) {
    return 'First snapshot'
  }

  const since = changes.base.commit ? changes.base.commit.slice(0, 7) : changes.base.createdAt

  return hasChanges(changes) ? `${countChanges(changes)} since ${since}` : `No changes since ${since}`
}

/** One summary line: how the snapshot differs from the base branch's latest one. */
export function formatBranchChanges(changes: StudioSnapshotChanges & { branch: string }): string {
  if (!changes.base) {
    return `No snapshot of ${changes.branch} to compare with`
  }

  const at = changes.base.commit ? ` (${changes.base.commit.slice(0, 7)})` : ''

  return hasChanges(changes) ? `${countChanges(changes)} against ${changes.branch}${at}` : `No changes against ${changes.branch}${at}`
}

/** One summary line: how the snapshot differs from the output directory on disk. */
export function formatDiskChanges(changes: StudioFileChanges): string {
  return hasChanges(changes) ? `${countChanges(changes)} against the files on disk` : 'Matches the files on disk'
}

function printSummary(result: SnapshotResult): void {
  logBlock([
    `${styleText('dim', 'Package'.padEnd(10))}  ${result.name ?? '(unnamed)'}@${result.version ?? '0.0.0'}`,
    `${styleText('dim', 'Tarball'.padEnd(10))}  ${styleText('cyan', result.url)}`,
    `${styleText('dim', 'Agent'.padEnd(10))}  ${result.agentUrl}`,
    ...(result.branchChanges ? [`${styleText('dim', 'Branch'.padEnd(10))}  ${formatBranchChanges(result.branchChanges)}`] : []),
    ...(result.changes ? [`${styleText('dim', 'Changes'.padEnd(10))}  ${formatChanges(result.changes)}`] : []),
    ...(result.diskChanges ? [`${styleText('dim', 'On disk'.padEnd(10))}  ${formatDiskChanges(result.diskChanges)}`] : []),
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
  const logLevel = logLevelMap[options.logLevel ?? 'info']

  // Set before the first `getMachineToken()` call (inside the connection), so the WebSocket
  // session registers under the same machine token `createAgent` just registered with Studio.
  process.env.KUBB_AGENT_SECRET = ci.id

  const write = options.json ? (line: string) => console.error(line) : (line: string) => console.log(line)
  const logger = createPlainLogger(write)
  const step = (message: string) => {
    if (logLevel > logLevelMap.silent) {
      write(message)
    }
  }

  step('Creating Kubb Studio agent')

  const agent = await createAgent({ studioUrl: options.studioUrl, token, name: ci.name, machineToken: machineTokenFrom(ci.id) })

  const { promise: ready, resolve: markReady } = Promise.withResolvers<void>()
  const shutdown = new AbortController()

  const connection = runConnection({
    credentials: { token: agent.token },
    signal: shutdown.signal,
    clientOptions: () => ({
      studioUrl: options.studioUrl,
      configPath,
      root: process.cwd(),
      version: options.version,
      // Flags only: a script is never prompted and never reuses a saved answer.
      permissions: options.permission,
      loadConfig: async () => (await loadConfigs(options)).config,
      installLogger: async (hooks) => {
        await setupReporters(hooks, { logLevel, reporters: [cliReporter], logger })
        hooks.hook('studio:ready', () => markReady())
      },
    }),
    // A CI agent's token comes from the organization key, so there is no pairing to fall back to.
    onTokenRejected: ({ error }) => Promise.reject(error),
  })
  const lost = connection.then(() => Promise.reject(new Error('The Kubb Studio connection ended before the snapshot finished')))
  void lost.catch(() => {})

  try {
    let readyTimeout: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        ready,
        lost,
        new Promise<never>((_, reject) => {
          readyTimeout = setTimeout(() => reject(new Error('Timed out waiting for Kubb Studio to confirm the agent was ready')), READY_TIMEOUT_MS)
        }),
      ])
    } finally {
      clearTimeout(readyTimeout)
    }

    step('Creating snapshot job')

    const job = await createJob({
      studioUrl: options.studioUrl,
      token,
      type: 'snapshot',
      agentId: agent.id,
      name,
      version: packageVersion,
      commit: ci.commit,
      baseMachineToken: ci.baseId ? machineTokenFrom(ci.baseId) : undefined,
    })
    step(`Snapshot job queued: ${job.id}`)
    const finished = await Promise.race([waitForJob({ studioUrl: options.studioUrl, token, id: job.id, timeoutMs }), lost])

    if (finished.status === 'failed') {
      throw new Error(finished.error ?? 'Snapshot job failed')
    }

    if (!finished.snapshot) {
      throw new Error('Snapshot job succeeded without a snapshot')
    }

    const result = toResult(options.studioUrl, finished.snapshot, agent.slug, ci)

    step('Snapshot published')

    if (options.json) {
      console.log(JSON.stringify(result))
    }
    if (!options.json) {
      printSummary(result)
    }
  } catch (error) {
    step('Snapshot failed')
    throw error
  } finally {
    step('Disconnecting from Kubb Studio')
    // Not awaited: a half-open socket must not hold the run open.
    shutdown.abort()
  }
}

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options: SnapshotOptions = {
    ...createStudioOptions(values),
    token: values.token,
    id: values.id,
    baseId: values.baseId,
    name: values.name,
    packageVersion: values.packageVersion,
    timeout: values.timeout,
    json: values.json,
  }
  await run(options, () => snapshot(options), { json: options.json })
}
