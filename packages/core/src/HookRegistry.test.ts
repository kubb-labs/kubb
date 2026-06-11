import { AsyncEventEmitter } from '@internals/utils'
import { describe, expect, it, vi } from 'vitest'
import { HookRegistry } from './HookRegistry.ts'

type TestEvents = {
  seq: [value: string]
}

function makeRegistry(): { emitter: AsyncEventEmitter<TestEvents>; registry: HookRegistry<TestEvents> } {
  const emitter = new AsyncEventEmitter<TestEvents>()
  const registry = new HookRegistry<TestEvents>({ emitter })
  return { emitter, registry }
}

describe('HookRegistry — dispatch through the emitter', () => {
  it('fires registered listeners in registration order', async () => {
    const { emitter, registry } = makeRegistry()
    const calls: Array<string> = []

    registry.register({ event: 'seq', handler: async (v) => void calls.push(`a:${v}`), source: 'plugin' })
    registry.register({ event: 'seq', handler: async (v) => void calls.push(`b:${v}`), source: 'plugin' })

    await emitter.emit('seq', 'x')

    expect(calls).toStrictEqual(['a:x', 'b:x'])
  })

  it('preserves plugin ordering through registration source', async () => {
    const { emitter, registry } = makeRegistry()
    const calls: Array<string> = []

    registry.register({ event: 'seq', handler: () => void calls.push('plugin-1'), source: 'plugin' })
    registry.register({ event: 'seq', handler: () => void calls.push('plugin-2'), source: 'plugin' })
    registry.register({ event: 'seq', handler: () => void calls.push('post-plugin'), source: 'plugin' })

    await emitter.emit('seq', 'x')

    expect(calls).toStrictEqual(['plugin-1', 'plugin-2', 'post-plugin'])
  })
})

describe('HookRegistry — dispose', () => {
  it('removes every tracked listener from the underlying emitter', async () => {
    const { emitter, registry } = makeRegistry()
    const pluginHandler = vi.fn()
    const postPluginHandler = vi.fn()

    registry.register({ event: 'seq', handler: pluginHandler, source: 'plugin' })
    registry.register({ event: 'seq', handler: postPluginHandler, source: 'plugin' })

    expect(registry.size).toBe(2)
    expect(emitter.listenerCount('seq')).toBe(2)

    registry.dispose()

    expect(registry.size).toBe(0)
    expect(emitter.listenerCount('seq')).toBe(0)

    await emitter.emit('seq', 'x')

    expect(pluginHandler).not.toHaveBeenCalled()
    expect(postPluginHandler).not.toHaveBeenCalled()
  })

  it('leaves listeners attached directly via emitter.on intact', async () => {
    const { emitter, registry } = makeRegistry()
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
