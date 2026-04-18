import { AsyncEventEmitter } from '@internals/utils'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, test } from 'vitest'
import { definePlugin } from './definePlugin.ts'
import { PluginDriver } from './PluginDriver.ts'
import type { Config, KubbHooks } from './types.ts'

function makeConfig(plugins: Config['plugins']): Config {
  return {
    root: '.',
    input: { path: './petStore.yaml' },
    output: { path: './src/gen', clean: true },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins,
  }
}

describe('PluginDriver', () => {
  const pluginA = definePlugin(() => ({ name: 'pluginA', hooks: {} }))()
  const pluginB = definePlugin(() => ({ name: 'pluginB', hooks: {} }))()
  const pluginC = definePlugin(() => ({ name: 'pluginC', hooks: {} }))()

  const config = makeConfig([pluginA, pluginB, pluginC])
  const pluginDriver = new PluginDriver(config, {
    hooks: new AsyncEventEmitter<KubbHooks>(),
  })

  afterEach(() => {
    pluginDriver.hooks.removeAll()
  })

  test('pluginDriver can be created with hook-style plugins', () => {
    expect(pluginDriver.plugins.size).toBe(config.plugins.length)
  })

  test('getPlugin returns the correct plugin by name', () => {
    expect(pluginDriver.getPlugin('pluginA')?.name).toBe('pluginA')
    expect(pluginDriver.getPlugin('pluginB')?.name).toBe('pluginB')
    expect(pluginDriver.getPlugin('unknown')).toBeUndefined()
  })

  test('requirePlugin throws when plugin is not found', () => {
    expect(() => pluginDriver.requirePlugin('unknown')).toThrow(/Plugin "unknown" is required but not found/)
  })

  test('plugins sorted by dependencies', () => {
    const depPlugin = definePlugin(() => ({ name: 'dep', hooks: {} }))()
    const mainPlugin = definePlugin(() => ({ name: 'main', dependencies: ['dep'], hooks: {} }))()
    const driver = new PluginDriver(makeConfig([mainPlugin, depPlugin]), {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })
    const names = [...driver.plugins.keys()]
    expect(names.indexOf('dep')).toBeLessThan(names.indexOf('main'))
  })

  test('apply filter excludes plugins', () => {
    const alwaysOff = definePlugin(() => ({ name: 'off-plugin', apply: () => false, hooks: {} }))()
    const alwaysOn = definePlugin(() => ({ name: 'on-plugin', apply: () => true, hooks: {} }))()
    const driver = new PluginDriver(makeConfig([alwaysOff, alwaysOn]), {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })
    expect(driver.plugins.has('off-plugin')).toBe(false)
    expect(driver.plugins.has('on-plugin')).toBe(true)
  })

  test('dispose removes all listeners', () => {
    const events = new AsyncEventEmitter<KubbHooks>()
    const plugin = definePlugin(() => ({
      name: 'disposable',
      hooks: { 'kubb:plugin:setup': () => {} },
    }))()
    const driver = new PluginDriver(makeConfig([plugin]), { hooks: events })

    expect(events.listenerCount('kubb:plugin:setup')).toBeGreaterThan(0)
    driver.dispose()
    expect(events.listenerCount('kubb:plugin:setup')).toBe(0)
  })
})
