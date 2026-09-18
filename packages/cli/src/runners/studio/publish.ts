import * as prompts from '@clack/prompts'
import { styleText } from 'node:util'
import { isCIEnvironment } from '@internals/utils'
import { createJob, listSnapshots, waitForJob, type StudioSnapshot } from '@kubb/studio'
import { canUseTTY } from '../../utils/env.ts'
import { createSpinner, logBlock } from '../../loggers/output.ts'
import { assertSecureStudioUrl, absoluteUrl, connectStudioAgent, resolveTimeoutMs, resolveToken } from './snapshot.ts'
import { createStudioOptions, loadConfigs, run, type SnapshotOptions } from './run.ts'
import type { definition } from '../../commands/studio/publish.ts'
import type { CommandRunner } from 'gunshi'

export type PublishOptions = SnapshotOptions & { snapshotId?: string }

type PublishResult = {
  jobId: string
  snapshotId: string
  name: string
  version: string
  registry: string
  agentUrl: string
}

async function chooseSnapshot(snapshots: Array<StudioSnapshot>): Promise<StudioSnapshot> {
  if (!snapshots.length) throw new Error('No snapshots are available for this agent')
  const value = await prompts.select({
    message: 'Choose a snapshot to publish',
    options: snapshots.map((snapshot) => ({
      value: snapshot.id,
      label: `${snapshot.name ?? '(unnamed)'}@${snapshot.version ?? '0.0.0'}`,
      hint: `${snapshot.id} · expires ${snapshot.expiresAt}`,
    })),
  })
  if (prompts.isCancel(value)) throw new Error('Snapshot selection canceled')
  const snapshot = snapshots.find((item) => item.id === value)
  if (!snapshot) throw new Error('The selected snapshot no longer exists')
  return snapshot
}

export async function publish(options: PublishOptions): Promise<void> {
  const timeoutMs = resolveTimeoutMs(options)
  const token = resolveToken(options)
  assertSecureStudioUrl(options.studioUrl)
  const { configPath } = await loadConfigs(options)
  const spinner = options.json ? null : createSpinner()
  const log = (message: string) => (options.json ? console.error(message) : spinner?.message(message))
  const { agent, client } = await connectStudioAgent(options, configPath, token, log)
  try {
    const selected = options.snapshotId
      ? (await listSnapshots({ studioUrl: options.studioUrl, token, agentId: agent.id })).find((snapshot) => snapshot.id === options.snapshotId)
      : await chooseSnapshot(await listSnapshots({ studioUrl: options.studioUrl, token, agentId: agent.id }))
    if (!selected) throw new Error(`Snapshot ${options.snapshotId} was not found`)
    const job = await createJob({ studioUrl: options.studioUrl, token, type: 'publish', agentId: agent.id, snapshotId: selected.id })
    const finished = await waitForJob({
      studioUrl: options.studioUrl,
      token,
      id: job.id,
      timeoutMs,
      onUpdate: (current) => current.stage && log(`Publishing: ${current.stage}`),
    })
    if (finished.status !== 'success') throw new Error(finished.error ?? `Publish job ${finished.status}`)
    if (!finished.publish) throw new Error('Publish job succeeded without publish details')
    const result: PublishResult = {
      jobId: job.id,
      snapshotId: selected.id,
      name: finished.publish.name,
      version: finished.publish.version,
      registry: finished.publish.registry,
      agentUrl: absoluteUrl(options.studioUrl, `/agents/${agent.slug}`),
    }
    if (options.json) console.log(JSON.stringify(result))
    else
      logBlock([
        `${styleText('dim', 'Package'.padEnd(10))}  ${result.name}@${result.version}`,
        `${styleText('dim', 'Registry'.padEnd(10))}  ${result.registry}`,
        `${styleText('dim', 'Agent'.padEnd(10))}  ${result.agentUrl}`,
      ])
  } finally {
    client.disconnect()
  }
}

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options: PublishOptions = {
    ...createStudioOptions(values),
    token: values.token,
    id: values.id,
    snapshotId: values.snapshotId,
    timeout: values.timeout,
    json: values.json,
  }
  if (!options.snapshotId && (isCIEnvironment() || !canUseTTY())) throw new Error('Pass --snapshot-id when running without an interactive terminal')
  await run(options, () => publish(options), { json: options.json })
}
