import { memoryStorage } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { type FileSet, GenerationHistory } from './generations.ts'

function fileSet(bytes: number, { inMemory = true, kept = true } = {}): FileSet {
  return { storage: memoryStorage(), root: '/project', paths: new Set(kept ? ['a.ts'] : []), hashes: new Map([['a.ts', 'hash']]), bytes, inMemory }
}

describe('GenerationHistory', () => {
  it('looks a generation up by its job id only', () => {
    const history = new GenerationHistory({ maxCount: 4, maxBytes: 100 })
    const generation = { output: fileSet(1) }
    history.add('job-1', generation)

    expect(history.get('job-1')).toBe(generation)
    expect(history.get('job-2')).toBeUndefined()
    expect(history.latest).toBe(generation)
    expect(history.latestJobId).toBe('job-1')
  })

  it('drops the oldest past the count', () => {
    const history = new GenerationHistory({ maxCount: 2, maxBytes: 100 })
    for (const jobId of ['job-1', 'job-2', 'job-3']) history.add(jobId, { output: fileSet(1) })

    expect(history.get('job-1')).toBeUndefined()
    expect(history.get('job-2')).toBeDefined()
  })

  it('drops the oldest while what it keeps in memory weighs too much, counting disk snapshots too', () => {
    const history = new GenerationHistory({ maxCount: 10, maxBytes: 100 })
    history.add('job-1', { output: fileSet(40) })
    history.add('job-2', { output: fileSet(10), disk: fileSet(40) })
    history.add('job-3', { output: fileSet(40) })

    expect(history.get('job-1')).toBeUndefined()
    expect(history.get('job-2')).toBeDefined()
  })

  it('does not count output read from disk, or sets kept as hashes only', () => {
    const history = new GenerationHistory({ maxCount: 10, maxBytes: 100 })
    history.add('job-1', { output: fileSet(500, { inMemory: false }) })
    history.add('job-2', { output: fileSet(500, { kept: false }) })
    history.add('job-3', { output: fileSet(50) })

    for (const jobId of ['job-1', 'job-2', 'job-3']) expect(history.get(jobId)).toBeDefined()
  })

  it('always keeps the newest, however large', () => {
    const history = new GenerationHistory({ maxCount: 10, maxBytes: 100 })
    history.add('job-1', { output: fileSet(10) })
    history.add('job-2', { output: fileSet(1_000) })

    expect(history.get('job-1')).toBeUndefined()
    expect(history.get('job-2')).toBeDefined()
  })
})
