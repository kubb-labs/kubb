import { AsyncEventEmitter } from '@internals/utils'
import { describe, expect, it, vi } from 'vitest'
import { HookRegistry } from './HookRegistry.ts'

type TestEvents = {
  seq: [value: string]
  noop: []
  first: [value: number]
}

const sequentialKinds = {
  seq: 'sequential',
  noop: 'sequential',
  first: 'sequential',
} as const

const firstResultKinds = {
  seq: 'sequential',
  noop: 'sequential',
  first: 'firstResult',
} as const

function makeRegistry<TKinds extends { [K in keyof TestEvents]: 'sequential' | 'firstResult' }>(
  kinds: TKinds,
): { emitter: AsyncEventEmitter<TestEvents>; registry: HookRegistry<TestEvents, TKinds> } {
  const emitter = new AsyncEventEmitter<TestEvents>()
  const registry = new HookRegistry<TestEvents, TKinds>({ emitter, kinds })
  return { emitter, registry }
}

describe('HookRegistry — sequential', () => {
  it('dispatches sequential listeners in registration order', async () => {
    const { registry } = makeRegistry(sequentialKinds)
    const calls: Array<string> = []

    registry.register({ event: 'seq', handler: async (v) => void calls.push(`a:${v}`), source: 'plugin' })
    registry.register({ event: 'seq', handler: async (v) => void calls.push(`b:${v}`), source: 'middleware' })

    await registry.invoke('seq', 'x')

    expect(calls).toStrictEqual(['a:x', 'b:x'])
  })

  it('awaits each async listener before the next runs', async () => {
    const { registry } = makeRegistry(sequentialKinds)
    const order: Array<string> = []

    registry.register({
      event: 'seq',
      handler: async () => {
        order.push('a:start')
        await Promise.resolve()
        order.push('a:end')
      },
      source: 'plugin',
    })
    registry.register({
      event: 'seq',
      handler: () => {
        order.push('b')
      },
      source: 'plugin',
    })

    await registry.invoke('seq', 'x')

    expect(order).toStrictEqual(['a:start', 'a:end', 'b'])
  })

  it('preserves plugin-then-middleware ordering through registration source', async () => {
    const { registry } = makeRegistry(sequentialKinds)
    const calls: Array<string> = []

    registry.register({ event: 'seq', handler: () => void calls.push('plugin-1'), source: 'plugin' })
    registry.register({ event: 'seq', handler: () => void calls.push('plugin-2'), source: 'plugin' })
    registry.register({ event: 'seq', handler: () => void calls.push('middleware'), source: 'middleware' })

    await registry.invoke('seq', 'x')

    expect(calls).toStrictEqual(['plugin-1', 'plugin-2', 'middleware'])
  })

  it('does not fire listeners registered during dispatch in the same invocation', async () => {
    const { registry } = makeRegistry(sequentialKinds)
    const later = vi.fn()

    registry.register({
      event: 'seq',
      handler: () => {
        registry.register({ event: 'seq', handler: later, source: 'plugin' })
      },
      source: 'plugin',
    })

    await registry.invoke('seq', 'x')

    expect(later).not.toHaveBeenCalled()

    await registry.invoke('seq', 'y')

    expect(later).toHaveBeenCalledTimes(1)
    expect(later).toHaveBeenCalledWith('y')
  })

  it('throws a wrapped error when a sequential listener rejects', async () => {
    const { registry } = makeRegistry(sequentialKinds)
    const later = vi.fn()

    registry.register({
      event: 'seq',
      handler: () => {
        throw new Error('boom')
      },
      source: 'plugin',
    })
    registry.register({ event: 'seq', handler: later, source: 'plugin' })

    await expect(registry.invoke('seq', 'x')).rejects.toThrow(/seq/)
    expect(later).not.toHaveBeenCalled()
  })
})

describe('HookRegistry — firstResult', () => {
  it('returns the first non-nullish result and stops walking', async () => {
    const { registry } = makeRegistry(firstResultKinds)
    const third = vi.fn()

    registry.register({ event: 'first', handler: () => undefined, source: 'plugin' })
    registry.register({ event: 'first', handler: () => 42, source: 'plugin' })
    registry.register({ event: 'first', handler: third, source: 'plugin' })

    const result = await registry.invoke('first', 0)

    expect(result).toBe(42)
    expect(third).not.toHaveBeenCalled()
  })

  it('treats null as non-result and continues walking', async () => {
    const { registry } = makeRegistry(firstResultKinds)

    registry.register({ event: 'first', handler: () => null, source: 'plugin' })
    registry.register({ event: 'first', handler: () => 7, source: 'plugin' })

    expect(await registry.invoke('first', 0)).toBe(7)
  })

  it('returns undefined when every listener returns nullish', async () => {
    const { registry } = makeRegistry(firstResultKinds)

    registry.register({ event: 'first', handler: () => undefined, source: 'plugin' })
    registry.register({ event: 'first', handler: () => null, source: 'plugin' })

    expect(await registry.invoke('first', 0)).toBeUndefined()
  })

  it('wraps the cause when a firstResult listener throws', async () => {
    const { registry } = makeRegistry(firstResultKinds)

    registry.register({
      event: 'first',
      handler: () => {
        throw new Error('boom')
      },
      source: 'plugin',
    })

    await expect(registry.invoke('first', 0)).rejects.toThrow(/first/)
  })
})

describe('HookRegistry — dispose', () => {
  it('removes every tracked listener from the underlying emitter', async () => {
    const { emitter, registry } = makeRegistry(sequentialKinds)
    const pluginHandler = vi.fn()
    const middlewareHandler = vi.fn()

    registry.register({ event: 'seq', handler: pluginHandler, source: 'plugin' })
    registry.register({ event: 'seq', handler: middlewareHandler, source: 'middleware' })

    expect(registry.size).toBe(2)
    expect(emitter.listenerCount('seq')).toBe(2)

    registry.dispose()

    expect(registry.size).toBe(0)
    expect(emitter.listenerCount('seq')).toBe(0)

    await emitter.emit('seq', 'x')

    expect(pluginHandler).not.toHaveBeenCalled()
    expect(middlewareHandler).not.toHaveBeenCalled()
  })

  it('leaves listeners attached directly via emitter.on intact', async () => {
    const { emitter, registry } = makeRegistry(sequentialKinds)
    const external = vi.fn()
    const tracked = vi.fn()

    emitter.on('seq', external)
    registry.register({ event: 'seq', handler: tracked, source: 'plugin' })

    registry.dispose()
    await emitter.emit('seq', 'x')

    expect(tracked).not.toHaveBeenCalled()
    expect(external).toHaveBeenCalledWith('x')
  })
})
