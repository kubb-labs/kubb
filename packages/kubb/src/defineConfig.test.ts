import type { CLIOptions, Plugin, UserConfig } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { defineConfig } from './defineConfig.ts'

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
    expectTypeOf<typeof fn>().toEqualTypeOf<(cli: CLIOptions) => Promise<UserConfig>>()
    const result = await fn({})

    expect(result).toBeDefined()
  })

  test('handles async function config', async () => {
    const fn = defineConfig(async () => ({ ...baseConfig }))

    expectTypeOf<typeof fn>().toEqualTypeOf<(cli: CLIOptions) => Promise<UserConfig>>()
    const result = await fn({})

    expect(result).toBeDefined()
  })

  test('handles function array config', async () => {
    const fn = defineConfig(() => [{ ...baseConfig }])

    expectTypeOf<typeof fn>().toEqualTypeOf<(cli: CLIOptions) => Promise<UserConfig[]>>()
    const result = await fn({})

    expect(result).toHaveLength(1)
  })

  test('handles async function array config', async () => {
    const fn = defineConfig(async () => [{ ...baseConfig }])

    expectTypeOf<typeof fn>().toEqualTypeOf<(cli: CLIOptions) => Promise<UserConfig[]>>()
    const result = await fn({})

    expect(result).toHaveLength(1)
  })

  test('handles promise config', async () => {
    const config = defineConfig(
      Promise.resolve({
        input: { path: 'spec.yaml' },
        output: { path: './gen' },
      }),
    )

    const result = await config

    expect(result).toBeDefined()
    expectTypeOf<typeof config>().toEqualTypeOf<Promise<UserConfig<{ path: string }>>>()
  })

  test('handles promise array config', async () => {
    const config = defineConfig(
      Promise.resolve([
        {
          input: { path: 'spec.yaml' },
          output: { path: './gen' },
        },
      ]),
    )

    const result = await config

    expect(result).toHaveLength(1)
    expectTypeOf<typeof config>().toEqualTypeOf<Promise<Array<UserConfig<{ path: string }>>>>()
  })

  test('preserves inferred input types', () => {
    const pathConfig = defineConfig({
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
    })
    const dataConfig = defineConfig({
      input: { data: { openapi: '3.1.0' } },
      output: { path: './gen' },
    })

    expectTypeOf<typeof pathConfig>().toEqualTypeOf<UserConfig<{ path: string }>>()
    expectTypeOf<typeof dataConfig>().toEqualTypeOf<UserConfig<{ data: { openapi: string } }>>()
  })

  test('preserves inferred input types for array results', () => {
    const arrayConfig = defineConfig([
      {
        input: { path: 'spec.yaml' },
        output: { path: './gen' },
      },
    ])

    expectTypeOf<typeof arrayConfig>().toEqualTypeOf<Array<UserConfig<{ path: string }>>>()
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
    {
      name: 'asyncFunctionArray',
      config: defineConfig(async () => [{ ...baseConfig }]),
    },
    {
      name: 'promiseArray',
      config: defineConfig(Promise.resolve([{ ...baseConfig }])),
    },
  ]

  test.each(configs)('resolves config as $name', async ({ config }) => {
    let kubbUserConfig = Promise.resolve(config) as Promise<UserConfig | Array<UserConfig>>

    if (typeof config === 'function') {
      kubbUserConfig = Promise.resolve(config({}))
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
