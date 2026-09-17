import { Hookable, type KubbHooks } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import type { StudioApi } from './protocol/index.ts'
import { setupEventsStream } from './ws.ts'

describe('Studio job-event projector', () => {
  it('serializes errors and ignores core hooks outside the public catalog', async () => {
    const event = vi.fn().mockResolvedValue(undefined)
    const studio: StudioApi = { event, ping: vi.fn() }
    const hooks = new Hookable<KubbHooks>()
    const remove = setupEventsStream(studio, hooks, 'job-1')

    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await hooks.callHook('kubb:setup:start')
    await new Promise((resolve) => setTimeout(resolve))

    expect(event).toHaveBeenCalledTimes(1)
    expect(event).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 1,
        jobId: 'job-1',
        type: 'kubb:error',
        data: [{ message: 'broken', stack: expect.any(String) }],
        seq: 0,
      }),
    )
    remove()
  })
})
