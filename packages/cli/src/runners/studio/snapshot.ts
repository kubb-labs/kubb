import { dirname, join } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { formatMs, getElapsedMs, read } from '@internals/utils'
import { cliReporter, Diagnostics, Hookable, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { createSnapshot } from '@kubb/studio'
import type { BranchSnapshotChanges, PublishedSnapshot, SnapshotChanges } from '@kubb/studio/protocol'
import { pluralize } from '../../ui/text.ts'
import { createPlainLogger } from '../../loggers/plainLogger.ts'
import setupReporters from '../../loggers/reporters.ts'
import { type CiContext, detectCi } from './ci.ts'
import { loadConfigs, runStudio, type SnapshotOptions } from './run.ts'
import type { command } from '../../commands/studio/snapshot.ts'
import type { CommandRunner } from 'gunshi'

/**
 * Walks up from `directory` to the first package.json with a name and a version.
 */
async function findPackageJson(directory: string): Promise<{ name: string; version: string }> {
  const packageJson = JSON.parse(await read(join(directory, 'package.json')).catch(() => '{}')) as Partial<{ name: string; version: string }>
  if (packageJson.name && packageJson.version) return { name: packageJson.name, version: packageJson.version }

  const parent = dirname(directory)
  if (parent === directory)
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `No package.json with a name and a version found above ${process.cwd()}`,
      help: 'Pass `--name` and `--version`, or run from a package with a package.json.',
    })

  return findPackageJson(parent)
}

function resolveCiIdentity(options: SnapshotOptions): CiContext {
  const detected = detectCi()
  // A custom --id drops the detected base, since runs on that branch may use a custom id too.
  const ci = options.id ? { id: options.id, name: detected?.name ?? options.id, commit: detected?.commit } : detected

  if (!ci) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: 'Could not detect a supported CI provider (GitHub Actions, GitLab CI, Bitbucket Pipelines, CircleCI). Pass --id.',
    })
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
  /** Sequence number on the CI agent, when Studio sends one. */
  number?: number
  name: string | null
  version: string | null
  integrity: string | null
  url: string
  snapshotIdUrl: string
  /** Studio page of the snapshot, when Studio sends one. */
  webUrl?: string
  expiresAt: string
  agentUrl: string
  /** What changed since the previous snapshot of this package on this agent. */
  changes?: SnapshotChanges
  /** What differs from the latest snapshot of the base branch, named by `branch`. */
  branchChanges?: BranchSnapshotChanges & { branch: string }
}

function toResult({ studioUrl, snapshot, ci }: { studioUrl: string; snapshot: PublishedSnapshot; ci: CiContext }): SnapshotResult {
  return {
    id: snapshot.id,
    number: snapshot.number,
    name: snapshot.name,
    version: snapshot.version,
    integrity: snapshot.integrity,
    url: absoluteUrl(studioUrl, snapshot.url),
    snapshotIdUrl: absoluteUrl(studioUrl, snapshot.snapshotIdUrl),
    webUrl: snapshot.webUrl ? absoluteUrl(studioUrl, snapshot.webUrl) : undefined,
    expiresAt: snapshot.expiresAt,
    agentUrl: absoluteUrl(studioUrl, `/agents/${snapshot.agent.slug ?? snapshot.agent.id}`),
    changes: snapshot.changes,
    branchChanges: snapshot.branchChanges && ci.base ? { ...snapshot.branchChanges, branch: ci.base.branch } : undefined,
  }
}

/** How many files differ, `against` what. */
function describeChanges(changes: SnapshotChanges, against: string): string {
  const { added, changed, removed } = changes
  const parts = [
    added.length && `+${pluralize(added.length, 'file')}`,
    changed.length && `~${changed.length} changed`,
    removed.length && `-${removed.length} removed`,
  ].filter(Boolean)

  return parts.length ? `${parts.join('  ')}  ${against}` : `No changes ${against}`
}

