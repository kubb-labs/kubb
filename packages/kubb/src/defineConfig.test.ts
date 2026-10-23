import type { CLIOptions, Parser, Reporter, UserConfig } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import { pluginBarrel, pluginBarrelName } from '@kubb/plugin-barrel'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { createKubb } from './createKubb.ts'
import { defineConfig } from './defineConfig.ts'

type Resolved = UserConfig | Array<UserConfig>
type ConfigShape = Resolved | Promise<Resolved> | ((cli: CLIOptions) => Promise<Resolved>)
type ExplicitFieldRow = { field: string; partial: Partial<UserConfig>; pick: (config: UserConfig) => unknown; value: unknown }
type ConfigShapeRow = { shape: string; config: ConfigShape; count: number }

const minimal = { input: 'spec.yaml', output: { path: './gen' } } satisfies UserConfig

function resolve(partial: Partial<UserConfig> = {}): UserConfig {
  return defineConfig({ ...minimal, ...partial } as UserConfig) as UserConfig
}

async function settle(config: ConfigShape): Promise<Array<UserConfig>> {
  const resolved = await (typeof config === 'function' ? config({}) : config)

  return Array.isArray(resolved) ? resolved : [resolved]
}

describe('defineConfig', () => {
  test('applies the typescript, tsx, and markdown parsers when not set', () => {
    expect(resolve().parsers?.map((parser) => parser.name)).toStrictEqual(['typescript', 'tsx', 'markdown'])
  })

  test('registers the built-in reporters when not set', () => {
    expect(resolve().reporters?.map((reporter) => reporter.name)).toStrictEqual(['cli', 'json', 'file', 'html'])
  })

  test('does not append pluginBarrel when already in plugins list', () => {
    expect(resolve({ plugins: [pluginBarrel()] }).plugins?.map((plugin) => plugin.name)).toStrictEqual([pluginBarrelName])
  })

  test('appends pluginBarrel after a custom plugin and defaults output.barrel to false', () => {
    const resolved = resolve({ plugins: [createMockedPlugin({ name: 'custom', options: {} })] })

    expect(resolved.plugins?.map((plugin) => plugin.name)).toStrictEqual(['custom', pluginBarrelName])
    expect(resolved.output.barrel).toBe(false)
  })

  const adapter = createMockedAdapter()
  const parsers = [{ name: 'custom' } as Parser]
  const reporters = [{ name: 'custom' } as Reporter]
  const barrel = { type: 'all' } as const

  const explicitFields: Array<ExplicitFieldRow> = [
    { field: 'root', partial: { root: '/custom/root' }, pick: (config) => config.root, value: '/custom/root' },
    { field: 'adapter', partial: { adapter }, pick: (config) => config.adapter, value: adapter },
    { field: 'parsers', partial: { parsers }, pick: (config) => config.parsers, value: parsers },
    { field: 'reporters', partial: { reporters }, pick: (config) => config.reporters, value: reporters },
    { field: 'output.barrel', partial: { output: { path: './gen', barrel } }, pick: (config) => config.output.barrel, value: barrel },
  ]

  test.each(explicitFields)('preserves an explicit $field', ({ partial, pick, value }) => {
    expect(pick(resolve(partial))).toStrictEqual(value)
  })

  const shapes: Array<ConfigShapeRow> = [
    { shape: 'an object', config: defineConfig({ ...minimal }), count: 1 },
    { shape: 'an array', config: defineConfig([{ ...minimal }, { ...minimal }]), count: 2 },
    { shape: 'a function', config: defineConfig(() => ({ ...minimal })), count: 1 },
    { shape: 'a promise', config: defineConfig(Promise.resolve({ ...minimal })), count: 1 },
  ]

  test.each(shapes)('applies defaults when config is $shape', async ({ config, count }) => {
    const configs = await settle(config)

    expect(configs).toHaveLength(count)
    for (const resolved of configs) {
      // The config loader resolves `root` from the config's folder, so `defineConfig` leaves it unset.
      expect(resolved.root).toBeUndefined()
      expect(resolved.adapter?.name).toBe('oas')
      expect(resolved.plugins?.map((plugin) => plugin.name)).toStrictEqual([pluginBarrelName])
      expect(resolved.output).toStrictEqual({ path: './gen', barrel: false, format: false, lint: false })
    }
  })
})

describe('defineConfig types', () => {
  test('reports unknown keys and keeps the inferred shape', () => {
    // @ts-expect-error unknown key
    defineConfig({ ...minimal, notAField: true })
    // @ts-expect-error unknown output key inside the array form
    defineConfig([{ input: 'spec.yaml', output: { path: './gen', badOut: 1 } }])

    expectTypeOf(defineConfig({ ...minimal })).toEqualTypeOf<UserConfig<string>>()
    expectTypeOf(defineConfig([{ ...minimal }])).toEqualTypeOf<Array<UserConfig<string>>>()
    expectTypeOf(defineConfig(() => ({ ...minimal }))).toEqualTypeOf<(cli: CLIOptions) => Promise<UserConfig<string>>>()
    expectTypeOf(defineConfig(Promise.resolve([{ ...minimal }]))).toEqualTypeOf<Promise<Array<UserConfig<string>>>>()
  })
})

describe('createKubb', () => {
  test('applies the same defaults as defineConfig', () => {
    const kubb = createKubb({ ...minimal })

    expect(kubb.config.adapter?.name).toBe('oas')
    expect(kubb.config.parsers.map((parser) => parser.name)).toStrictEqual(['typescript', 'tsx', 'markdown'])
    expect(kubb.config.plugins.map((plugin) => plugin.name)).toStrictEqual([pluginBarrelName])
  })
})
