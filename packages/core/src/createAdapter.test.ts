import { ast } from '@kubb/ast'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { createAdapter } from './createAdapter.ts'
import { defineExtension } from './defineExtension.ts'
import type { Adapter, AdapterFactoryOptions } from './createAdapter.ts'
import { Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import { KubbDriver } from './KubbDriver.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, KubbHooks } from './types.ts'

type TextAdapter = AdapterFactoryOptions<'text', { strict?: boolean }, { strict: boolean; mode: 'strict' | 'loose' }, string>

const adapterText = defineExtension<TextAdapter>({
  kind: 'adapter',
  meta: { name: 'text', version: '1.0.0' },
  setup: ({ strict = true }) => ({ strict, mode: strict ? 'strict' : 'loose' }),
  build(options) {
    let document: string | null = null
    return {
      get document() {
        return document
      },
      async parse() {
        document = options.mode
        return ast.factory.createInput()
      },
      async validate() {},
    }
  },
})

describe('defineExtension adapter', () => {
  it('returns a factory with kind and meta statics', () => {
    expect(adapterText.kind).toBe('adapter')
    expect(adapterText.meta).toStrictEqual({ name: 'text', version: '1.0.0' })
    expectTypeOf(adapterText).parameter(0).toEqualTypeOf<{ strict?: boolean } | undefined>()
    expectTypeOf(adapterText()).toEqualTypeOf<Adapter<TextAdapter>>()
  })

  it('resolves the options with setup and exposes the resolved options', () => {
    const adapter = adapterText({ strict: false })

    expect(adapter).toMatchObject({ name: 'text', meta: { name: 'text' }, options: { strict: false, mode: 'loose' } })
    expect(adapterText().options).toStrictEqual({ strict: true, mode: 'strict' })
  })

  it('keeps getters on the built adapter live', async () => {
    const adapter = adapterText()

    expect(adapter.document).toBeNull()
    await adapter.parse({ type: 'data', data: '' })
    expect(adapter.document).toBe('strict')
  })

  it("uses the user's options as the resolved options without setup", () => {
    const adapter = defineExtension<AdapterFactoryOptions<'plain', { strict?: boolean }>>({
      kind: 'adapter',
      meta: { name: 'plain' },
      build: () => ({ document: null, parse: () => ast.factory.createInput(), validate: async () => {} }),
    })({ strict: true })

    expect(adapter.options).toStrictEqual({ strict: true })
  })

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

  it('throws KUBB_INCOMPATIBLE_EXTENSION from KubbDriver.setup when the adapter requires a newer Kubb', async () => {
    const future = defineExtension({
      kind: 'adapter',
      meta: { name: 'future', compatibility: { kubb: '>=99' } },
      build: () => ({ document: null, parse: () => ast.factory.createInput(), validate: async () => {} }),
    })
    const config: Config = {
      root: '.',
      input: './petStore.yaml',
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: future(),
      plugins: [],
      storage: memoryStorage(),
    }
    const driver = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })

    await expect(driver.setup()).rejects.toMatchObject({ diagnostic: { code: Diagnostics.code.incompatibleExtension, plugin: 'future' } })
  })
})
