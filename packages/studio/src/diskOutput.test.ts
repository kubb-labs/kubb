import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveCacheDir } from '@kubb/core'
import { expect, it, vi } from 'vitest'
import { type OpenRpc, runAgent } from './connect.ts'
import type { AgentApi } from './protocol.ts'
import { projectConfig } from './testing.ts'

it('reviews existing disk output and stages a later run without changing the project', async () => {
  const root = await mkdtemp(join(tmpdir(), 'studio-disk-output-'))
  const shutdown = new AbortController()
  const ready = Promise.withResolvers<AgentApi>()
  const closed = Promise.withResolvers<{ code: number; reason: string }>()
  const openRpc: OpenRpc = ({ agent }) => {
    ready.resolve(agent)
    return { studio: { ping: vi.fn().mockResolvedValue(undefined) }, closed: closed.promise, close: () => closed.resolve({ code: 1000, reason: '' }) }
  }
  await mkdir(join(root, 'src/gen'), { recursive: true })
  const original = '  // local note\nexport const pet = 0\n\n'
  await writeFile(join(root, 'src/gen/pet.ts'), original)
  await writeFile(join(root, 'src/gen/docs.html'), '<h1>Docs</h1>')
  const done = runAgent({
    options: {
      root,
      token: 'test',
      studioUrl: 'https://studio.test',
      configPath: 'kubb.config.ts',
      version: 'test',
      permissions: { allowRead: true },
      loadConfig: async () => projectConfig({ projectRoot: root }),
      signal: shutdown.signal,
    },
    openRpc,
  })
  try {
    const agent = await ready.promise
    const payload = await agent.connect({ sandbox: false, agentSlug: 'test', studioVersion: 'test' })
    const output = payload.output!
    expect(output.hashes['src/gen/pet.ts']).toMatch(/^[0-9a-f]{16}$/)
    await expect(agent.readFiles({ jobId: output.jobId, paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': original } })
    await agent.startGeneration({ jobId: 'generated', config: {} }).result()
    expect(await readFile(join(root, 'src/gen/pet.ts'), 'utf8')).toBe(original)
    await expect(agent.readFiles({ jobId: 'generated', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1\n' },
    })
    const diff = await agent.readDiff({ jobId: 'generated', path: 'src/gen/pet.ts', base: { jobId: output.jobId }, limit: 100 })
    expect(diff.hunks.flatMap((hunk) => hunk.lines)).toContain('-  // local note')
  } finally {
    shutdown.abort()
    await done
    await Promise.all([rm(root, { recursive: true, force: true }), rm(resolveCacheDir(root), { recursive: true, force: true })])
  }
})
