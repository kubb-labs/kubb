import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublishedSnapshot } from '@kubb/studio/protocol'
import type { SnapshotOptions } from './run.ts'

vi.mock('../../config.ts', () => ({
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
  read: vi.fn().mockRejectedValue(new Error('ENOENT')),
}))
vi.mock('@kubb/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kubb/studio')>()),
  createSnapshot: vi.fn(),
}))

const { createSnapshot } = await import('@kubb/studio')
const { detectCi } = await import('./ci.ts')
const { formatBranchChanges, formatChanges, snapshot } = await import('./snapshot.ts')

const published: PublishedSnapshot = {
  id: 'snap-1',
  name: '@acme/api',
  version: '1.0.0',
  integrity: 'sha512-abc',
  agent: { id: 'agent-1', name: 'acme/api#42', slug: 'brave-otter' },
  url: '/packages/brave-otter/%40acme%2Fapi.tgz',
  snapshotIdUrl: '/packages/snap-1/snapshot.tgz',
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-08T00:00:00.000Z',
  changes: {
    base: { id: 'snap-0', version: '1.0.0', commit: '9f3e2a1bb', createdAt: '2026-01-01T00:00:00.000Z' },
    added: ['models/PetStatus.ts'],
    changed: ['models/Pet.ts'],
    removed: [],
  },
}
const branchChanges = { base: null, added: [], changed: [], removed: [], baseFound: true }

function baseOptions(overrides: Partial<SnapshotOptions> = {}): SnapshotOptions {
  return {
    studioUrl: 'http://localhost:3000',
    token: 'ci-token',
    name: '@acme/api',
    packageVersion: '1.0.0',
    ...overrides,
  }
}

function printedJson() {
  return JSON.parse(String(vi.mocked(console.log).mock.calls[0]?.[0]))
}

