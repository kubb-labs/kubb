import { describe, expectTypeOf, it } from 'vitest'
import { createMemo, type MemoValue } from './memo.ts'

declare global {
  namespace Kubb {
    interface MemoRegistry {
      'plugin-memo-core:cyclic': Set<string>
    }
  }
}

describe('MemoValue', () => {
  it('resolves a full-key slot and its rest before the prefix lookup', () => {
    expectTypeOf<MemoValue<'plugin-memo-core:cyclic'>>().toEqualTypeOf<Set<string>>()
    expectTypeOf<MemoValue<'plugin-memo-core:cyclic:Pet'>>().toEqualTypeOf<Set<string>>()
    expectTypeOf<MemoValue<'name:Pet'>>().toEqualTypeOf<string>()
    expectTypeOf<MemoValue<'unknown:Pet'>>().toEqualTypeOf<unknown>()
  })

  it('types get and set by the slot', () => {
    const memo = createMemo(new Map())

    expectTypeOf(memo.get('plugin-memo-core:cyclic')).toEqualTypeOf<Set<string> | undefined>()
    // @ts-expect-error wrong value type for the slot
    memo.set('plugin-memo-core:cyclic', 1)
  })
})
