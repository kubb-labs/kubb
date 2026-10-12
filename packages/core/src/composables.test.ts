import { setTimeout as delay } from 'node:timers/promises'
import { ast, type Macro, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter, createMockedSetupContext } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { addGenerator, addMacro, injectFile, kubbContext, setMacros, setResolver, tryUseKubb, useKubb, usePlugin } from './composables.ts'
import { createKubb } from './createKubb.ts'
import type { Generator } from './defineGenerator.ts'
import type { KubbPluginSetupContext, Plugin } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import { KubbDriver } from './KubbDriver.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, KubbHooks } from './types.ts'

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
    ...overrides,
  }
}

const generator: Generator = { name: 'gen', schema: vi.fn() }
const macro: Macro = { name: 'macro' }
const file = { path: '/gen/raw.ts', baseName: 'raw.ts' } as const

describe('composables', () => {
  it('throw KUBB_NO_CONTEXT outside setup', () => {
    const calls: Array<[string, () => unknown]> = [
      ['useKubb', () => useKubb()],
      ['addGenerator', () => addGenerator(generator)],
      ['setResolver', () => setResolver({})],
      ['addMacro', () => addMacro(macro)],
      ['setMacros', () => setMacros([macro])],
      ['injectFile', () => injectFile(file)],
      ['usePlugin', () => usePlugin('plugin-ts')],
    ]

    for (const [name, call] of calls) {
      expect(call, name).toThrow(
        expect.objectContaining({
          message: `\`${name}()\` was called outside a plugin setup.`,
          diagnostic: expect.objectContaining({ code: Diagnostics.code.noContext }),
        }),
      )
    }
  })

  it('tryUseKubb returns undefined outside setup', () => {
    expect(tryUseKubb()).toBeUndefined()
  })

  it('delegate to the context method of the same name', () => {
    const ctx = createMockedSetupContext({ plugins: ['plugin-ts'] })
    const resolver = { name: (name: string) => name }

    kubbContext.run(ctx, () => {
      expect(useKubb()).toBe(ctx)
      expect(tryUseKubb()).toBe(ctx)

      addGenerator(generator, generator)
      setResolver(resolver)
      addMacro(macro)
      setMacros([macro])
      injectFile(file)

      expect(usePlugin('plugin-ts').name).toBe('plugin-ts')
      expect(() => usePlugin('plugin-missing')).toThrow('Plugin "plugin-missing" is required but not found.')
    })

    expect(ctx.addGenerator).toHaveBeenCalledWith(generator, generator)
    expect(ctx.setResolver).toHaveBeenCalledWith(resolver)
    expect(ctx.addMacro).toHaveBeenCalledWith(macro)
    expect(ctx.setMacros).toHaveBeenCalledWith([macro])
    expect(ctx.injectFile).toHaveBeenCalledWith(file)
  })
})

describe('KubbDriver#setupHooks with composables', () => {
  it('scopes each plugin setup to its own context, also after an await', async () => {
    const seen: Array<{ plugin: string; options: unknown }> = []

    const makePlugin = (name: string, wait: number): Plugin => ({
      name,
      options: { label: name },
      hooks: {
        async 'kubb:plugin:setup'() {
          await delay(wait)
          seen.push({ plugin: name, options: useKubb().options })
          addGenerator({ name: `${name}-gen`, schema: vi.fn() })
        },
      },
    })

    const driver = new KubbDriver(makeConfig({ plugins: [makePlugin('first', 5), makePlugin('second', 0)] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.setupHooks()

    expect(seen).toStrictEqual([
      { plugin: 'first', options: { label: 'first' } },
      { plugin: 'second', options: { label: 'second' } },
    ])
    expect(driver.plugins.get('first')?.generators?.map((gen) => gen.name)).toStrictEqual(['first-gen'])
    expect(driver.plugins.get('second')?.generators?.map((gen) => gen.name)).toStrictEqual(['second-gen'])
    expect(tryUseKubb()).toBeUndefined()
  })

  it('passes the same context to useKubb() and the ctx argument', async () => {
    let fromArgument: KubbPluginSetupContext | undefined
    let fromComposable: KubbPluginSetupContext | undefined

    const plugin: Plugin = {
      name: 'same-ctx',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          fromArgument = ctx
          fromComposable = useKubb()
        },
      },
    }

    const driver = new KubbDriver(makeConfig({ plugins: [plugin] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.setupHooks()

    expect(fromComposable).toBeDefined()
    expect(fromComposable).toBe(fromArgument)
  })

  it('usePlugin returns another plugin from the config', async () => {
    let found: string | undefined

    const base: Plugin = { name: 'base', hooks: {} }
    const dependent: Plugin = {
      name: 'dependent',
      hooks: {
        'kubb:plugin:setup'() {
          found = usePlugin('base').name
        },
      },
    }

    const driver = new KubbDriver(makeConfig({ plugins: [base, dependent] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.setupHooks()

    expect(found).toBe('base')
  })

  it('generates the files of a generator added after an await in setup', async () => {
    const schemas: Array<SchemaNode> = [ast.factory.createSchema({ name: 'Pet', type: 'string' })]
    const plugin: Plugin = {
      name: 'await-plugin',
      hooks: {
        async 'kubb:plugin:setup'() {
          await delay(1)
          addGenerator({
            name: 'await-gen',
            schema(node) {
              return [
                ast.factory.createFile({
                  path: `/gen/${node.name}.ts`,
                  baseName: `${node.name}.ts`,
                  sources: [ast.factory.createSource({ nodes: [ast.factory.createText(`export type ${node.name} = string`)] })],
                  imports: [],
                  exports: [],
                }),
              ]
            },
          })
        },
      },
    }

    const adapter = createMockedAdapter({ parse: async () => ({ ...ast.factory.createInput(), schemas }) })
    const { files } = await createKubb(makeConfig({ adapter, plugins: [plugin] }), { hooks: new Hookable<KubbHooks>() }).build()

    expect(files.map((generated) => generated.path)).toStrictEqual(['/gen/Pet.ts'])
  })
})