/** One summary line: how many files changed, and since which run. */
export function formatChanges(changes: SnapshotChanges): string {
  if (!changes.base) {
    return 'First snapshot'
  }
  const { number, commit, createdAt } = changes.base

  return describeChanges(changes, `vs ${number ? `#${number}` : (commit?.slice(0, 7) ?? createdAt)}`)
}

/** One summary line: how the snapshot differs from the base branch's latest one. */
export function formatBranchChanges(changes: BranchSnapshotChanges & { branch: string }): string {
  if (changes.base) return describeChanges(changes, `vs ${changes.branch}`)

  return changes.baseFound ? `No snapshot of ${changes.branch} for this package yet` : `No snapshot of ${changes.branch} to compare with`
}

function printSummary(result: SnapshotResult): void {
  const row = (label: string, value: string) => `  ${styleText('dim', label.padEnd(7))} ${value}`

  console.log(
    [
      '',
      ...(result.webUrl ? [row('View', styleText('cyan', result.webUrl))] : []),
      ...(result.changes ? [row('Diff', formatChanges(result.changes))] : []),
      ...(result.branchChanges ? [row('Branch', formatBranchChanges(result.branchChanges))] : []),
      row('Use', `npm i ${result.url}`),
      row('Expires', result.expiresAt.slice(0, 10)),
    ].join('\n'),
  )
}

/**
 * Generates the project, packs it, and publishes it to Kubb Studio in one request, under the CI
 * agent the run's identity names.
 */
export async function snapshot(options: SnapshotOptions): Promise<void> {
  const token = options.token ?? process.env.KUBB_TOKEN
  if (!token) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: 'An organization CI API key is required. Pass --token or set KUBB_TOKEN.',
    })
  }
  const { config } = await loadConfigs(options)
  const ci = resolveCiIdentity(options)
  // package.json is read only for whichever of name/version --name and --version did not supply.
  const { name, version: packageVersion } =
    options.name && options.packageVersion
      ? { name: options.name, version: options.packageVersion }
      : await findPackageJson(process.cwd()).then((found) => ({ name: options.name ?? found.name, version: options.packageVersion ?? found.version }))
  const logLevel = logLevelMap[options.logLevel ?? 'info']

  const write = options.json ? (line: string) => console.error(line) : (line: string) => console.log(line)
  const hooks = new Hookable<KubbHooks>()
  // The steps below are the CI log; the run's own per-file output only shows when asked for with --log-level verbose.
  setupReporters(hooks, { logLevel: logLevel > logLevelMap.info ? logLevel : logLevelMap.silent, reporters: [cliReporter], logger: createPlainLogger(write) })
  const step = (message: string) => {
    if (logLevel > logLevelMap.silent) {
      write(message)
    }
  }

  hooks.hook('kubb:generation:end', ({ filesCreated = 0, status, hrStart }) => {
    if (status !== 'failed' && hrStart) step(`✓ Generated ${pluralize(filesCreated, 'file')} in ${formatMs(getElapsedMs(hrStart))}`)
  })

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
    const result = toResult({ studioUrl: options.studioUrl, snapshot: published, ci })

    step(`✓ Packed ${result.name ?? name}@${result.version ?? packageVersion}`)
    step(`✓ Published snapshot ${result.number ? `#${result.number}` : result.id} for ${ci.name}${ci.commit ? `@${ci.commit.slice(0, 7)}` : ''}`)

    if (options.json) console.log(JSON.stringify(result))
    else printSummary(result)
  } catch (error) {
    step('✖ Snapshot failed')
    throw error
  }
}

export const runner: CommandRunner<{ args: typeof command.args; extensions: {} }> = ({ values }) =>
  runStudio(
    values,
    (options) =>
      snapshot({
        ...options,
        token: values.token,
        id: values.id,
        baseId: values.baseId,
        name: values.name,
        packageVersion: values.packageVersion,
        json: values.json,
      }),
    { json: values.json },
  )
