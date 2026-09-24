import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hookable, type KubbHooks } from '@kubb/core'
import { type ConnectionOptions, InvalidAgentTokenError, type StudioAgent, type StudioJob } from '@kubb/studio'
import type { SnapshotOptions } from './run.ts'

vi.mock('../generate/utils.ts', () => ({
  getConfigs: vi.fn().mockResolvedValue({
    configPath: '/project/kubb.config.ts',
    configs: [{ name: 'test', input: 'spec.yaml', output: { path: './gen' }, plugins: [] }],
  }),
}))
vi.mock('./ci.ts', () => ({
  detectCi: vi.fn(() => ({ id: 'gh:123:42', name: 'acme/api#42', commit: 'c4d7e10aa' })),
}))
// No package.json anywhere: proves --name/--version overrides skip the filesystem lookup entirely,
// and that omitting either still falls back to it.
vi.mock('@internals/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@internals/utils')>()),
  exists: vi.fn().mockResolvedValue(false),
  read: vi.fn(),
}))

type Connection = ConnectionOptions<{ token: string }>

let session: (hooks: Hookable<KubbHooks>, options: Connection) => Promise<void>
let connection: Connection | undefined

vi.mock('@kubb/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kubb/studio')>()),
  createAgent: vi.fn(),
  createJob: vi.fn(),
  waitForJob: vi.fn(),
  // Holds the connection open until the host aborts it, like the real `runConnection`.
  runConnection: vi.fn(async (options: Connection) => {
    connection = options
    const hooks = new Hookable<KubbHooks>()
    await options.clientOptions(options.credentials).installLogger?.(hooks)
    await session(hooks, options)

    if (!options.signal?.aborted) {
      await new Promise((resolve) => options.signal?.addEventListener('abort', resolve, { once: true }))
    }

    return 'shutdown'
  }),
}))

const { createAgent, createJob, waitForJob, runConnection } = await import('@kubb/studio')
const { detectCi } = await import('./ci.ts')
const { formatBranchChanges, formatChanges, snapshot } = await import('./snapshot.ts')

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
    changes: {
      base: { id: 'snap-0', version: '1.0.0', commit: '9f3e2a1bb', createdAt: '2026-01-01T00:00:00.000Z' },
      added: ['models/PetStatus.ts'],
      changed: ['models/Pet.ts'],
      removed: [],
    },
  },
}

function baseOptions(overrides: Partial<SnapshotOptions> = {}): SnapshotOptions {
  return {
    version: '0.0.0',
    studioUrl: 'http://localhost:3000',
    permission: { allowRead: false, allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false },
    autoOpen: false,
    token: 'ci-token',
    name: '@acme/api',
    packageVersion: '1.0.0',
    ...overrides,
  }
}

async function acceptedSession(hooks: Hookable<KubbHooks>): Promise<void> {
  await hooks.callHook('studio:connecting', { url: 'http://localhost:3000' })
  await hooks.callHook('studio:connected', { url: 'http://localhost:3000', versions: { kubb: '5.0.0', agent: '5.0.0' } })
  await hooks.callHook('studio:ready', {})
}

