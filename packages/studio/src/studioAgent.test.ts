import { afterEach, expect, it, vi } from 'vitest'

const { createStudioAgent } = await import('./studioAgent.ts')

afterEach(() => {
  vi.unstubAllGlobals()
})

it('connects a Studio agent and creates a snapshot', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'agent-1', slug: 'ci-agent', token: 'agent-token' }), { headers: { 'content-type': 'application/json' } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ job: { id: 'job-1', status: 'queued' } }), { headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ job: { id: 'job-1', status: 'success', snapshot: { id: 'snapshot-1' } } }), {
          headers: { 'content-type': 'application/json' },
        }),
      ),
  )

  const agent = createStudioAgent({
    token: 'ci-token',
    configPath: 'kubb.config.ts',
    version: '1.0.0',
    loadConfig: async () => ({ plugins: [] }) as never,
    context: { provider: 'gitlab', repository: 'kubb-labs/kubb', pipelineId: '1' },
    poolSize: 0,
  })

  await expect(agent.snapshot()).resolves.toEqual({ id: 'snapshot-1' })
  expect(agent.credentials).toEqual({ id: 'agent-1', slug: 'ci-agent', token: 'agent-token' })
  expect(fetch).toHaveBeenCalledTimes(4)
  expect(JSON.parse((vi.mocked(fetch).mock.calls[2]?.[1] as RequestInit).body as string)).toMatchObject({ type: 'snapshot', agentId: 'agent-1' })

  agent.disconnect()
})
