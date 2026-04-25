import type { CLIOptions, UserConfig } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import { middlewareBarrel } from '@kubb/middleware-barrel'
import { describe, expect, test } from 'vitest'
import { defineConfig } from './defineConfig.ts'

describe('defineConfig', () => {
  const plugin = createMockedPlugin({
    name: 'plugin',
    options: undefined as any,
  })

  const baseConfig: UserConfig = {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
      barrelType: 'named',
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [plugin],
    middleware: [middlewareBarrel()],
  }

  test('applies default adapter when not set', () => {
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.adapter).toBeDefined()
    expect(resolved.adapter?.name).toBe('oas')
  })

  test('applies default parsers when not set', () => {
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.parsers?.length).toBeGreaterThan(0)
  })

  test('applies default middleware (middlewareBarrel) when not set', () => {
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.middleware).toHaveLength(1)
    expect(resolved.middleware?.[0]?.name).toBe('middleware-barrel')
  })

  test("defaults output.barrelType to 'named' when not set", () => {
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.output.barrelType).toBe('named')
  })

  test('preserves explicit output.barrelType (including false)', () => {
    const named = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen', barrelType: 'all' },
    } as UserConfig) as UserConfig
    const disabled = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen', barrelType: false },
    } as UserConfig) as UserConfig

    expect(named.output.barrelType).toBe('all')
    expect(disabled.output.barrelType).toBe(false)
  })

  test('preserves existing middleware when non-empty', () => {
    const customMiddleware = { name: 'custom', hooks: {} }
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      middleware: [customMiddleware],
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.middleware).toHaveLength(1)
    expect(resolved.middleware?.[0]).toBe(customMiddleware)
  })

  test('does not default barrelType when middlewareBarrel is not part of middleware', () => {
    const customMiddleware = { name: 'custom', hooks: {} }
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      middleware: [customMiddleware],
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.output.barrelType).toBeUndefined()
  })

  test('defaults barrelType when middlewareBarrel is explicitly listed alongside others', () => {
    const customMiddleware = { name: 'custom', hooks: {} }
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      middleware: [customMiddleware, middlewareBarrel()],
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.output.barrelType).toBe('named')
  })

  test('preserves existing adapter', () => {
    const adapter = createMockedAdapter()
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      adapter,
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.adapter).toBe(adapter)
  })

  test('preserves existing parsers when non-empty', () => {
    const parsers = [{ name: 'custom' } as any]
    const config = defineConfig({
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      parsers,
    } as UserConfig)
    const resolved = config as UserConfig

    expect(resolved.parsers).toBe(parsers)
  })

  test('handles array of configs', () => {
    const result = defineConfig([{ ...baseConfig }, { ...baseConfig }])

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
  })

  test('handles function config', async () => {
    const fn = defineConfig(() => ({ ...baseConfig }))
    const typedFn: (cli: CLIOptions) => Promise<UserConfig> = fn

    expect(typeof fn).toBe('function')
    expect(typeof typedFn).toBe('function')
    const result = await fn({})

    expect(result).toBeDefined()
  })

  test('handles async function config', async () => {
    const fn = defineConfig(async () => ({ ...baseConfig }))
    const typedFn: (cli: CLIOptions) => Promise<UserConfig> = fn

    expect(typeof typedFn).toBe('function')
    const result = await fn({})

    expect(result).toBeDefined()
  })

  test('handles function array config', async () => {
    const fn = defineConfig(() => [{ ...baseConfig }])
    const typedFn: (cli: CLIOptions) => Promise<UserConfig[]> = fn

    expect(typeof typedFn).toBe('function')
    const result = await fn({})

    expect(result).toHaveLength(1)
  })

  test('handles async function array config', async () => {
    const fn = defineConfig(async () => [{ ...baseConfig }])
    const typedFn: (cli: CLIOptions) => Promise<UserConfig[]> = fn

    expect(typeof typedFn).toBe('function')
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
    const typedConfig: Promise<UserConfig<{ path: string }>> = config

    const result = await config

    expect(result).toBeDefined()
    expect(typedConfig).toBeDefined()
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
    const typedConfig: Promise<Array<UserConfig<{ path: string }>>> = config

    const result = await config

    expect(result).toHaveLength(1)
    expect(typedConfig).toBeDefined()
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
    const typedPathConfig: UserConfig<{ path: string }> = pathConfig
    const typedDataConfig: UserConfig<{ data: { openapi: string } }> = dataConfig

    expect(typedPathConfig.input.path).toBe('spec.yaml')
    expect(typedDataConfig.input.data).toEqual({ openapi: '3.1.0' })
  })

  test('accepts named configs with hooks', () => {
    const namedConfig = defineConfig({
      name: 'gen',
      root: '.',
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      hooks: {
        done: ['npm run typecheck'],
      },
      plugins: [],
    })
    const typedNamedConfig: UserConfig<{ path: string }> = namedConfig

    expect(typedNamedConfig.name).toBe('gen')
  })

  test('preserves inferred input types for array results', () => {
    const arrayConfig = defineConfig([
      {
        input: { path: 'spec.yaml' },
        output: { path: './gen' },
      },
    ])
    const typedArrayConfig: Array<UserConfig<{ path: string }>> = arrayConfig

    expect(typedArrayConfig).toHaveLength(1)
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
    let kubbUserConfig = Promise.resolve(config) as Promise<unknown>

    if (typeof config === 'function') {
      kubbUserConfig = Promise.resolve(config({}))
    }

    let JSONConfig = (await kubbUserConfig) as UserConfig | Array<UserConfig>

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
