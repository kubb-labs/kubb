import { isPromise } from '@internals/utils'
import type { Plugin } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin } from '#mocks'
import { defineConfig } from './defineConfig.ts'
import type { UserConfig } from './types.ts'

describe('defineConfig', () => {
  const plugin = createMockedPlugin({ name: 'plugin', options: undefined as any })

  const baseConfig: UserConfig = {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
      barrelType: false,
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [plugin] as Array<Plugin>,
  }

  test('applies default adapter when not set', () => {
    const config = defineConfig({ root: '.', input: { path: 'spec.yaml' }, output: { path: './gen' } } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.adapter).toBeDefined()
    expect(resolved.adapter?.name).toBe('oas')
  })

  test('applies default parsers when not set', () => {
    const config = defineConfig({ root: '.', input: { path: 'spec.yaml' }, output: { path: './gen' } } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.parsers?.length).toBeGreaterThan(0)
  })

  test('preserves existing adapter', () => {
    const adapter = createMockedAdapter()
    const config = defineConfig({ root: '.', input: { path: 'spec.yaml' }, output: { path: './gen' }, adapter } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.adapter).toBe(adapter)
  })

  test('preserves existing parsers when non-empty', () => {
    const parsers = [{ name: 'custom' } as any]
    const config = defineConfig({ root: '.', input: { path: 'spec.yaml' }, output: { path: './gen' }, parsers } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.parsers).toBe(parsers)
  })

  test('handles array of configs', () => {
    const result = defineConfig([{ ...baseConfig }, { ...baseConfig }]) as UserConfig[]

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
  })

  test('handles function config', async () => {
    const fn = defineConfig(() => ({ ...baseConfig }))

    expect(typeof fn).toBe('function')
    const result = await fn({})

    expect(result).toBeDefined()
  })

  test('handles async function config', async () => {
    const fn = defineConfig(async () => ({ ...baseConfig }))

    const result = await fn({})

    expect(result).toBeDefined()
  })

  const configs = [
    {
      name: 'simple',
      config: baseConfig,
    },
    {
      name: 'array',
      config: defineConfig([{ ...baseConfig }]),
    },
    {
      name: 'function',
      config: defineConfig(() => ({ ...baseConfig })),
    },
    {
      name: 'functionArray',
      config: defineConfig(() => [{ ...baseConfig }]),
    },
  ]

  test.each(configs)('resolves config as $name', async ({ config }) => {
    let kubbUserConfig = Promise.resolve(config) as Promise<UserConfig | Array<UserConfig>>

    if (typeof config === 'function') {
      const possiblePromise = config({})
      if (isPromise(possiblePromise)) {
        kubbUserConfig = possiblePromise
      } else {
        kubbUserConfig = Promise.resolve(possiblePromise)
      }
    }

    let JSONConfig = await kubbUserConfig

    if (!Array.isArray(JSONConfig)) {
      JSONConfig = [JSONConfig]
    }

    for (const c of JSONConfig) {
      expect(c).toBeDefined()
      expect(c.root).toBe('.')
      expect(c.adapter).toBeDefined()
    }
  })
})
