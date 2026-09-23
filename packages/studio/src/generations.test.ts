import { memoryStorage } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createGenerationStore, type GenerationStore, type SourceFiles } from './generations.ts'

function sourceFiles(files: Record<string, string>): SourceFiles {
  const storage = memoryStorage()
  for (const [path, content] of Object.entries(files)) void storage.writeItem(`/project/${path}`, content)
  return { storage, root: '/project', paths: new Set(Object.keys(files)) }
}

async function addRun({ store, jobId, files }: { store: GenerationStore; jobId: string; files: Record<string, string> }) {
  const output = await store.keep({ jobId, source: 'output', files: sourceFiles(files), maxSetBytes: 1_000 })
  await store.add({ jobId, output, peerDependencies: {}, missingDependencies: [] })
}

describe('createGenerationStore', () => {
  it('reads a generation back by its job id only', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxBytes: 1_000 })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': 'one' } })
    const generation = await store.get('job-1')

    expect(await store.get('job-2')).toBeUndefined()
    expect(generation?.output.hashes['a.ts']).toMatch(/^[0-9a-f]{16}$/)
    await expect(store.read({ generation: generation!, source: 'output', paths: ['a.ts', 'b.ts'] })).resolves.toStrictEqual({ 'a.ts': 'one' })
  })

  it('drops the oldest past the count, and their files with them', async () => {
    const storage = memoryStorage()
    const store = createGenerationStore({ storage, maxCount: 2, maxBytes: 1_000 })
    for (const jobId of ['job-1', 'job-2', 'job-3']) await addRun({ store, jobId, files: { 'a.ts': jobId } })

    expect(await store.get('job-1')).toBeUndefined()
    expect((await store.latest())?.jobId).toBe('job-3')
    expect((await storage.readKeys()).filter((key) => key.endsWith('a.ts'))).toHaveLength(2)
  })

  it('drops the oldest while the kept content weighs too much, but always keeps the newest', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 10, maxBytes: 10 })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': '12345' } })
    await addRun({ store, jobId: 'job-2', files: { 'a.ts': '1234567890ab' } })

    expect(await store.get('job-1')).toBeUndefined()
    expect(await store.get('job-2')).toBeDefined()
  })

  it('keeps only the hashes of a set above the cap', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxBytes: 1_000 })
    const kept = await store.keep({ jobId: 'job-1', source: 'output', files: sourceFiles({ 'a.ts': 'x'.repeat(20) }), maxSetBytes: 10 })

    expect(kept).toMatchObject({ paths: [], bytes: 0 })
    expect(kept.hashes['a.ts']).toBeDefined()
  })

  it('survives a restart through the index in its storage', async () => {
    const storage = memoryStorage()
    await addRun({ store: createGenerationStore({ storage, maxCount: 4, maxBytes: 1_000 }), jobId: 'job-1', files: { 'a.ts': 'one' } })

    const restarted = createGenerationStore({ storage, maxCount: 4, maxBytes: 1_000 })
    const generation = await restarted.get('job-1')

    await expect(restarted.read({ generation: generation!, source: 'output', paths: ['a.ts'] })).resolves.toStrictEqual({ 'a.ts': 'one' })
  })
})
