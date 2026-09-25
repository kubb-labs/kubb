import { Hookable, type KubbHooks } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createGenerationStream } from './generationEvents.ts'

describe('Generation event stream', () => {
  it('delivers events to a reader already waiting', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')
    const reading = generation.stream.getReader().read()

    await hooks.callHook('kubb:info', { message: 'ready' })

    await expect(reading).resolves.toMatchObject({ value: { type: 'kubb:info' } })
    await generation.close()
  })

  it('serializes errors and ignores core hooks outside the public catalog', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')
    const reader = generation.stream.getReader()

    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await hooks.callHook('kubb:setup:start')
    const eventPromise = reader.read()
    await generation.close()
    const event = await eventPromise

    expect(event.value).toEqual(
      expect.objectContaining({
        version: 1,
        jobId: 'job-1',
        type: 'kubb:error',
        data: [{ message: 'broken', stack: expect.any(String) }],
      }),
    )
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