beforeEach(() => {
  session = acceptedSession
  connection = undefined
  vi.mocked(createAgent).mockResolvedValue(agent)
  vi.mocked(createJob).mockResolvedValue({ id: 'job-1', status: 'queued' })
  vi.mocked(waitForJob).mockResolvedValue(successfulJob)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  delete process.env.KUBB_AGENT_SECRET
  delete process.env.KUBB_TOKEN
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('snapshot', () => {
  it('sets KUBB_AGENT_SECRET before connecting, so the socket registers under the same machine token', async () => {
    const order: Array<string> = []
    vi.mocked(createAgent).mockImplementation(async () => {
      order.push(`createAgent:${process.env.KUBB_AGENT_SECRET}`)
      return agent
    })
    session = async (hooks) => {
      order.push(`connect:${process.env.KUBB_AGENT_SECRET}`)
      await acceptedSession(hooks)
    }

    await snapshot(baseOptions({ id: 'gh:123:42' }))

    expect(order).toEqual(['createAgent:gh:123:42', 'connect:gh:123:42'])
    expect(vi.mocked(createAgent)).toHaveBeenCalledWith(expect.objectContaining({ name: 'acme/api#42' }))
  })

  it("reuses kubb-labs/action's GitHub identity through CI auto-detection when --id is omitted", async () => {
    await snapshot(baseOptions())

    expect(vi.mocked(createAgent)).toHaveBeenCalledWith(expect.objectContaining({ name: 'acme/api#42' }))
  })

  it('connects with the CI agent token and grants only what was passed as a flag, even inside a CI job', async () => {
    await snapshot(baseOptions({ permission: { allowRead: false, allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: true } }))

    expect(connection?.credentials).toStrictEqual({ token: 'agent-token' })
    expect(connection?.clientOptions({ token: 'agent-token' }).permissions).toStrictEqual({
      allowRead: false,
      allowWrite: false,
      allowConfigEdit: false,
      allowInput: false,
      allowExec: true,
    })
  })

  it('queues a snapshot job with the detected commit, and prints the result with absolute URLs and its changes', async () => {
    const log = vi.mocked(console.log)

    await snapshot(baseOptions({ json: true }))

    expect(vi.mocked(createJob)).toHaveBeenCalledWith(expect.objectContaining({ type: 'snapshot', agentId: 'agent-1', commit: 'c4d7e10aa' }))
    expect(log).toHaveBeenCalledOnce()
    const printed = JSON.parse(String(log.mock.calls[0]?.[0]))
    expect(printed.url).toBe('http://localhost:3000/packages/brave-otter/%40acme%2Fapi.tgz')
    expect(printed.changes).toStrictEqual(successfulJob.snapshot?.changes)
  })

  it("compares with the base branch's agent, and labels those changes with the branch", async () => {
    vi.mocked(detectCi).mockReturnValueOnce({ id: 'gh:123:42', name: 'acme/api#42', base: { branch: 'main', id: 'gh:123:refs/heads/main' } })
    const branchChanges = { base: null, added: [], changed: [], removed: [] }
    vi.mocked(waitForJob).mockResolvedValue({ ...successfulJob, snapshot: { ...successfulJob.snapshot!, branchChanges } })

    await snapshot(baseOptions({ json: true }))

    expect(vi.mocked(createJob)).toHaveBeenCalledWith(expect.objectContaining({ baseId: 'gh:123:refs/heads/main' }))
    const printed = JSON.parse(String(vi.mocked(console.log).mock.calls[0]?.[0]))
    expect(printed.branchChanges).toStrictEqual({ ...branchChanges, branch: 'main' })
  })

  it('logs the run to stderr in JSON mode, through the same logger as kubb studio', async () => {
    const error = vi.mocked(console.error)

    await snapshot(baseOptions({ json: true }))

    const lines = error.mock.calls.map(([line]) => String(line))
    expect(lines).toEqual(
      expect.arrayContaining([
        'Creating Kubb Studio agent',
        'Connecting to http://localhost:3000',
        'Connected to http://localhost:3000 (v5.0.0)',
        '✓ Ready to receive jobs',
        'Creating snapshot job',
        'Snapshot job queued: job-1',
        'Snapshot published',
        'Disconnecting from Kubb Studio',
      ]),
    )
  })

  it('shows a retry the same way kubb studio does', async () => {
    session = async (hooks) => {
      await hooks.callHook('studio:reconnecting', { delayMs: 30_000 })
      await acceptedSession(hooks)
    }

    await snapshot(baseOptions({ json: true }))

    expect(vi.mocked(console.error)).toHaveBeenCalledWith('Retrying connection to Kubb Studio in 30.00s')
  })

  it('fails fast when Studio rejects the CI agent token, instead of waiting for the job timeout', async () => {
    const rejected = new InvalidAgentTokenError('http://localhost:3000')
    session = async (hooks, options) => {
      await acceptedSession(hooks)
      await options.onTokenRejected({ error: rejected, credentials: options.credentials, live: true })
    }
    vi.mocked(waitForJob).mockReturnValue(new Promise(() => {}))

    await expect(snapshot(baseOptions())).rejects.toBe(rejected)
  })

  it('throws when the job fails', async () => {
    vi.mocked(waitForJob).mockResolvedValue({ id: 'job-1', status: 'failed', error: 'Agent does not report peer dependencies' })

    await expect(snapshot(baseOptions())).rejects.toThrow('Agent does not report peer dependencies')
  })

  it('ends the connection even when the job fails', async () => {
    vi.mocked(waitForJob).mockResolvedValue({ id: 'job-1', status: 'failed', error: 'boom' })

    await expect(snapshot(baseOptions())).rejects.toThrow()
    expect(runConnection).toHaveBeenCalledOnce()
    expect(connection?.signal?.aborted).toBe(true)
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

describe('formatChanges', () => {
  const base = { id: 'snap-0', version: '1.0.0', commit: '9f3e2a1bbccdd', createdAt: '2026-01-01T00:00:00.000Z' }

  it('counts each kind since the short commit of the previous snapshot', () => {
    expect(formatChanges({ base, added: ['a.ts', 'b.ts'], changed: ['c.ts'], removed: ['d.ts'] })).toBe('2 added, 1 changed, 1 removed since 9f3e2a1')
  })

  it('says so when nothing changed', () => {
    expect(formatChanges({ base, added: [], changed: [], removed: [] })).toBe('No changes since 9f3e2a1')
  })

  it('falls back to the date when the previous snapshot has no commit', () => {
    expect(formatChanges({ base: { ...base, commit: undefined }, added: [], changed: ['c.ts'], removed: [] })).toBe(
      '0 added, 1 changed, 0 removed since 2026-01-01T00:00:00.000Z',
    )
  })

  it('names a first snapshot', () => {
    expect(formatChanges({ base: null, added: ['a.ts'], changed: [], removed: [] })).toBe('First snapshot')
  })
})

describe('formatBranchChanges', () => {
  const base = { id: 'snap-main', version: '1.0.0', commit: 'a1b2c3d4e', createdAt: '2026-01-01T00:00:00.000Z' }

  it('counts each kind against the branch', () => {
    expect(formatBranchChanges({ branch: 'main', base, added: ['a.ts'], changed: [], removed: ['b.ts'] })).toBe('1 added, 0 changed, 1 removed against main')
  })

  it('says so when the branch has no snapshot yet', () => {
    expect(formatBranchChanges({ branch: 'main', base: null, added: [], changed: [], removed: [] })).toBe('No snapshot of main to compare with')
  })
})