beforeEach(() => {
  vi.mocked(createSnapshot).mockResolvedValue(published)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  delete process.env.KUBB_TOKEN
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('snapshot', () => {
  it('publishes under the detected CI identity, with the CI key and commit', async () => {
    await snapshot(baseOptions())

    expect(vi.mocked(createSnapshot)).toHaveBeenCalledWith(
      expect.objectContaining({
        studioUrl: 'http://localhost:3000',
        apiKey: 'ci-token',
        id: 'gh:123:42',
        name: 'acme/api#42',
        packageName: '@acme/api',
        version: '1.0.0',
        commit: 'c4d7e10aa',
        baseId: undefined,
      }),
    )
  })

  it('prints one JSON line with absolute URLs, the agent page and the changes', async () => {
    await snapshot(baseOptions({ json: true }))

    expect(vi.mocked(console.log)).toHaveBeenCalledOnce()
    expect(printedJson()).toMatchObject({
      url: 'http://localhost:3000/packages/brave-otter/%40acme%2Fapi.tgz',
      snapshotIdUrl: 'http://localhost:3000/packages/snap-1/snapshot.tgz',
      agentUrl: 'http://localhost:3000/agents/brave-otter',
      changes: published.changes,
    })
  })

  it("compares with the base branch's agent, and labels those changes with the branch", async () => {
    vi.mocked(detectCi).mockReturnValueOnce({ id: 'gh:123:42', name: 'acme/api#42', base: { branch: 'main', id: 'gh:123:refs/heads/main' } })
    vi.mocked(createSnapshot).mockResolvedValue({ ...published, branchChanges })

    await snapshot(baseOptions({ json: true }))

    expect(vi.mocked(createSnapshot)).toHaveBeenCalledWith(expect.objectContaining({ baseId: 'gh:123:refs/heads/main' }))
    expect(printedJson().branchChanges).toStrictEqual({ ...branchChanges, branch: 'main' })
  })

  it('compares with the agent --base-id names on any CI, labeled with that id', async () => {
    vi.mocked(createSnapshot).mockResolvedValue({ ...published, branchChanges })

    await snapshot(baseOptions({ json: true, id: 'jenkins:api:pr-12', baseId: 'jenkins:api:main' }))

    expect(vi.mocked(createSnapshot)).toHaveBeenCalledWith(expect.objectContaining({ id: 'jenkins:api:pr-12', baseId: 'jenkins:api:main' }))
    expect(printedJson().branchChanges).toStrictEqual({ ...branchChanges, branch: 'jenkins:api:main' })
  })

  it('drops the detected base for a custom --id, and any base that names the run itself', async () => {
    const detected = { id: 'gh:123:42', name: 'acme/api#42', base: { branch: 'main', id: 'gh:123:refs/heads/main' } }
    vi.mocked(detectCi).mockReturnValueOnce(detected).mockReturnValueOnce(detected)

    await snapshot(baseOptions({ id: 'custom:pr-42' }))
    await snapshot(baseOptions({ id: 'custom:main', baseId: 'custom:main' }))

    expect(vi.mocked(createSnapshot).mock.calls.map(([options]) => options.baseId)).toStrictEqual([undefined, undefined])
  })

  it('logs the run to stderr in JSON mode', async () => {
    await snapshot(baseOptions({ json: true }))

    expect(vi.mocked(console.error).mock.calls.map(([line]) => String(line))).toStrictEqual(['Generating the snapshot', 'Snapshot published'])
  })

  it('reports a failed publish and passes its error on', async () => {
    vi.mocked(createSnapshot).mockRejectedValue(new Error('Kubb Studio refused the snapshot (status 402): Snapshot limit reached.'))

    await expect(snapshot(baseOptions())).rejects.toThrow('Snapshot limit reached')
    expect(vi.mocked(console.log)).toHaveBeenCalledWith('Snapshot failed')
  })

  it('rejects before generating when no token comes from --token or KUBB_TOKEN', async () => {
    await expect(snapshot(baseOptions({ token: undefined }))).rejects.toThrow('KUBB_TOKEN')
    expect(createSnapshot).not.toHaveBeenCalled()
  })

  it('falls back to package.json when only one of --name or --version is given, and fails when none exists', async () => {
    await expect(snapshot(baseOptions({ name: '@acme/override', packageVersion: undefined }))).rejects.toThrow('No package.json')
  })
})

describe('formatChanges', () => {
  const base = { id: 'snap-0', version: '1.0.0', commit: '9f3e2a1bbccdd', createdAt: '2026-01-01T00:00:00.000Z' }

  it.each([
    {
      changes: { base, added: ['a.ts', 'b.ts'], changed: ['c.ts'], removed: ['d.ts'] },
      expected: '2 added, 1 changed, 1 removed since 9f3e2a1',
      label: 'counts each kind since the short commit of the previous snapshot',
    },
    {
      changes: { base: { ...base, commit: undefined }, added: [], changed: ['c.ts'], removed: [] },
      expected: '0 added, 1 changed, 0 removed since 2026-01-01T00:00:00.000Z',
      label: 'falls back to the date when the previous snapshot has no commit',
    },
    { changes: { base: null, added: ['a.ts'], changed: [], removed: [] }, expected: 'First snapshot', label: 'names a first snapshot' },
  ])('$label', ({ changes, expected }) => {
    expect(formatChanges(changes)).toBe(expected)
  })
})

describe('formatBranchChanges', () => {
  const base = { id: 'snap-main', version: '1.0.0', commit: 'a1b2c3d4e', createdAt: '2026-01-01T00:00:00.000Z' }

  it.each([
    {
      changes: { branch: 'main', base, added: ['a.ts'], changed: [], removed: ['b.ts'], baseFound: true },
      expected: '1 added, 0 changed, 1 removed against main',
      label: 'counts each kind against the branch',
    },
    {
      changes: { branch: 'main', base: null, added: [], changed: [], removed: [], baseFound: false },
      expected: 'No snapshot of main to compare with',
      label: 'says so when no CI agent is registered for the branch yet',
    },
    {
      changes: { branch: 'main', base: null, added: [], changed: [], removed: [], baseFound: true },
      expected: 'No snapshot of main for this package yet',
      label: 'says so when the branch has an agent but no snapshot of this package yet',
    },
  ])('$label', ({ changes, expected }) => {
    expect(formatBranchChanges(changes)).toBe(expected)
  })
})
