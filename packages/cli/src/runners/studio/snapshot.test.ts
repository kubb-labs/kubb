import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudioAgent, StudioJob } from '@kubb/studio'
import type { StudioOptions } from './run.ts'

vi.mock('../generate/utils.ts', () => ({
  getConfigs: vi.fn().mockResolvedValue({
    configPath: '/project/kubb.config.ts',
    configs: [{ name: 'test', input: 'spec.yaml', output: { path: './gen' }, plugins: [] }],
  }),
}))
vi.mock('./ci.ts', () => ({
  detectCi: vi.fn(() => ({ id: 'gh:123:42', name: 'acme/api#42' })),
}))
// No package.json anywhere: proves --name/--version overrides skip the filesystem lookup entirely,
// and that omitting either still falls back to it.
vi.mock('node:fs', () => ({ existsSync: vi.fn(() => false), readFileSync: vi.fn() }))

const connect = vi.fn().mockResolvedValue(undefined)
const disconnect = vi.fn()
let installLogger: ((hooks: { hook: (event: string, cb: (payload?: unknown) => void) => void }) => void | Promise<void>) | undefined

vi.mock('@kubb/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kubb/studio')>()),
  createAgent: vi.fn(),
  createJob: vi.fn(),
  waitForJob: vi.fn(),
  createClient: vi.fn((clientOptions) => {
    installLogger = clientOptions.installLogger
    return { connect, disconnect }
  }),
}))

const { createAgent, createJob, waitForJob } = await import('@kubb/studio')
const { snapshot } = await import('./snapshot.ts')

const agent: StudioAgent = { id: 'agent-1', slug: 'brave-otter', name: 'acme/api#42', token: 'agent-token' }

const successfulJob: StudioJob = {
  id: 'job-1',
  status: 'success',
  snapshot: {
    id: 'snap-1',
    name: '@acme/api',
    version: '1.0.0',
    integrity: 'sha512-abc',
    url: '/packages/brave-otter/%40acme%2Fapi.tgz',
    snapshotIdUrl: '/packages/snap-1/snapshot.tgz',
    expiresAt: '2026-01-08T00:00:00.000Z',
  },
}

function baseOptions(overrides: Partial<StudioOptions> = {}): StudioOptions {
  return {
    action: 'snapshot',
    version: '0.0.0',
    studioUrl: 'http://localhost:3000',
    permission: { allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false },
    autoOpen: false,
    token: 'ci-token',
    name: '@acme/api',
    packageVersion: '1.0.0',
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(createAgent).mockResolvedValue(agent)
  connect.mockImplementation(async () => {
    await installLogger?.({ hook: (event, cb) => (event === 'studio:ready' ? cb() : undefined) })
  })
  vi.mocked(createJob).mockResolvedValue({ id: 'job-1', status: 'queued' })
  vi.mocked(waitForJob).mockResolvedValue(successfulJob)
  delete process.env.KUBB_AGENT_SECRET
  delete process.env.KUBB_TOKEN
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('snapshot', () => {
  it('sets KUBB_AGENT_SECRET before connecting, so the socket registers under the same machine token', async () => {
    const connectOrder: Array<string> = []
    vi.mocked(createAgent).mockImplementation(async () => {
      connectOrder.push(`createAgent:${process.env.KUBB_AGENT_SECRET}`)
      return agent
    })
    connect.mockImplementation(async () => {
      connectOrder.push(`connect:${process.env.KUBB_AGENT_SECRET}`)
      await installLogger?.({ hook: (event, cb) => (event === 'studio:ready' ? cb() : undefined) })
    })

    await snapshot(baseOptions({ id: 'gh:123:42' }))

    expect(connectOrder).toEqual(['createAgent:gh:123:42', 'connect:gh:123:42'])
  })

  it("reuses kubb-labs/action's GitHub identity through CI auto-detection when --id is omitted", async () => {
    await snapshot(baseOptions())

    expect(vi.mocked(createAgent)).toHaveBeenCalledWith(expect.objectContaining({ name: 'acme/api#42' }))
  })

  it('queues a snapshot job for the created agent and resolves the tarball to an absolute URL', async () => {
    await snapshot(baseOptions({ json: true }))

    expect(vi.mocked(createJob)).toHaveBeenCalledWith(expect.objectContaining({ type: 'snapshot', agentId: 'agent-1' }))

    const logSpy = vi.spyOn(console, 'log')
    await snapshot(baseOptions({ json: true }))
    const printed = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]))
    expect(printed.url).toBe('http://localhost:3000/packages/brave-otter/%40acme%2Fapi.tgz')
    logSpy.mockRestore()
  })

  it('throws when the job fails', async () => {
    vi.mocked(waitForJob).mockResolvedValue({ id: 'job-1', status: 'failed', error: 'Agent does not report peer dependencies' })

    await expect(snapshot(baseOptions())).rejects.toThrow('Agent does not report peer dependencies')
  })

  it('disconnects the client even when the job fails', async () => {
    vi.mocked(waitForJob).mockResolvedValue({ id: 'job-1', status: 'failed', error: 'boom' })

    await expect(snapshot(baseOptions())).rejects.toThrow()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('requires a token from --token or KUBB_TOKEN', async () => {
    await expect(snapshot(baseOptions({ token: undefined }))).rejects.toThrow('KUBB_TOKEN')
  })

  it('rejects a non-positive or non-finite --timeout before touching the network', async () => {
    await expect(snapshot(baseOptions({ timeout: 0 }))).rejects.toThrow('--timeout must be a positive number of seconds')
    await expect(snapshot(baseOptions({ timeout: Number.NaN }))).rejects.toThrow('--timeout must be a positive number of seconds')
    expect(createAgent).not.toHaveBeenCalled()
  })

  it('refuses to send the CI key to a non-HTTPS, non-loopback Studio URL', async () => {
    await expect(snapshot(baseOptions({ studioUrl: 'http://studio.internal' }))).rejects.toThrow('Refusing to send the CI API key')
    expect(createAgent).not.toHaveBeenCalled()
  })

  it('skips the package.json lookup entirely once both --name and --version are given', async () => {
    await snapshot(baseOptions({ name: '@acme/override', packageVersion: '9.9.9' }))

    expect(vi.mocked(createJob)).toHaveBeenCalledWith(expect.objectContaining({ name: '@acme/override', version: '9.9.9' }))
  })

  it('falls back to package.json when only one of --name or --version is given, and fails when none exists', async () => {
    await expect(snapshot(baseOptions({ name: '@acme/override', packageVersion: undefined }))).rejects.toThrow('No package.json')
  })
})
