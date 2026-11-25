import { setTimeout as delay } from 'node:timers/promises'
import { createMockedAdapter, createMockedSetupContext } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { injectFile, kubbContext, memo, setOptions, tryUseKubb, useConfig, useKubb, useOptions, requirePlugin, withContext } from './composables.ts'
import type { KubbPluginSetupContext, Plugin, PluginVisitContext } from './definePlugin.ts'
import { Diagnostics } from './diagnostics.ts'
import { Hookable } from './hookable.ts'
import { Driver } from './driver.ts'
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

const file = { path: '/gen/raw.ts', baseName: 'raw.ts' } as const

describe('composables', () => {
  it('throw KUBB_NO_CONTEXT outside a plugin hook', () => {
    const calls: Array<[string, () => unknown]> = [
      ['useKubb', () => useKubb()],
      ['injectFile', () => injectFile(file)],
      ['useOptions', () => useOptions()],
      ['setOptions', () => setOptions({})],
      ['useConfig', () => useConfig()],
      ['requirePlugin', () => requirePlugin('plugin-ts')],
    ]

    for (const [name, call] of calls) {
      expect(call, name).toThrow(
        expect.objectContaining({
          message: `\`${name}()\` ran outside a plugin hook.`,
          diagnostic: expect.objectContaining({ code: Diagnostics.code.noContext }),
        }),
      )
    }
  })

  it('setup-only composables throw KUBB_NO_CONTEXT in a hook other than setup', () => {
    const ctx = { plugin: { name: 'plugin-ts' }, config: makeConfig() } as unknown as PluginVisitContext
    const calls: Array<[string, () => unknown]> = [
      ['injectFile', () => injectFile(file)],
      ['useOptions', () => useOptions()],
      ['setOptions', () => setOptions({})],
    ]

    withContext(ctx, () => {
      expect(useKubb()).toBe(ctx)
      expect(useConfig()).toBe(ctx.config)
      for (const [name, call] of calls) {
        expect(call, name).toThrow(
          expect.objectContaining({
            message: `\`${name}()\` runs only in \`setup\` or \`kubb:plugin:setup\`.`,
            diagnostic: expect.objectContaining({ code: Diagnostics.code.noContext, plugin: 'plugin-ts' }),
          }),
        )
      }
    })
  })

  it('delegate to the context method of the same name', () => {
    const ctx = createMockedSetupContext({ plugins: ['plugin-ts'], options: { label: 'user' } })

    kubbContext.run(ctx, () => {
      expect(useKubb()).toBe(ctx)
      expect(tryUseKubb()).toBe(ctx)

      injectFile(file)
      setOptions({ label: 'resolved' })

      expect(memo('test:value', () => 'value')).toBe('value')
      const store = memo.create<string, number>()
      expect(memo(store, 'a', () => 1)).toBe(1)
      expect(memo(store, 'a', () => 2)).toBe(1)
      expect(useOptions()).toBe(ctx.options)
      expect(useConfig()).toBe(ctx.config)
      expect(requirePlugin('plugin-ts').name).toBe('plugin-ts')
      expect(() => requirePlugin('plugin-missing')).toThrow('Plugin "plugin-missing" is required but not found.')
    })

    expect(ctx.injectFile).toHaveBeenCalledWith(file)
    expect(ctx.setOptions).toHaveBeenCalledWith({ label: 'resolved' })
  })
})

describe('withContext', () => {
  it('runs fn with ctx as this, as its argument and as the useKubb() store, also after an await', async () => {
    const ctx = createMockedSetupContext()

    const result = await withContext(ctx, async function (arg) {
      expect(this).toBe(ctx)
      expect(arg).toBe(ctx)
      expect(useKubb()).toBe(ctx)
      await delay(1)
      expect(useKubb()).toBe(ctx)
      return 'done'
    })

    expect(result).toBe('done')
    expect(tryUseKubb()).toBeUndefined()
  })
})

describe('Driver#setupHooks with composables', () => {
  it('passes the same context as this, ctx and useKubb() to setup and kubb:plugin:setup', async () => {
    const seen: Array<boolean> = []
    const plugin: Plugin = {
      name: 'plugin-this',
      setup(this: KubbPluginSetupContext, options, ctx) {
        seen.push(this === ctx && useKubb() === ctx)
        return options
      },
      hooks: {
        'kubb:plugin:setup'(this: KubbPluginSetupContext, ctx) {
          seen.push(this === ctx && useKubb() === ctx)
        },
      },
    }

    const driver = new Driver(makeConfig({ plugins: [plugin] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.setupHooks()

    expect(seen).toStrictEqual([true, true])
  })

  it('scopes each plugin setup to its own context, also after an await', async () => {
    const seen: Array<{ plugin: string; options: unknown }> = []

    const makePlugin = (name: string, wait: number): Plugin => ({
      name,
      options: { label: name },
      hooks: {
        async 'kubb:plugin:setup'() {
          await delay(wait)
          seen.push({ plugin: name, options: useKubb().options })
          setOptions({ label: `${name}-resolved` })
        },
      },
    })

    const driver = new Driver(makeConfig({ plugins: [makePlugin('first', 5), makePlugin('second', 0)] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.setupHooks()

    expect(seen).toStrictEqual([
      { plugin: 'first', options: { label: 'first' } },
      { plugin: 'second', options: { label: 'second' } },
    ])
    expect(driver.plugins.get('first')?.options).toMatchObject({ label: 'first-resolved' })
    expect(driver.plugins.get('second')?.options).toMatchObject({ label: 'second-resolved' })
    expect(tryUseKubb()).toBeUndefined()
  })

  it('shares memo() between plugins for one build and forgets it on dispose', async () => {
    const compute = vi.fn(() => 'shared')
    const makePlugin = (name: string): Plugin => ({
      name,
      hooks: {
        'kubb:plugin:setup'() {
          expect(memo('test:names', compute)).toBe('shared')
        },
      },
    })

    const driver = new Driver(makeConfig({ plugins: [makePlugin('first'), makePlugin('second')] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.setupHooks()
    expect(compute).toHaveBeenCalledTimes(1)

    driver.dispose()
    driver.memo('test:names', compute)
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it('get, set and has read and replace a value in the build memo', async () => {
    const seen: Array<unknown> = []
    const plugin: Plugin = {
      name: 'plugin-memo',
      hooks: {
        'kubb:plugin:setup'() {
          seen.push(memo.get('test:value'), memo.has('test:value'))
          memo.set('test:value', 'first')
          memo.set('test:value', 'second')
          seen.push(
            memo.get('test:value'),
            memo.has('test:value'),
            memo('test:value', () => 'computed'),
          )
        },
      },
    }

    const driver = new Driver(makeConfig({ plugins: [plugin] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.setupHooks()

    expect(seen).toEqual([undefined, false, 'second', true, 'second'])

    driver.dispose()
    expect(driver.memo.has('test:value')).toBe(false)
  })
})

describe('kubbContext', () => {
  it('is shared by a second copy of the module, like the ESM and CommonJS builds of @kubb/core', async () => {
    vi.resetModules()
    const other = await import('./composables.ts')

    expect(other.kubbContext).toBe(kubbContext)

    const ctx = createMockedSetupContext()
    kubbContext.run(ctx, () => expect(other.useKubb()).toBe(ctx))
  })
})
