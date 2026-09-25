import { Hookable, type KubbHooks } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createGenerationStream } from './generationEvents.ts'

describe('Generation event stream', () => {
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
})
