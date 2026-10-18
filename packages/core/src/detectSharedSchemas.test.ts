import { ast, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { detectSharedSchemas } from './detectSharedSchemas.ts'
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
  it('shares the schemas every config defines identically, with the schemas they reference', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const color = () => object('Color', { hex: string(), name: ref('Name') })
    const animals = makeConfig([name(), color(), object('Animal', { name: ref('Name') })])
    const fruits = makeConfig([object('Fruit', { color: ref('Color') }), color(), name()])

    const { configs, conflicts } = await detectSharedSchemas([animals, fruits])

    expect(configs.map((config) => config.output.shared?.schemas)).toStrictEqual([
      ['Name', 'Color'],
      ['Name', 'Color'],
    ])
    expect(conflicts).toStrictEqual([])
  })

  it('keeps a schema defined differently, and every shared candidate that references it, in each output', async () => {
    const swatch = () => object('Swatch', { color: ref('Color') })
    const animals = makeConfig([object('Color', { hex: string() }), swatch()])
    const fruits = makeConfig([object('Color', { rgb: string() }), swatch()])

    const { configs, conflicts } = await detectSharedSchemas([animals, fruits])

    expect(configs.map((config) => config.output.shared?.schemas)).toStrictEqual([[], []])
    expect(conflicts).toStrictEqual(['Color'])
  })

  it('leaves configs with a schemas list, without output.shared, or alone in their shared path untouched', async () => {
    const listed = makeConfig([string()], { path: './gen/common', schemas: ['Name'] })
    const unshared = makeConfig([string()], undefined)
    const alone = makeConfig([string()], { path: './gen/other' })

    const { configs } = await detectSharedSchemas([listed, unshared, alone])

    expect(configs).toStrictEqual([listed, unshared, alone])
    for (const config of configs) expect(config.adapter!.parse).not.toHaveBeenCalled()
  })
})
