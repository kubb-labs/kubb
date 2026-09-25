import { memoryStorage } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createGenerationStore, type GenerationStore, type SourceFiles } from './generations.ts'

function sourceFiles(files: Record<string, string>): SourceFiles {
  const storage = memoryStorage()
  for (const [path, content] of Object.entries(files)) void storage.writeItem(`/project/${path}`, content)
  return { storage, root: '/project', paths: new Set(Object.keys(files)) }
}

async function addRun({ store, jobId, files }: { store: GenerationStore; jobId: string; files: Record<string, string> }) {
  const output = await store.keep({ jobId, source: 'output', files: sourceFiles(files), maxSetMb: 1 })
  await store.add({ jobId, output, peerDependencies: {}, missingDependencies: [] })
}

describe('createGenerationStore', () => {
  it('reads a generation back by its job id only', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': 'one' } })
    const generation = await store.get('job-1')

    expect(await store.get('job-2')).toBeUndefined()
    expect(generation?.output.hashes['a.ts']).toMatch(/^[0-9a-f]{16}$/)
    await expect(store.read({ generation: generation!, source: 'output', paths: ['a.ts', 'b.ts'] })).resolves.toStrictEqual({ 'a.ts': 'one' })
  })

  it('stops serving a generation once it is older than ttlMs, and drops its files on the next add', async () => {
    const storage = memoryStorage()
    let clock = 0
    const store = createGenerationStore({ storage, maxCount: 4, maxMb: 10, ttlMs: 1_000, now: () => clock })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': 'one' } })

    clock = 999
    expect((await store.latest())?.jobId).toBe('job-1')

    clock = 1_000
    expect(await store.get('job-1')).toBeUndefined()
    expect(await store.latest()).toBeUndefined()

    await addRun({ store, jobId: 'job-2', files: { 'b.ts': 'two' } })
    expect((await storage.readKeys()).some((key) => key.endsWith('a.ts'))).toBe(false)
  })

  it('keeps generations past any age without ttlMs', async () => {
    let clock = 0
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10, now: () => clock })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': 'one' } })

    clock = 365 * 24 * 60 * 60_000
    expect((await store.get('job-1'))?.jobId).toBe('job-1')
  })

  it('drops the oldest past the count, and their files with them', async () => {
    const storage = memoryStorage()
    const store = createGenerationStore({ storage, maxCount: 2, maxMb: 10 })
    for (const jobId of ['job-1', 'job-2', 'job-3']) await addRun({ store, jobId, files: { 'a.ts': jobId } })

    expect(await store.get('job-1')).toBeUndefined()
    expect((await store.latest())?.jobId).toBe('job-3')
    expect((await storage.readKeys()).filter((key) => key.endsWith('a.ts'))).toHaveLength(2)
  })

  it('survives a restart through the index in its storage', async () => {
    const storage = memoryStorage()
    await addRun({ store: createGenerationStore({ storage, maxCount: 4, maxMb: 10 }), jobId: 'job-1', files: { 'a.ts': 'one' } })

    const restarted = createGenerationStore({ storage, maxCount: 4, maxMb: 10 })
    const generation = await restarted.get('job-1')

    await expect(restarted.read({ generation: generation!, source: 'output', paths: ['a.ts'] })).resolves.toStrictEqual({ 'a.ts': 'one' })
  })
})
