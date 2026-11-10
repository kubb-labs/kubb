import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveCacheDir } from '@kubb/core'
import { expect, it, vi } from 'vitest'
import { type OpenRpc, runStudioRunner } from './connect.ts'
import { type RunnerApi, RunnerMessage } from './protocol.ts'
import { projectConfig } from './testing.ts'

function startRunner(root: string) {
  const shutdown = new AbortController()
  const ready = Promise.withResolvers<RunnerApi>()
  const closed = Promise.withResolvers<{ code: number; reason: string }>()
  const openRpc: OpenRpc = ({ runner }) => {
    ready.resolve(runner)
    return { studio: { ping: vi.fn().mockResolvedValue(undefined) }, closed: closed.promise, close: () => closed.resolve({ code: 1000, reason: '' }) }
  }
  const done = runStudioRunner({
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
    runner: ready.promise,
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
  vi.stubEnv('KUBB_RUNNER_MAX_GENERATIONS', '1')
  vi.stubEnv('KUBB_RUNNER_MAX_GENERATIONS_MB', String(64 / (1024 * 1024)))
  const instances = [startRunner(root)]
  const info = { sandbox: false, projectSlug: 'test', studioVersion: 'test' }
  try {
    const runner = await instances[0]!.runner
    const output = (await runner.connect(info)).config.configs[0]!.disk!
    await expect(runner.readFiles({ jobId: output.jobId, paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': original } })
    await runner.startGeneration({ jobId: 'generated', config: {} }).result()
    expect(await readFile(join(root, 'src/gen/pet.ts'), 'utf8')).toBe(original)
    await instances[0]!.stop()

    const restart = startRunner(root)
    instances.push(restart)
    const reconnected = await restart.runner
    expect((await reconnected.connect(info)).config.configs[0]!.disk?.jobId).toBe(output.jobId)
    await expect(reconnected.readFiles({ jobId: 'generated', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1\n' },
    })
    const diff = await reconnected.readDiff({ jobId: 'generated', path: 'src/gen/pet.ts', base: { jobId: output.jobId }, limit: 100 })
    expect(diff.hunks.flatMap((hunk) => hunk.lines)).toContain('-  // local note')

    await writeFile(join(root, 'src/gen/pet.ts'), 'changed local output\n')
    const changed = (await reconnected.connect(info)).config.configs[0]!.disk!
    expect(changed.jobId).not.toBe(output.jobId)
    await expect(reconnected.readFiles({ jobId: output.jobId, paths: ['src/gen/pet.ts'] })).rejects.toThrow(RunnerMessage.GENERATION_GONE)
    await expect(reconnected.readFiles({ jobId: 'generated', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1\n' },
    })
  } finally {
    await Promise.all(instances.map((instance) => instance.stop()))
    vi.unstubAllEnvs()
    await Promise.all([rm(root, { recursive: true, force: true }), rm(resolveCacheDir(root), { recursive: true, force: true })])
  }
})
