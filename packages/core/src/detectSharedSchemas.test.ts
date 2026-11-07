import { ast, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'

const checkout = vi.hoisted(() => ({ path: '/tmp/kubb-git/spec.yaml', dispose: vi.fn(async () => {}) }))
vi.mock('./gitInput.ts', async (importOriginal) => ({ ...(await importOriginal<object>()), checkoutGitInput: vi.fn(async () => checkout) }))

import { detectSharedSchemas } from './detectSharedSchemas.ts'
import { Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, KubbHooks } from './types.ts'

const ref = (name: string) => ast.factory.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}` })
const object = (name: string, properties: Record<string, SchemaNode>) =>
  ast.factory.createSchema({
    type: 'object',
    name,
    properties: Object.entries(properties).map(([key, schema]) => ast.factory.createProperty({ name: key, schema })),
  })
const string = () => ast.factory.createSchema({ type: 'string' })

function makeConfig(schemas: Array<SchemaNode>, shared: Config['output']['shared'] = { path: './gen/common' }): Config {
  return {
    root: '/project',
    input: './spec.json',
    output: { path: './gen/api', shared },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter({ parse: vi.fn(async () => ast.factory.createInput({ schemas })) }),
    plugins: [],
    storage: memoryStorage(),
  }
}

describe('detectSharedSchemas', () => {
  it('shares the schemas both configs define identically, with the schemas they reference', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const color = () => object('Color', { hex: string(), name: ref('Name') })
    const animals = makeConfig([name(), color(), object('Animal', { name: ref('Name') })])
    const fruits = makeConfig([object('Fruit', { color: ref('Color') }), color(), name()])

    const { configs, conflicts } = await detectSharedSchemas([animals, fruits])

    expect(configs.map(({ config }) => config.output.shared?.schemas)).toStrictEqual([
      ['Name', 'Color'],
      ['Name', 'Color'],
    ])
    expect(conflicts).toStrictEqual([])
    expect(configs.map(({ parsed }) => parsed?.inputNode.schemas.length)).toStrictEqual([3, 3])
  })

  it('shares a schema that only some configs define, and lists on each config only the shared schemas it defines', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const address = () => object('Address', { street: string() })
    const pets = makeConfig([name(), address(), object('Pet', { name: ref('Name') })])
    const shop = makeConfig([address(), object('Order', { address: ref('Address') })])
    const components = makeConfig([name()])

    const { configs, conflicts } = await detectSharedSchemas([pets, shop, components])

    expect(configs.map(({ config }) => config.output.shared?.schemas)).toStrictEqual([['Name', 'Address'], ['Address'], ['Name']])
    expect(conflicts).toStrictEqual([])
  })

  it('shares a schema with the configs that define it the same, and the schemas that reference it, when another defines it differently', async () => {
    const badge = () => object('Badge', { tag: ref('Tag') })
    const pets = makeConfig([object('Tag', { label: string() }), badge()])
    const shop = makeConfig([object('Tag', { label: string() }), badge()])
    const components = makeConfig([object('Tag', { text: string() }), badge()])

    const { configs, conflicts } = await detectSharedSchemas([pets, shop, components])

    expect(configs.map(({ config }) => config.output.shared?.schemas)).toStrictEqual([['Tag', 'Badge'], ['Tag', 'Badge'], []])
    expect(conflicts).toStrictEqual(['Tag'])
  })

  it('parses a git input from its checkout, and deletes the checkout afterwards', async () => {
    const animals = { ...makeConfig([string()]), input: 'git+https://github.com/org/api.git#main:spec.yaml' }
    const fruits = makeConfig([string()])

    await detectSharedSchemas([animals, fruits])

    expect(animals.adapter!.parse).toHaveBeenCalledWith({ type: 'path', path: checkout.path }, expect.anything())
    expect(checkout.dispose).toHaveBeenCalledOnce()
  })

  it('keeps the diagnostics the adapter reports while parsing, for the build to report', async () => {
    const warning = { code: Diagnostics.code.invalidSpec, severity: 'warning', message: 'Broken spec.' } as const
    const animals = makeConfig([string()])
    const fruits = makeConfig([string()])
    vi.mocked(fruits.adapter!.parse).mockImplementation(async () => {
      Diagnostics.report(warning)
      return ast.factory.createInput()
    })

    const { configs } = await detectSharedSchemas([animals, fruits])

    expect(configs.map(({ parsed }) => parsed?.diagnostics)).toStrictEqual([[], [warning]])
  })

  it('keeps a schema defined differently, and every shared candidate that references it, in each output', async () => {
    const swatch = () => object('Swatch', { color: ref('Color') })
    const animals = makeConfig([object('Color', { hex: string() }), swatch()])
    const fruits = makeConfig([object('Color', { rgb: string() }), swatch()])

    const { configs, conflicts } = await detectSharedSchemas([animals, fruits])

    expect(configs.map(({ config }) => config.output.shared?.schemas)).toStrictEqual([[], []])
    expect(conflicts).toStrictEqual(['Color'])
  })

  it('lists a plugin that configs sharing a path set up with different options, ignoring key order and functions', async () => {
    const plugin = (name: string, options: object) => ({ name, options }) as unknown as Config['plugins'][number]
    const animals = {
      ...makeConfig([string()]),
      plugins: [plugin('plugin-ts', { enumType: 'asConst', output: { path: 'types' }, transform: () => 1 }), plugin('plugin-zod', {})],
    }
    const fruits = {
      ...makeConfig([string()]),
      plugins: [plugin('plugin-ts', { output: { path: 'types' }, enumType: 'asConst', transform: () => 2 }), plugin('plugin-zod', { coercion: true })],
    }

    const { mismatchedPlugins } = await detectSharedSchemas([animals, fruits])

    expect(mismatchedPlugins).toStrictEqual(['plugin-zod'])
  })

  it('replaces a schemas list set by hand with the detected one', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const animals = makeConfig([name(), object('Animal', {})], { path: './gen/common', schemas: ['Animal'] })
    const fruits = makeConfig([name(), object('Fruit', {})], { path: './gen/common', schemas: ['Fruit'] })

    const { configs } = await detectSharedSchemas([animals, fruits])

    expect(configs.map(({ config }) => config.output.shared?.schemas)).toStrictEqual([['Name'], ['Name']])
  })

  it('reports a conflict and a plugin set up differently as kubb:warn when given hooks', async () => {
    const plugin = (options: object) => ({ name: 'plugin-zod', options }) as unknown as Config['plugins'][number]
    const animals = { ...makeConfig([object('Color', { hex: string() })]), plugins: [plugin({})] }
    const fruits = { ...makeConfig([object('Color', { rgb: string() })]), plugins: [plugin({ coercion: true })] }
    const hooks = new Hookable<KubbHooks>()
    const warn = vi.fn()
    hooks.hook('kubb:warn', warn)

    await detectSharedSchemas([animals, fruits], { hooks })

    expect(warn.mock.calls.map(([{ message }]) => message)).toStrictEqual([
      'The specs define these schemas differently: Color.',
      'Configs that share an `output.shared.path` set different options for: plugin-zod.',
    ])
  })

  it('leaves configs without output.shared, or alone in their shared path, untouched', async () => {
    const unshared = makeConfig([string()], undefined)
    const alone = makeConfig([string()], { path: './gen/other' })

    const { configs } = await detectSharedSchemas([unshared, alone])

    expect(configs).toStrictEqual([{ config: unshared }, { config: alone }])
    for (const { config } of configs) expect(config.adapter!.parse).not.toHaveBeenCalled()
  })

  it('marks the first config of a shared directory to clean it when any config that uses it sets output.clean', async () => {
    const animals = makeConfig([string()])
    const fruits = { ...makeConfig([string()]), output: { path: './gen/fruits', clean: true, shared: { path: './gen/common' } } }
    const alone = { ...makeConfig([string()], { path: './gen/other' }), output: { path: './gen/alone', clean: true, shared: { path: './gen/other' } } }

    const { configs } = await detectSharedSchemas([animals, fruits, alone])

    expect(configs.map(({ config }) => config.output.shared?.clean)).toStrictEqual([true, false, true])
  })

  it('shares nothing in a group whose spec fails to parse, and leaves the error to the build', async () => {
    const animals = makeConfig([ast.factory.createSchema({ type: 'string', name: 'Name' })])
    const fruits = makeConfig([ast.factory.createSchema({ type: 'string', name: 'Name' })])
    vi.mocked(fruits.adapter!.parse).mockRejectedValue(new Error('broken'))

    const { configs } = await detectSharedSchemas([animals, fruits])

    expect(configs.map(({ config, parsed }) => [config.output.shared?.schemas, parsed])).toStrictEqual([
      [[], undefined],
      [[], undefined],
    ])
  })
})
