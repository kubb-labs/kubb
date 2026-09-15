import { afterEach, expect, it, vi } from 'vitest'

const connect = vi.fn()
const disconnect = vi.fn()
vi.mock('./client.ts', () => ({ createClient: vi.fn(() => ({ connect, disconnect })) }))
vi.mock('./ci.ts', () => ({ detectCIContext: vi.fn(() => ({ provider: 'gitlab', repository: 'kubb-labs/kubb', pipelineId: '1' })) }))

const { runSnapshotJob } = await import('./ciJob.ts')

afterEach(() => {
  vi.restoreAllMocks()
  connect.mockReset()
  disconnect.mockReset()
})

it('creates a CI agent, submits one snapshot job, and polls it to completion', async () => {
  connect.mockResolvedValue(undefined)
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'agent-1', token: 'agent-token' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ job: { id: 'job-1', status: 'queued' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ job: { id: 'job-1', status: 'success', snapshot: { id: 'snapshot-1' } } }))),
  )

  await expect(
    runSnapshotJob({ token: 'ci-token', configPath: 'kubb.config.ts', version: '1.0.0', loadConfig: async () => ({ plugins: [] }) as never }),
  ).resolves.toEqual({ id: 'snapshot-1' })

  expect(fetch).toHaveBeenCalledTimes(3)
  const [url] = vi.mocked(fetch).mock.calls[1] ?? []
  expect(url?.toString()).toMatch(/\/api\/jobs$/)
  expect(JSON.parse((vi.mocked(fetch).mock.calls[1]?.[1] as RequestInit).body as string)).toMatchObject({ type: 'snapshot' })
  expect(disconnect).toHaveBeenCalledOnce()
})
