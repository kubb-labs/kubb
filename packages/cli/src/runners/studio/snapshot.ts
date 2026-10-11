import { dirname, join } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { exists, read } from '@internals/utils'
import { cliReporter, Hookable, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { createSnapshot, defaultStudioUrl } from '@kubb/studio'
import type { BranchSnapshotChanges, PublishedSnapshot, SnapshotChanges } from '@kubb/studio/protocol'
import { logBlock } from '../../loggers/output.ts'
import { createPlainLogger } from '../../loggers/plainLogger.ts'
import setupReporters from '../../loggers/reporters.ts'
import { type CiContext, detectCi } from './ci.ts'
import { loadConfigs, run, type SnapshotOptions } from './run.ts'
import type { command } from '../../commands/studio/snapshot.ts'
import type { CommandRunner } from 'gunshi'

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
  // A custom --id drops the detected base, since runs on that branch may use a custom id too.
  const ci = options.id ? { id: options.id, name: detected?.name ?? options.id, commit: detected?.commit } : detected

  if (!ci) {
    throw new Error('Could not detect a supported CI provider (GitHub Actions, GitLab CI, Bitbucket Pipelines, CircleCI). Pass --id.')
  }

  // An explicit --base-id may not name a branch, so it labels the comparison itself.
  const base = options.baseId ? { branch: options.baseId, id: options.baseId } : ci.base

  return { ...ci, base: base?.id === ci.id ? undefined : base }
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
  changes?: SnapshotChanges
  /** What differs from the latest snapshot of the base branch, named by `branch`. */
  branchChanges?: BranchSnapshotChanges & { branch: string }
}

function toResult(studioUrl: string, snapshot: PublishedSnapshot, ci: CiContext): SnapshotResult {
  return {
    id: snapshot.id,
    name: snapshot.name,
    version: snapshot.version,
    integrity: snapshot.integrity,
    url: absoluteUrl(studioUrl, snapshot.url),
    snapshotIdUrl: absoluteUrl(studioUrl, snapshot.snapshotIdUrl),
    expiresAt: snapshot.expiresAt,
    agentUrl: absoluteUrl(studioUrl, `/agents/${snapshot.agent.slug ?? snapshot.agent.id}`),
    changes: snapshot.changes,
    branchChanges: snapshot.branchChanges && ci.base ? { ...snapshot.branchChanges, branch: ci.base.branch } : undefined,
  }
}

/** How many files differ, `against` what. */
function describeChanges(changes: SnapshotChanges, against: string): string {
  const { added, changed, removed } = changes

  return added.length + changed.length + removed.length
    ? `${added.length} added, ${changed.length} changed, ${removed.length} removed ${against}`
    : `No changes ${against}`
}

/** One summary line: how many files changed, and since which run. */
export function formatChanges(changes: SnapshotChanges): string {
  if (!changes.base) {
    return 'First snapshot'
  }

  return describeChanges(changes, `since ${changes.base.commit?.slice(0, 7) ?? changes.base.createdAt}`)
}

/** One summary line: how the snapshot differs from the base branch's latest one. */
export function formatBranchChanges(changes: BranchSnapshotChanges & { branch: string }): string {
  if (changes.base) return describeChanges(changes, `against ${changes.branch}`)

  return changes.baseFound ? `No snapshot of ${changes.branch} for this package yet` : `No snapshot of ${changes.branch} to compare with`
}

function printSummary(result: SnapshotResult): void {
  logBlock([
    `${styleText('dim', 'Package'.padEnd(10))}  ${result.name ?? '(unnamed)'}@${result.version ?? '0.0.0'}`,
    `${styleText('dim', 'Tarball'.padEnd(10))}  ${styleText('cyan', result.url)}`,
    `${styleText('dim', 'Agent'.padEnd(10))}  ${result.agentUrl}`,
    ...(result.branchChanges ? [`${styleText('dim', 'Branch'.padEnd(10))}  ${formatBranchChanges(result.branchChanges)}`] : []),
    ...(result.changes ? [`${styleText('dim', 'Changes'.padEnd(10))}  ${formatChanges(result.changes)}`] : []),
    `${styleText('dim', 'Expires'.padEnd(10))}  ${result.expiresAt}`,
  ])
}

/**
 * Generates the project, packs it, and publishes it to Kubb Studio in one request, under the CI
 * agent the run's identity names.
 */
export async function snapshot(options: SnapshotOptions): Promise<void> {
  const token = resolveToken(options)
  const { config } = await loadConfigs(options)
  const ci = resolveCiIdentity(options)
  const { name, version: packageVersion } = await resolvePackageMetadata(options)
  const logLevel = logLevelMap[options.logLevel ?? 'info']

  const write = options.json ? (line: string) => console.error(line) : (line: string) => console.log(line)
  const hooks = new Hookable<KubbHooks>()
  setupReporters(hooks, { logLevel, reporters: [cliReporter], logger: createPlainLogger(write) })
  const step = (message: string) => {
    if (logLevel > logLevelMap.silent) {
      write(message)
    }
  }

  step('Generating the snapshot')

  try {
    const published = await createSnapshot({
      studioUrl: options.studioUrl,
      apiKey: token,
      config,
      hooks,
      id: ci.id,
      name: ci.name,
      packageName: name,
      version: packageVersion,
      commit: ci.commit,
      baseId: ci.base?.id,
    })
    const result = toResult(options.studioUrl, published, ci)

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
  }
}

export const runner: CommandRunner<{ args: typeof command.args; extensions: {} }> = async ({ values }) => {
  const options: SnapshotOptions = {
    configPath: values.config,
    studioUrl: values.url ?? defaultStudioUrl,
    logLevel: values.logLevel,
    token: values.token,
    id: values.id,
    baseId: values.baseId,
    name: values.name,
    packageVersion: values.packageVersion,
    json: values.json,
  }
  await run(options, () => snapshot(options), { json: options.json })
}
