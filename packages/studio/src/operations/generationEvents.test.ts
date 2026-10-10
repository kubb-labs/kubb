import { Hookable, type KubbHooks } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createGenerationStream } from './generationEvents.ts'

describe('Generation event stream', () => {
  it('serializes an error for a waiting reader and skips core hooks outside the public catalog', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')
    const reader = generation.stream.getReader()
    const reading = reader.read()

    await hooks.callHook('kubb:setup:start')
    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await generation.close()

    await expect(reading).resolves.toStrictEqual({
      done: false,
      value: { version: 1, jobId: 'job-1', type: 'kubb:error', data: [{ message: 'broken', stack: expect.any(String) }], timestamp: expect.any(Number) },
    })
    await expect(reader.read()).resolves.toStrictEqual({ done: true, value: undefined })
  })

  it('keeps errors when progress fills the event queue', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')

    for (let i = 0; i < 1_025; i++) await hooks.callHook('kubb:info', { message: `step ${i}` })
    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    expect(events.length).toBeLessThan(1_024)
    expect(events.at(-1)?.type).toBe('kubb:error')
  })
})
