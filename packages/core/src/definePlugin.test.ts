import { AsyncEventEmitter } from '@internals/utils'
import { describe, expect, it, vi } from 'vitest'
import { createMockedAdapter } from '#mocks'
import { createPlugin } from './createPlugin.ts'
import { definePlugin, isHookStylePlugin } from './definePlugin.ts'
import { PluginDriver } from './PluginDriver.ts'
import type { Config, KubbEvents, Plugin } from './types.ts'

describe('definePlugin', () => {
  it('creates a valid hook-style plugin with `hooks:` property', () => {
    const plugin = definePlugin<{ tag: string }>((options) => ({
      name: 'my-hook-plugin',
      options,
      hooks: {
        'kubb:setup'(_ctx) {},
      },
    }))({ tag: 'pets' })

    expect(plugin.name).toBe('my-hook-plugin')
    expect(plugin.options).toEqual({ tag: 'pets' })
    expect(typeof plugin.hooks['kubb:setup']).toBe('function')
  })

  it('uses empty object as default options when none are provided', () => {
    const factory = definePlugin<{ tag?: string }>((options) => ({
      name: 'my-plugin',
      options,
      hooks: {},
    }))
    const plugin = factory()
    expect(plugin.options).toEqual({})
  })

  it('isHookStylePlugin returns true for definePlugin output', () => {
    const plugin = definePlugin((_options) => ({
      name: 'test',
      hooks: {},
    }))()
    expect(isHookStylePlugin(plugin)).toBe(true)
  })

  it('isHookStylePlugin returns false for createPlugin output', () => {
    const plugin = createPlugin(() => ({
      name: 'legacy',
      options: undefined as any,
      context: undefined as never,
      buildStart() {},
    }))()
    expect(isHookStylePlugin(plugin)).toBe(false)
  })
})

describe('PluginDriver — hook-style plugin registration', () => {
  function makeConfig(plugins: Array<Plugin>): Config {
    return {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen', clean: true },
      parsers: [],
      adapter: createMockedAdapter(),
      plugins,
    }
  }

  it('registers a hook-style plugin in the plugins map', () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), {
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(driver.plugins.has('hook-plugin')).toBe(true)
  })

  it('registers kubb:setup handler on the event emitter', () => {
    const setupHandler = vi.fn()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:setup': setupHandler,
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    expect(events.listenerCount('kubb:setup')).toBeGreaterThan(0)
  })

  it('calls kubb:setup handler when event is emitted', async () => {
    const setupHandler = vi.fn()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:setup': setupHandler,
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    await events.emit('kubb:setup', {
      config: makeConfig([]),
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    })

    expect(setupHandler).toHaveBeenCalledOnce()
  })

  it('addGenerator() registers generators on the normalized plugin', async () => {
    const generator = { name: 'my-gen', schema: vi.fn() }
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:setup'(ctx) {
          ctx.addGenerator(generator)
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    // Before emit — no generators yet
    expect(driver.plugins.get('hook-plugin')?.generators ?? []).toHaveLength(0)

    await events.emit('kubb:setup', {
      config: makeConfig([]),
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    })

    // After emit — generator is registered on the plugin
    expect(driver.plugins.get('hook-plugin')?.generators).toHaveLength(1)
    expect(driver.plugins.get('hook-plugin')?.generators?.[0]).toBe(generator)
  })

  it('options passed to definePlugin are forwarded via ctx.options', async () => {
    const capturedOptions: unknown[] = []
    const hookPlugin = definePlugin<{ tag: string }>((options) => ({
      name: 'hook-plugin',
      options,
      hooks: {
        'kubb:setup'(ctx) {
          capturedOptions.push(ctx.options)
        },
      },
    }))({ tag: 'pets' })

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    await events.emit('kubb:setup', {
      config: makeConfig([]),
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    })

    expect(capturedOptions[0]).toEqual({ tag: 'pets' })
  })

  it('external listeners receive kubb:setup context', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: { 'kubb:setup'() {} },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    const externalListener = vi.fn()
    events.on('kubb:setup', externalListener)

    const ctx = {
      config: makeConfig([]),
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    }
    await events.emit('kubb:setup', ctx)

    expect(externalListener).toHaveBeenCalledWith(ctx)
  })
})

describe('PluginDriver — mixed createPlugin + definePlugin', () => {
  it('both legacy and hook-style plugins coexist in the same config', () => {
    const legacyPlugin = createPlugin(() => ({
      name: 'legacy-plugin',
      options: undefined as any,
      context: undefined as never,
      buildStart() {},
    }))()

    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const config: Config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen' },
      parsers: [],
      adapter: createMockedAdapter(),
      plugins: [legacyPlugin, hookPlugin as unknown as Plugin],
    }

    const driver = new PluginDriver(config, {
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(driver.plugins.has('legacy-plugin')).toBe(true)
    expect(driver.plugins.has('hook-plugin')).toBe(true)
    expect(driver.plugins.size).toBe(2)
  })
})
