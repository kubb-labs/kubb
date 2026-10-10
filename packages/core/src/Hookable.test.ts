import { describe, expect, it, vi } from 'vitest'
import { Hookable } from './Hookable.ts'

type TestHooks = {
  test: [string, number]
  error: [Error]
  noArgs: []
  single: [string]
}

describe('Hookable', () => {
  it('calls every listener once with the hook arguments', async () => {
    const hooks = new Hookable<TestHooks>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const noArgs = vi.fn()

    hooks.hook('test', handler1)
    hooks.hook('test', handler2)
    hooks.hook('noArgs', noArgs)
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('noArgs')

    expect(handler1.mock.calls).toStrictEqual([['hello', 42]])
    expect(handler2.mock.calls).toStrictEqual([['hello', 42]])
    expect(noArgs.mock.calls).toStrictEqual([[]])
  })

  it('returns undefined when emitting a hook with no registered listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const result = await hooks.callHook('test', 'hello', 42)

    expect(result).toBeUndefined()
  })

  it('wraps a rejecting listener with the hook name and stops calling later listeners', async () => {
    const hooks = new Hookable<TestHooks>()
    const cause = new Error('listener failed')
    const second = vi.fn()

    hooks.hook('test', () => {
      throw cause
    })
    hooks.hook('test', second)

    await expect(hooks.callHook('test', 'hello', 42)).rejects.toMatchObject({ message: 'Error in async listener for "test"' })
    await expect(hooks.callHook('test', 'hello', 42)).rejects.toMatchObject({ cause })
    expect(second).not.toHaveBeenCalled()
  })

  it.each([
    [
      'removeHook',
      (hooks: Hookable<TestHooks>, handler: () => void) => {
        hooks.hook('test', handler)
        hooks.removeHook('test', handler)
      },
    ],
    [
      'the function returned by hook',
      (hooks: Hookable<TestHooks>, handler: () => void) => {
        hooks.hook('test', handler)()
      },
    ],
  ])('removes a listener through %s', async (_name, registerAndRemove) => {
    const hooks = new Hookable<TestHooks>()
    const handler = vi.fn()

    registerAndRemove(hooks, handler)
    await hooks.callHook('test', 'hello', 42)

    expect(handler).not.toHaveBeenCalled()
  })

  it('removes all listeners', async () => {
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

  it('registers every handler passed to addHooks', async () => {
    const hooks = new Hookable<TestHooks>()
    const onTest = vi.fn()
    const onSingle = vi.fn()

    hooks.addHooks({ test: onTest, single: onSingle })
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('single', 'world')

    expect(onTest).toHaveBeenCalledWith('hello', 42)
    expect(onSingle).toHaveBeenCalledWith('world')
  })

  it('skips undefined entries in addHooks', async () => {
    const hooks = new Hookable<TestHooks>()
    const onTest = vi.fn()

    hooks.addHooks({ test: onTest, single: undefined })
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('single', 'world')

    expect(onTest).toHaveBeenCalledTimes(1)
  })

  it('removes only the handlers added by addHooks when its remover runs', async () => {
    const hooks = new Hookable<TestHooks>()
    const standalone = vi.fn()
    const onTest = vi.fn()
    const onSingle = vi.fn()

    hooks.hook('test', standalone)
    const unhook = hooks.addHooks({ test: onTest, single: onSingle })
    unhook()
    await hooks.callHook('test', 'hello', 42)
    await hooks.callHook('single', 'world')

    expect(onTest).not.toHaveBeenCalled()
    expect(onSingle).not.toHaveBeenCalled()
    expect(standalone).toHaveBeenCalledWith('hello', 42)
  })

  it('ignores a value returned by a listener', async () => {
    const hooks = new Hookable<TestHooks>()

    hooks.hook('single', (value) => value.toUpperCase())

    await expect(hooks.callHook('single', 'world')).resolves.toBeUndefined()
  })
})
