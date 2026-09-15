import { createHash } from 'node:crypto'
import type { Config, Hookable, KubbHooks } from '@kubb/core'
import { createClient } from './client.ts'
import { defaultStudioUrl } from './constants.ts'
import { detectCIContext, type CIContext } from './ci.ts'

type CIJobStatus = 'queued' | 'running' | 'success' | 'failed'

type Snapshot = { id: string; name?: string; version?: string; integrity?: string; url?: string }
type Job = { id: string; status: CIJobStatus; error?: string; snapshot?: Snapshot }
export type CIAgent = { id: string; slug: string; token: string }

export type SnapshotJobOptions = {
  token: string
  configPath: string
  version: string
  loadConfig: () => Promise<Config>
  root?: string
  studioUrl?: string
  context?: CIContext
  name?: string
  snapshotVersion?: string
  installLogger?: (hooks: Hookable<KubbHooks>) => void | Promise<void>
  agent?: CIAgent
}

export type SnapshotJobResult = Snapshot

function headers(token: string): HeadersInit {
  return { authorization: `Bearer ${token}`, 'x-api-key': token, 'content-type': 'application/json' }
}

async function request<T>(url: string, token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${url}${path}`, { ...init, headers: { ...headers(token), ...init.headers } })
  const body = (await response.json().catch(() => ({}))) as { message?: string }

  if (!response.ok) throw new Error(body.message ?? `Kubb Studio ${response.status}`)

  return body as T
}

function machineToken(context: CIContext): string {
  const identity = [context.provider, context.repository, context.pullRequest?.id ?? context.pipelineId ?? context.jobId].filter(Boolean).join(':')

  return createHash('sha256').update(identity).digest('hex')
}

export async function createCIAgent({
  studioUrl,
  token,
  name,
  machineToken,
}: {
  studioUrl: string
  token: string
  name: string
  machineToken: string
}): Promise<CIAgent> {
  return request<CIAgent>(studioUrl, token, '/api/agents', {
    method: 'POST',
    body: JSON.stringify({ name, machineToken }),
  })
}

async function poll({ url, token, id }: { url: string; token: string; id: string }): Promise<Job> {
  for (;;) {
    const { job } = await request<{ job: Job }>(url, token, `/api/jobs/${id}`)

    if (job.status === 'success' || job.status === 'failed') return job

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

export async function runSnapshotJob(options: SnapshotJobOptions): Promise<SnapshotJobResult> {
  const context = options.context ?? detectCIContext()
  if (!context) throw new Error('Kubb Studio CI jobs require a CI environment')

  const studioUrl = (options.studioUrl ?? defaultStudioUrl).replace(/\/$/, '')
  const agent =
    options.agent ??
    (await createCIAgent({
      studioUrl,
      token: options.token,
      name: context.repository ?? `${context.provider} CI`,
      machineToken: machineToken(context),
    }))
  const client = createClient({
    token: agent.token,
    studioUrl,
    configPath: options.configPath,
    version: options.version,
    root: options.root,
    loadConfig: options.loadConfig,
    client: { kind: 'ci' },
    permissions: { allowWrite: true, allowConfigEdit: false, allowInput: false, allowExec: true },
    installLogger: options.installLogger,
  })

  try {
    await client.connect()

    const { job } = await request<{ job: Job }>(studioUrl, options.token, '/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        type: 'snapshot',
        agentId: agent.id,
        context,
        name: options.name,
        version: options.snapshotVersion,
      }),
    })

    const result = await poll({ url: studioUrl, token: options.token, id: job.id })

    if (result.status === 'success' && result.snapshot) return result.snapshot

    throw new Error(result.error ?? 'Snapshot creation failed')
  } finally {
    client.disconnect()
  }
}
