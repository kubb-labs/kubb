import { ast, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { detectSharedSchemas } from './detectSharedSchemas.ts'
import { Diagnostics } from './Diagnostics.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config } from './types.ts'

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

    const { configs, conflicts, inputs } = await detectSharedSchemas([animals, fruits])

    expect(configs.map((config) => config.output.shared?.schemas)).toStrictEqual([
      ['Name', 'Color'],
      ['Name', 'Color'],
    ])
    expect(conflicts).toStrictEqual([])
    expect(configs.map((config) => inputs.get(config)?.inputNode.schemas.length)).toStrictEqual([3, 3])
  })

  it('shares a schema that only some configs define, and lists on each config only the shared schemas it defines', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const address = () => object('Address', { street: string() })
    const pets = makeConfig([name(), address(), object('Pet', { name: ref('Name') })])
    const shop = makeConfig([address(), object('Order', { address: ref('Address') })])
    const components = makeConfig([name()])

    const { configs, conflicts } = await detectSharedSchemas([pets, shop, components])

    expect(configs.map((config) => config.output.shared?.schemas)).toStrictEqual([['Name', 'Address'], ['Address'], ['Name']])
    expect(conflicts).toStrictEqual([])
  })

  it('shares a schema with the configs that define it the same, and the schemas that reference it, when another defines it differently', async () => {
    const badge = () => object('Badge', { tag: ref('Tag') })
    const pets = makeConfig([object('Tag', { label: string() }), badge()])
    const shop = makeConfig([object('Tag', { label: string() }), badge()])
    const components = makeConfig([object('Tag', { text: string() }), badge()])

    const { configs, conflicts } = await detectSharedSchemas([pets, shop, components])

    expect(configs.map((config) => config.output.shared?.schemas)).toStrictEqual([['Tag', 'Badge'], ['Tag', 'Badge'], []])
    expect(conflicts).toStrictEqual(['Tag'])
  })

  it('keeps the diagnostics the adapter reports while parsing, for the build to report', async () => {
    const warning = { code: Diagnostics.code.invalidSpec, severity: 'warning', message: 'Broken spec.' } as const
    const animals = makeConfig([string()])
    const fruits = makeConfig([string()])
    vi.mocked(fruits.adapter!.parse).mockImplementation(async () => {
      Diagnostics.report(warning)
      return ast.factory.createInput()
    })

    const { configs, inputs } = await detectSharedSchemas([animals, fruits])

    expect(configs.map((config) => inputs.get(config)?.diagnostics)).toStrictEqual([[], [warning]])
  })

  it('keeps a schema defined differently, and every shared candidate that references it, in each output', async () => {
    const swatch = () => object('Swatch', { color: ref('Color') })
    const animals = makeConfig([object('Color', { hex: string() }), swatch()])
    const fruits = makeConfig([object('Color', { rgb: string() }), swatch()])

    const { configs, conflicts } = await detectSharedSchemas([animals, fruits])

    expect(configs.map((config) => config.output.shared?.schemas)).toStrictEqual([[], []])
    expect(conflicts).toStrictEqual(['Color'])
  })

  it('replaces a schemas list set by hand with the detected one', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const animals = makeConfig([name(), object('Animal', {})], { path: './gen/common', schemas: ['Animal'] })
    const fruits = makeConfig([name(), object('Fruit', {})], { path: './gen/common', schemas: ['Fruit'] })

    const { configs } = await detectSharedSchemas([animals, fruits])

    expect(configs.map((config) => config.output.shared?.schemas)).toStrictEqual([['Name'], ['Name']])
  })

  it('leaves configs without output.shared, or alone in their shared path, untouched', async () => {
    const unshared = makeConfig([string()], undefined)
    const alone = makeConfig([string()], { path: './gen/other' })

    const { configs } = await detectSharedSchemas([unshared, alone])

    expect(configs).toStrictEqual([unshared, alone])
    for (const config of configs) expect(config.adapter!.parse).not.toHaveBeenCalled()
  })
})
