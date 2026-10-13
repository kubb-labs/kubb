import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { createAdapter } from './createAdapter.ts'
import type { AdapterFactoryOptions } from './createAdapter.ts'

describe('createAdapter (deprecated)', () => {
  it('gives the deprecated factory form kind and returns its adapter as built', () => {
    const factory = createAdapter<AdapterFactoryOptions<'legacy', { strict?: boolean }>>((options) => ({
      name: 'legacy',
      options,
      document: null,
      parse: () => ast.factory.createInput(),
      validate: async () => {},
    }))

    expect(factory.kind).toBe('adapter')
    expect(factory({ strict: true })).toMatchObject({ name: 'legacy', options: { strict: true } })
    expect(factory().options).toStrictEqual({})
  })
})
