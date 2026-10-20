import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveCacheDir } from '@kubb/core'
import { expect, it, vi } from 'vitest'
import { type OpenRpc, runAgent } from './connect.ts'
import { type AgentApi, AgentMessage } from './protocol.ts'
import { projectConfig } from './testing.ts'

function startAgent(root: string) {
  const shutdown = new AbortController()
  const ready = Promise.withResolvers<AgentApi>()
  const closed = Promise.withResolvers<{ code: number; reason: string }>()
  const openRpc: OpenRpc = ({ agent }) => {
    ready.resolve(agent)
    return { studio: { ping: vi.fn().mockResolvedValue(undefined) }, closed: closed.promise, close: () => closed.resolve({ code: 1000, reason: '' }) }
  }
  const done = runAgent({
    options: {
      root,
      token: 'test',
      studioUrl: 'https://studio.test',
      configPath: 'kubb.config.ts',
      version: 'test',
      permissions: { allowRead: true },
      loadConfigs: async () => [projectConfig({ projectRoot: root })],
      signal: shutdown.signal,
    },
    openRpc,
  })
  return {
    agent: ready.promise,
    async stop() {
      shutdown.abort()
      await done
    },
  }
}

it('reviews disk output, stages a run, and retains both across reconnects within separate budgets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'studio-disk-output-'))
  await mkdir(join(root, 'src/gen'), { recursive: true })
  const original = '  // local note\nexport const pet = 0\n\n'
  await writeFile(join(root, 'src/gen/pet.ts'), original)
  await writeFile(join(root, 'src/gen/docs.html'), '<h1>Docs</h1>')
  vi.stubEnv('KUBB_AGENT_MAX_GENERATIONS', '1')
  vi.stubEnv('KUBB_AGENT_MAX_GENERATIONS_MB', String(64 / (1024 * 1024)))
  const instances = [startAgent(root)]
  const info = { sandbox: false, agentSlug: 'test', studioVersion: 'test' }
  try {
    const agent = await instances[0]!.agent
    const output = (await agent.connect(info)).output!
    await expect(agent.readFiles({ jobId: output.jobId, paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': original } })
    await agent.startGeneration({ jobId: 'generated', config: {} }).result()
    expect(await readFile(join(root, 'src/gen/pet.ts'), 'utf8')).toBe(original)
    await instances[0]!.stop()

    const restart = startAgent(root)
    instances.push(restart)
    const reconnected = await restart.agent
    expect((await reconnected.connect(info)).output?.jobId).toBe(output.jobId)
    await expect(reconnected.readFiles({ jobId: 'generated', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1\n' },
    })
    const diff = await reconnected.readDiff({ jobId: 'generated', path: 'src/gen/pet.ts', base: { jobId: output.jobId }, limit: 100 })
    expect(diff.hunks.flatMap((hunk) => hunk.lines)).toContain('-  // local note')

    await writeFile(join(root, 'src/gen/pet.ts'), 'changed local output\n')
    const changed = (await reconnected.connect(info)).output!
    expect(changed.jobId).not.toBe(output.jobId)
    await expect(reconnected.readFiles({ jobId: output.jobId, paths: ['src/gen/pet.ts'] })).rejects.toThrow(AgentMessage.GENERATION_GONE)
    await expect(reconnected.readFiles({ jobId: 'generated', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1\n' },
    })
  } finally {
    await Promise.all(instances.map((instance) => instance.stop()))
    vi.unstubAllEnvs()
    await Promise.all([rm(root, { recursive: true, force: true }), rm(resolveCacheDir(root), { recursive: true, force: true })])
  }
})
