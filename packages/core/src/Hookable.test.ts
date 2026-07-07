import { describe, expect, it, vi } from 'vitest'
import { Hookable } from './Hookable.ts'

type TestHooks = {
  test: [string, number]
  error: [Error]
  noArgs: []
  single: [string]
}

describe('Hookable', () => {
  it('should emit hook to registered listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn()

    hooks.on('test', handler)
    await hooks.emit('test', 'hello', 42)

    expect(handler).toHaveBeenCalledWith('hello', 42)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should emit hook to multiple listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    hooks.on('test', handler1)
    hooks.on('test', handler2)
    await hooks.emit('test', 'hello', 42)

    expect(handler1).toHaveBeenCalledWith('hello', 42)
    expect(handler2).toHaveBeenCalledWith('hello', 42)
  })

  it('should handle async listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn().mockResolvedValue(undefined)

    hooks.on('test', handler)
    await hooks.emit('test', 'hello', 42)

    expect(handler).toHaveBeenCalled()
  })

  it('should return undefined when emitting a hook with no registered listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const result = await hooks.emit('test', 'hello', 42)

    expect(result).toBeUndefined()
  })

  it('should wrap a rejecting listener with the hook name and serialized arguments', async () => {
    const hooks = new Hookable<TestHooks>()
    const cause = new Error('listener failed')

    hooks.on('test', () => {
      throw cause
    })

    await expect(hooks.emit('test', 'hello', 42)).rejects.toThrow('Error in async listener for "test" with hookArgs ["hello",42]')
    await expect(hooks.emit('test', 'hello', 42)).rejects.toMatchObject({ cause })
  })

  it('should stop calling later listeners once one rejects', async () => {
    const hooks = new Hookable<TestHooks>()
    const second = vi.fn()

    hooks.on('test', () => {
      throw new Error('boom')
    })
    hooks.on('test', second)

    await expect(hooks.emit('test', 'hello', 42)).rejects.toThrow()
    expect(second).not.toHaveBeenCalled()
  })

  it('should remove listener with off method', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn()

    hooks.on('test', handler)
    hooks.off('test', handler)
    await hooks.emit('test', 'hello', 42)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should remove all listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    hooks.on('test', handler1)
    hooks.on('single', handler2)
    hooks.removeAll()
    await hooks.emit('test', 'hello', 42)
    await hooks.emit('single', 'world')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should handle hooks with no arguments', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn()

    hooks.on('noArgs', handler)
    await hooks.emit('noArgs')

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
