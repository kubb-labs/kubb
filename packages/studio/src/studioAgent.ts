import { createHash } from 'node:crypto'
import type { Config, Hookable, KubbHooks } from '@kubb/core'
import { createClient, type Client } from './client.ts'
import { defaultStudioUrl } from './constants.ts'
import { detectCIContext, type CIContext } from './ci.ts'
import { createAgent, createJob, waitForJob, type StudioAgentCredentials, type StudioAgentJob, type StudioSnapshot } from './api.ts'
export type { StudioAgentCredentials, StudioAgentJob, StudioAgentJobStatus, StudioSnapshot } from './api.ts'

type JobType = 'generation' | 'snapshot'

export type StudioAgentOptions = {
  token: string
  configPath: string
  version: string
  loadConfig: () => Promise<Config>
  root?: string
  studioUrl?: string
  machineToken?: string
  context?: CIContext
  poolSize?: number
  name?: string
  snapshotVersion?: string
  installLogger?: (hooks: Hookable<KubbHooks>) => void | Promise<void>
}

export type StudioAgentJobOptions = {
  name?: string
  snapshotVersion?: string
}

function machineToken(context: CIContext): string {
  const identity = [context.provider, context.repository, context.pullRequest?.id ?? context.pipelineId ?? context.jobId].filter(Boolean).join(':')

  return createHash('sha256').update(identity).digest('hex')
}

/**
 * CI-side Kubb Studio agent. It registers a machine, keeps a generation session open,
 * and submits generation or snapshot jobs to Studio.
 */
export class StudioAgent {
  readonly #options: StudioAgentOptions
  #context: CIContext | undefined
  #studioUrl: string | undefined
  #credentials: StudioAgentCredentials | undefined
  #client: Client | undefined

  constructor(options: StudioAgentOptions) {
    this.#options = options
  }

  get credentials(): StudioAgentCredentials {
    if (!this.#credentials) throw new Error('StudioAgent must be connected before reading credentials')

    return this.#credentials
  }

  async connect(): Promise<StudioAgentCredentials> {
    if (this.#client && this.#credentials) return this.#credentials

    const context = this.#options.context ?? detectCIContext()
    if (!context) throw new Error('Kubb Studio agents require a CI environment')

    const studioUrl = (this.#options.studioUrl ?? defaultStudioUrl).replace(/\/$/, '')
    const agentMachineToken = this.#options.machineToken ?? machineToken(context)
    const credentials = await createAgent({
      studioUrl,
      token: this.#options.token,
      name: this.#options.name ?? context.repository ?? `${context.provider} CI`,
      machineToken: agentMachineToken,
    })
    const client = createClient({
      token: credentials.token,
      machineToken: agentMachineToken,
      studioUrl,
      configPath: this.#options.configPath,
      version: this.#options.version,
      root: this.#options.root,
      loadConfig: this.#options.loadConfig,
      poolSize: this.#options.poolSize,
      client: { kind: 'ci' },
      permissions: { allowWrite: true, allowConfigEdit: false, allowInput: false, allowExec: true },
      installLogger: this.#options.installLogger,
    })

    try {
      await client.connect()
    } catch (error) {
      client.disconnect()
      throw error
    }

    this.#context = context
    this.#studioUrl = studioUrl
    this.#credentials = credentials
    this.#client = client

    return credentials
  }

  async generate(options: StudioAgentJobOptions = {}): Promise<StudioAgentJob> {
    return this.#run('generation', options)
  }

  async snapshot(options: StudioAgentJobOptions = {}): Promise<StudioSnapshot> {
    const job = await this.#run('snapshot', options)

    if (job.status !== 'success' || !job.snapshot) {
      throw new Error(job.error ?? 'Snapshot creation failed')
    }

    return job.snapshot
  }

  disconnect(): void {
    this.#client?.disconnect()
    this.#client = undefined
  }

  async #run(type: JobType, options: StudioAgentJobOptions): Promise<StudioAgentJob> {
    const credentials = await this.connect()
    const context = this.#context!
    const studioUrl = this.#studioUrl!

    const job = await createJob({
      studioUrl,
      token: this.#options.token,
      type,
      agentId: credentials.id,
      context,
      name: options.name ?? this.#options.name,
      version: options.snapshotVersion ?? this.#options.snapshotVersion,
    })

    const result = await waitForJob({ studioUrl, token: this.#options.token, id: job.id })

    return result
  }
}

export function createStudioAgent(options: StudioAgentOptions): StudioAgent {
  return new StudioAgent(options)
}
