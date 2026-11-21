import type { KubbPluginSetupContext, Memo } from '@kubb/core'
import type { GeneratorContext } from './types.ts'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { memo } from './memo.ts'

declare global {
  namespace Kubb {
    interface MemoRegistry {
      'plugin-memo-a:printer': { print(): string }
      'plugin-memo-a:cyclic': Set<string>
      'plugin-memo-b:other': number
    }
  }
}

function createCtx() {
  const store = new Map<string, unknown>()
  const spy = vi.fn((key: string, compute: () => unknown) => {
    if (!store.has(key)) store.set(key, compute())
    return store.get(key)
  })

  return { ctx: { memo: spy as unknown as Memo }, spy }
}

describe('memo.scope', () => {
  it('puts the name in front of the key and computes once', () => {
    const { ctx, spy } = createCtx()
    const scoped = memo.scope(ctx, 'plugin-memo-a')
    const compute = vi.fn(() => new Set<string>())

    const first = scoped('cyclic', compute)
    const second = scoped('cyclic', compute)

    expect(spy).toHaveBeenCalledWith('plugin-memo-a:cyclic', compute)
    expect(first).toBe(second)
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('keeps the rest after the slot', () => {
    const { ctx, spy } = createCtx()

    memo.scope(ctx, 'plugin-memo-a')('printer:mini:in', () => ({ print: () => 'x' }))

    expect(spy.mock.calls[0]?.[0]).toBe('plugin-memo-a:printer:mini:in')
  })

  it('types each slot from Kubb.MemoRegistry', () => {
    const { ctx } = createCtx()
    const scoped = memo.scope(ctx, 'plugin-memo-a')

    expectTypeOf(scoped('cyclic', () => new Set<string>())).toEqualTypeOf<Set<string>>()
    expectTypeOf(scoped('printer:mini', () => ({ print: () => '' }))).toEqualTypeOf<{ print(): string }>()

    // @ts-expect-error no such slot for plugin-memo-a
    scoped('nope', () => 1)
    // @ts-expect-error wrong value type for the slot
    scoped('cyclic', () => 1)
    // @ts-expect-error a slot registered for another plugin
    scoped('other', () => 1)
  })

  it('accepts a setup ctx and a generator ctx', () => {
    expectTypeOf<KubbPluginSetupContext>().toExtend<Parameters<typeof memo.scope>[0]>()
    expectTypeOf<GeneratorContext>().toExtend<Parameters<typeof memo.scope>[0]>()
  })
})

describe('memo', () => {
  it('keeps the store form and memo.create', () => {
    const store = memo.create<string, number>()
    const compute = vi.fn(() => 1)

    expect(memo(store, 'a', compute)).toBe(1)
    expect(memo(store, 'a', compute)).toBe(1)
    expect(compute).toHaveBeenCalledTimes(1)
  })
})
