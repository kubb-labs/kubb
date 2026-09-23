import { memoryStorage } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { copyToMemory, createGenerationHistory, type FileSet } from './generations.ts'

function fileSet({ bytes, inMemory = true }: { bytes: number; inMemory?: boolean }): FileSet {
  return { storage: memoryStorage(), root: '/project', paths: new Set(['a.ts']), hashes: new Map([['a.ts', 'hash']]), bytes, inMemory }
}

describe('createGenerationHistory', () => {
  it('looks a generation up by its job id only', () => {
    const history = createGenerationHistory({ maxCount: 4, maxBytes: 100 })
    const generation = { output: fileSet({ bytes: 1 }) }
    history.set('job-1', generation)

    expect(history.get('job-1')).toBe(generation)
    expect(history.get('job-2')).toBeUndefined()
    expect(history.latestJobId()).toBe('job-1')
  })

  it('drops the oldest past the count', () => {
    const history = createGenerationHistory({ maxCount: 2, maxBytes: 100 })
    for (const jobId of ['job-1', 'job-2', 'job-3']) history.set(jobId, { output: fileSet({ bytes: 1 }) })

    expect(history.get('job-1')).toBeUndefined()
    expect(history.get('job-2')).toBeDefined()
  })

  it('drops the oldest while what it keeps in memory weighs too much, counting disk snapshots too', () => {
    const history = createGenerationHistory({ maxCount: 10, maxBytes: 100 })
    history.set('job-1', { output: fileSet({ bytes: 40 }) })
    history.set('job-2', { output: fileSet({ bytes: 10 }), disk: fileSet({ bytes: 40 }) })
    history.set('job-3', { output: fileSet({ bytes: 40 }) })

    expect(history.get('job-1')).toBeUndefined()
    expect(history.get('job-2')).toBeDefined()
  })

  it('does not count output read from disk', () => {
    const history = createGenerationHistory({ maxCount: 10, maxBytes: 100 })
    history.set('job-1', { output: fileSet({ bytes: 500, inMemory: false }) })
    history.set('job-2', { output: fileSet({ bytes: 50 }) })

    expect(history.get('job-1')).toBeDefined()
  })

  it('keeps the latest position when a generation is set again', () => {
    const history = createGenerationHistory({ maxCount: 10, maxBytes: 100 })
    history.set('job-1', { output: fileSet({ bytes: 1 }) })
    history.set('job-1', { output: fileSet({ bytes: 2 }) })

    expect(history.latestJobId()).toBe('job-1')
    expect(history.get('job-1')?.output.bytes).toBe(2)
  })

  it('always keeps the newest, however large', () => {
    const history = createGenerationHistory({ maxCount: 10, maxBytes: 100 })
    history.set('job-1', { output: fileSet({ bytes: 10 }) })
    history.set('job-2', { output: fileSet({ bytes: 1_000 }) })

    expect(history.get('job-1')).toBeUndefined()
    expect(history.get('job-2')).toBeDefined()
  })
})

describe('copyToMemory', () => {
  it('keeps only the hashes of a set above the cap, weighing nothing', async () => {
    const copy = await copyToMemory({ set: fileSet({ bytes: 500, inMemory: false }), maxBytes: 100 })

    expect(copy).toMatchObject({ bytes: 0, inMemory: true })
    expect(copy.paths.size).toBe(0)
    expect(copy.hashes.get('a.ts')).toBe('hash')
  })
})
