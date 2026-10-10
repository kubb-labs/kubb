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
  test('defaults root to process.cwd() when not set', () => {
    expect(resolve().root).toBe(process.cwd())
  })

  test('applies the oas adapter when not set', () => {
    expect(resolve().adapter?.name).toBe('oas')
  })

  test('applies the typescript, tsx, and markdown parsers when not set', () => {
    expect(resolve().parsers?.map((parser) => parser.name)).toStrictEqual(['typescript', 'tsx', 'markdown'])
  })

  test('registers the built-in reporters when not set', () => {
    expect(resolve().reporters?.map((reporter) => reporter.name)).toStrictEqual(['cli', 'json', 'file', 'html'])
  })

  test('appends pluginBarrel to plugins when not already present', () => {
    expect(resolve().plugins?.map((plugin) => plugin.name)).toStrictEqual([pluginBarrelName])
  })

  test('does not append pluginBarrel when already in plugins list', () => {
    expect(resolve({ plugins: [pluginBarrel()] }).plugins?.map((plugin) => plugin.name)).toStrictEqual([pluginBarrelName])
  })

  test('appends pluginBarrel after a custom plugin and defaults output.barrel to false', () => {
    const resolved = resolve({ plugins: [createMockedPlugin({ name: 'custom', options: {} })] })

    expect(resolved.plugins?.map((plugin) => plugin.name)).toStrictEqual(['custom', pluginBarrelName])
    expect(resolved.output.barrel).toBe(false)
  })

  test('defaults output.barrel, output.format, and output.lint to false when not set', () => {
    expect(resolve().output).toStrictEqual({ path: './gen', barrel: false, format: false, lint: false })
  })

  const adapter = createMockedAdapter()
  const parsers = [{ name: 'custom' } as Parser]
  const reporters = [{ name: 'custom' } as Reporter]
  const barrel = { type: 'all' } as const
  const postGenerate = [{ name: 'types', command: 'npm run typecheck' }, 'biome check --write ./gen']

  const explicitFields: Array<ExplicitFieldRow> = [
    { field: 'root', partial: { root: '/custom/root' }, pick: (config) => config.root, value: '/custom/root' },
    { field: 'name', partial: { name: 'gen' }, pick: (config) => config.name, value: 'gen' },
    { field: 'adapter', partial: { adapter }, pick: (config) => config.adapter, value: adapter },
    { field: 'parsers', partial: { parsers }, pick: (config) => config.parsers, value: parsers },
    { field: 'reporters', partial: { reporters }, pick: (config) => config.reporters, value: reporters },
    { field: 'output.barrel', partial: { output: { path: './gen', barrel } }, pick: (config) => config.output.barrel, value: barrel },
    { field: 'output.barrel set to false', partial: { output: { path: './gen', barrel: false } }, pick: (config) => config.output.barrel, value: false },
    { field: 'output.postGenerate', partial: { output: { path: './gen', postGenerate } }, pick: (config) => config.output.postGenerate, value: postGenerate },
  ]

  test.each(explicitFields)('preserves an explicit $field', ({ partial, pick, value }) => {
    expect(pick(resolve(partial))).toStrictEqual(value)
  })

  const shapes: Array<ConfigShapeRow> = [
    { shape: 'an object', config: defineConfig({ ...minimal }), count: 1 },
    { shape: 'an array', config: defineConfig([{ ...minimal }, { ...minimal }]), count: 2 },
    { shape: 'a function', config: defineConfig(() => ({ ...minimal })), count: 1 },
    { shape: 'an async function', config: defineConfig(async () => ({ ...minimal })), count: 1 },
    { shape: 'a function returning an array', config: defineConfig(() => [{ ...minimal }]), count: 1 },
    { shape: 'an async function returning an array', config: defineConfig(async () => [{ ...minimal }]), count: 1 },
    { shape: 'a promise', config: defineConfig(Promise.resolve({ ...minimal })), count: 1 },
    { shape: 'a promise of an array', config: defineConfig(Promise.resolve([{ ...minimal }])), count: 1 },
  ]

  test.each(shapes)('applies defaults when config is $shape', async ({ config, count }) => {
    const configs = await settle(config)

    expect(configs).toHaveLength(count)
    for (const resolved of configs) {
      expect(resolved.root).toBe(process.cwd())
      expect(resolved.adapter?.name).toBe('oas')
      expect(resolved.plugins?.map((plugin) => plugin.name)).toStrictEqual([pluginBarrelName])
      expect(resolved.output).toStrictEqual({ path: './gen', barrel: false, format: false, lint: false })
    }
  })

  test('infers the input type from the config shape', () => {
    expectTypeOf(defineConfig({ ...minimal })).toEqualTypeOf<UserConfig<string>>()
    expectTypeOf(defineConfig({ input: { openapi: '3.1.0' }, output: { path: './gen' } })).toEqualTypeOf<UserConfig<{ openapi: string }>>()
    expectTypeOf(defineConfig([{ ...minimal }])).toEqualTypeOf<Array<UserConfig<string>>>()
    expectTypeOf(defineConfig(() => ({ ...minimal }))).toEqualTypeOf<(cli: CLIOptions) => Promise<UserConfig<string>>>()
    expectTypeOf(defineConfig(async () => ({ ...minimal }))).toEqualTypeOf<(cli: CLIOptions) => Promise<UserConfig<string>>>()
    expectTypeOf(defineConfig(Promise.resolve({ ...minimal }))).toEqualTypeOf<Promise<UserConfig<string>>>()
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
