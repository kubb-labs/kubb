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

    hooks.hook('test', handler)
    await hooks.callHook('test', 'hello', 42)

    expect(handler).toHaveBeenCalledWith('hello', 42)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should emit hook to multiple listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    hooks.hook('test', handler1)
    hooks.hook('test', handler2)
    await hooks.callHook('test', 'hello', 42)

    expect(handler1).toHaveBeenCalledWith('hello', 42)
    expect(handler2).toHaveBeenCalledWith('hello', 42)
  })

  it('should handle async listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn().mockResolvedValue(undefined)

    hooks.hook('test', handler)
    await hooks.callHook('test', 'hello', 42)

    expect(handler).toHaveBeenCalled()
  })

  it('should return undefined when emitting a hook with no registered listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const result = await hooks.callHook('test', 'hello', 42)

    expect(result).toBeUndefined()
  })

  it('should wrap a rejecting listener with the hook name and serialized arguments', async () => {
    const hooks = new Hookable<TestHooks>()
    const cause = new Error('listener failed')

    hooks.hook('test', () => {
      throw cause
    })

    await expect(hooks.callHook('test', 'hello', 42)).rejects.toThrow('Error in async listener for "test" with hookArgs ["hello",42]')
    await expect(hooks.callHook('test', 'hello', 42)).rejects.toMatchObject({ cause })
  })

  it('should stop calling later listeners once one rejects', async () => {
    const hooks = new Hookable<TestHooks>()
    const second = vi.fn()

    hooks.hook('test', () => {
      throw new Error('boom')
    })
    hooks.hook('test', second)

    await expect(hooks.callHook('test', 'hello', 42)).rejects.toThrow()
    expect(second).not.toHaveBeenCalled()
  })

  it('should remove listener with removeHook method', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn()

    hooks.hook('test', handler)
    hooks.removeHook('test', handler)
    await hooks.callHook('test', 'hello', 42)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should remove all listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    hooks.hook('test', handler1)
    hooks.hook('single', handler2)
    hooks.removeAllHooks()
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('single', 'world')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should handle hooks with no arguments', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn()

    hooks.hook('noArgs', handler)
    await hooks.callHook('noArgs')

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should remove the listener when calling the function returned by hook', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn()

    const unhook = hooks.hook('test', handler)
    unhook()
    await hooks.callHook('test', 'hello', 42)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should register every handler passed to addHooks', async () => {
    const hooks = new Hookable<TestHooks>()
    const onTest = vi.fn()
    const onSingle = vi.fn()

    hooks.addHooks({ test: onTest, single: onSingle })
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('single', 'world')

    expect(onTest).toHaveBeenCalledWith('hello', 42)
    expect(onSingle).toHaveBeenCalledWith('world')
  })

  it('should skip undefined entries in addHooks', async () => {
    const hooks = new Hookable<TestHooks>()
    const onTest = vi.fn()

    hooks.addHooks({ test: onTest, single: undefined })
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('single', 'world')

    expect(onTest).toHaveBeenCalledTimes(1)
  })

  it('should remove every added handler when calling the function returned by addHooks', async () => {
    const hooks = new Hookable<TestHooks>()
    const onTest = vi.fn()
    const onSingle = vi.fn()

    const unhook = hooks.addHooks({ test: onTest, single: onSingle })
    unhook()
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('single', 'world')

    expect(onTest).not.toHaveBeenCalled()
    expect(onSingle).not.toHaveBeenCalled()
  })

  it('should leave listeners registered outside addHooks untouched when its remover runs', async () => {
    const hooks = new Hookable<TestHooks>()
    const standalone = vi.fn()
    const batched = vi.fn()

    hooks.hook('test', standalone)
    const unhook = hooks.addHooks({ test: batched })
    unhook()
    await hooks.callHook('test', 'hello', 42)

    expect(batched).not.toHaveBeenCalled()
    expect(standalone).toHaveBeenCalledWith('hello', 42)
  })

  it('should ignore a value returned by a listener', async () => {
    const hooks = new Hookable<TestHooks>()

    hooks.hook('single', (value) => value.toUpperCase())

    await expect(hooks.callHook('single', 'world')).resolves.toBeUndefined()
  })
})
