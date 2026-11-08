import { describe, expect, it, vi } from 'vitest'
import { Hookable } from './Hookable.ts'

type TestHooks = {
  test: [string, number]
  error: [Error]
  single: [string]
}

describe('Hookable', () => {
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
})
