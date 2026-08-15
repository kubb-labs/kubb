import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'

const watcher = new EventEmitter()

vi.mock('chokidar', () => ({
  watch: vi.fn(() => watcher),
}))

const { startWatcher } = await import('./watcher.ts')

describe('startWatcher', () => {
  afterEach(() => {
    watcher.removeAllListeners()
  })

  it('never runs the callback concurrently when events fire in quick succession', async () => {
    let concurrent = 0
    let maxConcurrent = 0
    const cb = vi.fn(async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise((resolve) => setTimeout(resolve, 10))
      concurrent--
    })

    await startWatcher(['src'], cb)

    watcher.emit('all', 'change', 'a.ts')
    watcher.emit('all', 'change', 'b.ts')
    watcher.emit('all', 'change', 'c.ts')

    // Wait for the initial run and the single coalesced rerun to finish.
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(maxConcurrent).toBe(1)
    // Overlapping events while a run is in flight coalesce into one queued rerun, not one per event.
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('keeps watching after the callback rejects', async () => {
    const cb = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined)

    await startWatcher(['src'], cb)

    watcher.emit('all', 'change', 'a.ts')
    await new Promise((resolve) => setTimeout(resolve, 0))

    watcher.emit('all', 'change', 'b.ts')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(cb).toHaveBeenCalledTimes(2)
  })
})
