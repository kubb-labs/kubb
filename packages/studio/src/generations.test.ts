import { ast } from '@kubb/ast'
import { type Config, Hookable, type KubbHooks, memoryStorage } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { createGenerationStore, type GenerationStore, generate, type SourceFiles } from './generations.ts'
import { projectConfig } from './testing.ts'

function sourceFiles(files: Record<string, string>): SourceFiles {
  const storage = memoryStorage()
  for (const [path, content] of Object.entries(files)) void storage.writeItem(`/project/${path}`, content)
  return { storage, root: '/project', paths: new Set(Object.keys(files)) }
}

async function addRun({ store, jobId, files }: { store: GenerationStore; jobId: string; files: Record<string, string> }) {
  const output = await store.keep({ jobId, source: 'output', files: sourceFiles(files), maxSetMb: 1 })
  await store.add({ jobId, output })
}

describe('createGenerationStore', () => {
  it('keeps a job input across a restart and drops it with the job', async () => {
    const storage = memoryStorage()
    const store = createGenerationStore({ storage, maxCount: 4, maxMb: 10 })
    await store.keepInput({ jobId: 'job-1', maxSetMb: 1, input: ast.factory.createInput({ meta: { title: 'Pets', circularNames: [], enumNames: [] } }) })
    await store.keepInput({ jobId: 'job-2', maxSetMb: 1, input: null })

    const restarted = createGenerationStore({ storage, maxCount: 4, maxMb: 10 })

    await expect(restarted.readInput('job-1')).resolves.toMatchObject({ kind: 'Input', meta: { title: 'Pets' } })
    await expect(restarted.readInput('job-2')).resolves.toBeUndefined()
    await restarted.drop('job-1')
    await expect(restarted.readInput('job-1')).resolves.toBeUndefined()
  })

  it('forgets a dropped job, so a failed retry of a kept job is gone', async () => {
    const storage = memoryStorage()
    const store = createGenerationStore({ storage, maxCount: 4, maxMb: 10 })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': 'one' } })
    await store.drop('job-1')

    expect(await store.get('job-1')).toBeUndefined()
    expect(await createGenerationStore({ storage, maxCount: 4, maxMb: 10 }).get('job-1')).toBeUndefined()
  })

  it('drops the input an earlier run of the same job kept', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })
    await store.keepInput({ jobId: 'job-1', maxSetMb: 1, input: ast.factory.createInput() })
    await store.keepInput({ jobId: 'job-1', maxSetMb: 1, input: null })

    await expect(store.readInput('job-1')).resolves.toBeUndefined()
  })

  it('keeps the name of a ref schema but not the copy of its target', async () => {
    const pet = ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] })
    const ref = ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', schema: pet })
    const input = ast.factory.createInput({ schemas: [pet, ast.factory.createSchema({ type: 'array', name: 'Pets', items: [ref] })] })
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })

    await store.keepInput({ jobId: 'job-1', maxSetMb: 1, input })
    const kept = await store.readInput('job-1')

    expect(kept?.schemas[1]).toMatchObject({ type: 'array', items: [{ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }] })
    expect(JSON.stringify(kept)).not.toContain('"schema":')
  })

  it('skips an input JSON cannot hold instead of failing the run', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })
    const input = ast.factory.createInput({ schemas: [ast.factory.createSchema({ type: 'integer', name: 'Big', default: 1n })] })

    await expect(store.keepInput({ jobId: 'job-1', maxSetMb: 1, input })).resolves.toBe(0)
    await expect(store.readInput('job-1')).resolves.toBeUndefined()
  })

  it('keeps no input above the set size budget', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })
    const input = ast.factory.createInput({ meta: { description: 'x'.repeat(200), circularNames: [], enumNames: [] } })

    await expect(store.keepInput({ jobId: 'job-1', input, maxSetMb: 100 / (1024 * 1024) })).resolves.toBe(0)
    await expect(store.readInput('job-1')).resolves.toBeUndefined()
  })

  it('captures the input without hiding the adapter document from plugins', async () => {
    let parsed: unknown = null
    const adapter = {
      ...createMockedAdapter(),
      get document() {
        return parsed
      },
      parse: async () => {
        parsed = { openapi: '3.1.0' }
        return ast.factory.createInput()
      },
    }
    const hooks = new Hookable<KubbHooks>()
    let seen: unknown
    hooks.hook('kubb:build:start', (ctx) => {
      seen = ctx.adapter.document
    })

    const files = await generate({ config: { ...projectConfig(), adapter } as Config, hooks, allowExec: false })

    expect(seen).toStrictEqual({ openapi: '3.1.0' })
    expect(files.input).toMatchObject({ kind: 'Input' })
  })

  it('counts a kept input toward the size limit', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 100 / (1024 * 1024) })
    const inputBytes = await store.keepInput({
      maxSetMb: 1,
      jobId: 'job-1',
      input: ast.factory.createInput({ meta: { description: 'x'.repeat(200), circularNames: [], enumNames: [] } }),
    })
    const output = await store.keep({ jobId: 'job-1', source: 'output', files: sourceFiles({ 'a.ts': 'one' }), maxSetMb: 1 })
    await store.add({ jobId: 'job-1', output, inputBytes })
    await addRun({ store, jobId: 'job-2', files: { 'b.ts': 'two' } })

    expect(await store.get('job-1')).toBeUndefined()
    await expect(store.readInput('job-1')).resolves.toBeUndefined()
  })

  it('reads a generation back by its job id only, including after a restart', async () => {
    const storage = memoryStorage()
    await addRun({ store: createGenerationStore({ storage, maxCount: 4, maxMb: 10 }), jobId: 'job-1', files: { 'a.ts': 'one' } })

    const restarted = createGenerationStore({ storage, maxCount: 4, maxMb: 10 })
    const generation = await restarted.get('job-1')

    expect(await restarted.get('job-2')).toBeUndefined()
    expect(generation?.output.hashes['a.ts']).toMatch(/^[0-9a-f]{16}$/)
    await expect(restarted.read({ generation: generation!, source: 'output', paths: ['a.ts', 'b.ts'] })).resolves.toStrictEqual({ files: { 'a.ts': 'one' } })
  })

  it('hashes output the way writing it to disk would leave it, so in-memory and written runs agree', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })
    const output = await store.keep({ jobId: 'job-1', source: 'output', files: sourceFiles({ 'a.ts': '\nexport const a = 1' }), maxSetMb: 1 })
    const disk = await store.keep({ jobId: 'job-2', source: 'disk', files: sourceFiles({ 'a.ts': 'export const a = 1\n' }), maxSetMb: 1 })

    expect(output.hashes['a.ts']).toBe(disk.hashes['a.ts'])
  })

  it('leaves out an output file that writing would skip because it is empty once trimmed', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })
    const output = await store.keep({ jobId: 'job-1', source: 'output', files: sourceFiles({ 'a.ts': 'export const a = 1', 'empty.ts': ' \n ' }), maxSetMb: 1 })

    expect(output.paths).toStrictEqual(['a.ts'])
  })

  it('pages through a file split on any line ending until nextCursor is null', async () => {
    const store = createGenerationStore({ storage: memoryStorage(), maxCount: 4, maxMb: 10 })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': 'l0\r\nl1\rl2\nl3\nl4' } })
    const generation = (await store.get('job-1'))!

    await expect(store.read({ generation, source: 'output', paths: ['a.ts'], limit: 2 })).resolves.toStrictEqual({
      files: { 'a.ts': 'l0\nl1' },
      pages: { 'a.ts': { nextCursor: 2, totalLines: 5 } },
    })
    await expect(store.read({ generation, source: 'output', paths: ['a.ts'], cursor: 4, limit: 10 })).resolves.toStrictEqual({
      files: { 'a.ts': 'l4' },
      pages: { 'a.ts': { nextCursor: null, totalLines: 5 } },
    })
    await expect(store.read({ generation, source: 'output', paths: ['a.ts'], cursor: 9, limit: 2 })).resolves.toStrictEqual({
      files: { 'a.ts': '' },
      pages: { 'a.ts': { nextCursor: null, totalLines: 5 } },
    })
  })

  it('stops serving a generation once it is older than ttlMs, and drops its files on the next add', async () => {
    const storage = memoryStorage()
    let clock = 0
    const store = createGenerationStore({ storage, maxCount: 4, maxMb: 10, ttlMs: 1_000, now: () => clock })
    await addRun({ store, jobId: 'job-1', files: { 'a.ts': 'one' } })

    clock = 999
    expect((await store.get('job-1'))?.jobId).toBe('job-1')

    clock = 1_000
    expect(await store.get('job-1')).toBeUndefined()

    await addRun({ store, jobId: 'job-2', files: { 'b.ts': 'two' } })
    expect((await storage.readKeys()).some((key) => key.endsWith('a.ts'))).toBe(false)
  })

  it('drops the oldest past the count, and their files with them', async () => {
    const storage = memoryStorage()
    const store = createGenerationStore({ storage, maxCount: 2, maxMb: 10 })
    for (const jobId of ['job-1', 'job-2', 'job-3']) await addRun({ store, jobId, files: { 'a.ts': jobId } })

    expect(await store.get('job-1')).toBeUndefined()
    expect((await store.get('job-3'))?.jobId).toBe('job-3')
    expect((await storage.readKeys()).filter((key) => key.endsWith('a.ts'))).toHaveLength(2)
  })
})
