import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { wakeUp } from '../loggers/banner.ts'
import * as env from '../utils/env.ts'
import { logBanner } from './mascot.ts'

// Fake timers do not patch `node:timers/promises`, so its sleep runs on the faked global `setTimeout`, aborting the same way.
vi.mock('node:timers/promises', () => ({
  setTimeout: (ms: number, value: unknown, { signal }: { signal?: AbortSignal } = {}) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(value), ms)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(signal.reason)
      })
    }),
}))

/** Gives the test worker's stdout the terminal members the banner reads, and puts the old ones back on dispose. */
function fakeTerminal(members: Partial<Record<'hasColors' | 'columns' | 'moveCursor', unknown>>): Disposable {
  const previous = Object.keys(members).map((key) => [key, Object.getOwnPropertyDescriptor(process.stdout, key)] as const)
  for (const [key, value] of Object.entries(members)) Object.defineProperty(process.stdout, key, { value, writable: true, configurable: true })

  return {
    [Symbol.dispose]() {
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(process.stdout, key, descriptor)
        if (!descriptor) Reflect.deleteProperty(process.stdout, key)
      }
    },
  }
}

const wakeUpMs = wakeUp.reduce((total, [, ms]) => total + ms, 0)

/** Plays the banner, aborting after `cutAfterMs` when given, and returns every line it printed and how often it moved the cursor up. */
async function play({ rich = true, cutAfterMs, signal }: { rich?: boolean; cutAfterMs?: number; signal?: AbortSignal } = {}) {
  const lines: Array<string> = []
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(rich)
  const moveCursor = vi.fn(() => true)
  using _tty = fakeTerminal({ hasColors: () => true, columns: 200, moveCursor })
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(String(line)))

  const controller = new AbortController()
  const done = logBanner({ version: '5.0.0', signal: signal ?? controller.signal })
  if (cutAfterMs !== undefined) {
    await vi.advanceTimersByTimeAsync(cutAfterMs)
    controller.abort()
  }
  await vi.runAllTimersAsync()
  await done

  return { lines, redraws: moveCursor.mock.calls.length }
}

describe('logBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays every frame while the work is still running', async () => {
    const { lines, redraws } = await play()

    expect(lines).toHaveLength(wakeUp.length + 1)
    expect(redraws).toBe(wakeUp.length - 1)
  })

  it('takes the whole animation when nothing cuts it', async () => {
    const start = Date.now()
    await play()

    expect(Date.now() - start).toBe(wakeUpMs)
  })

  it('jumps to the last frame once the work is done', async () => {
    const full = await play()
    const start = Date.now()
    const cut = await play({ cutAfterMs: 150 })

    expect(Date.now() - start).toBe(150)
    // The first two frames, then the last one in their place.
    expect(cut.lines).toHaveLength(4)
    expect(cut.redraws).toBe(2)
    expect(cut.lines.at(-1)).toBe(full.lines.at(-1))
  })

  it('draws the last frame alone when the work is done before it starts', async () => {
    const full = await play()
    const { lines, redraws } = await play({ signal: AbortSignal.abort() })

    expect(lines).toStrictEqual(['', full.lines.at(-1)])
    expect(redraws).toBe(0)
  })

  it('prints one version line and no frames without a rich terminal', async () => {
    const { lines, redraws } = await play({ rich: false, cutAfterMs: 50 })

    expect(lines).toStrictEqual(['Kubb CLI v5.0.0'])
    expect(redraws).toBe(0)
  })
})
