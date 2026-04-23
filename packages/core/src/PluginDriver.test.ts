import { AsyncEventEmitter } from '@internals/utils'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, test } from 'vitest'
import { PluginDriver } from './PluginDriver.ts'
import type { Config, KubbHooks, Plugin } from './types.ts'

describe('PluginDriver', () => {
  const pluginA = {
    name: 'pluginA',
    hooks: {},
  }

  const pluginB = {
    name: 'pluginB',
    hooks: {},
  }

  const pluginC = {
    name: 'pluginC',
    hooks: {},
  }

  const config = {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [pluginA, pluginB, pluginC] as unknown as Array<Plugin>,
  } satisfies Config
  const pluginDriver = new PluginDriver(config, {
    hooks: new AsyncEventEmitter<KubbHooks>(),
  })

  afterEach(() => {
    pluginDriver.hooks.removeAll()
  })
  test('if pluginDriver can be created', () => {
    expect(pluginDriver.plugins.size).toBe(config.plugins.length)
  })

  test('enforce: pre plugins run before normal and post plugins', () => {
    const prePlugin = { name: 'pre', enforce: 'pre' as const, hooks: {} }
    const normalPlugin = { name: 'normal', hooks: {} }
    const postPlugin = { name: 'post', enforce: 'post' as const, hooks: {} }

    const cfg = {
      ...config,
      // intentionally declared in reverse order to verify sorting
      plugins: [postPlugin, normalPlugin, prePlugin] as unknown as Array<Plugin>,
    } satisfies Config

    const driver = new PluginDriver(cfg, { hooks: new AsyncEventEmitter<KubbHooks>() })
    const names = [...driver.plugins.keys()]

    expect(names.indexOf('pre')).toBeLessThan(names.indexOf('normal'))
    expect(names.indexOf('normal')).toBeLessThan(names.indexOf('post'))
  })
})
