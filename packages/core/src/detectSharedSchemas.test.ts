import { ast, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'

const checkout = vi.hoisted(() => ({ path: '/tmp/kubb-git/spec.yaml', dispose: vi.fn(async () => {}) }))
vi.mock('./gitInput.ts', async (importOriginal) => ({ ...(await importOriginal<object>()), checkoutGitInput: vi.fn(async () => checkout) }))

import { detectSharedSchemas } from './detectSharedSchemas.ts'
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

// Collects the `kubb:warn` messages detection reports.
async function detect(configs: Array<Config>) {
  const hooks = new Hookable<KubbHooks>()
  const warnings: Array<string> = []
  hooks.hook('kubb:warn', ({ message }) => void warnings.push(message))
  const result = await detectSharedSchemas(configs, hooks)
  return { schemas: result.map((config) => config.output.shared?.schemas), warnings, result }
}

describe('detectSharedSchemas', () => {
  it('shares the schemas both configs define identically, with the schemas they reference', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const color = () => object('Color', { hex: string(), name: ref('Name') })
    const animals = makeConfig([name(), color(), object('Animal', { name: ref('Name') })])
    const fruits = makeConfig([object('Fruit', { color: ref('Color') }), color(), name()])

    const { schemas, warnings } = await detect([animals, fruits])

    expect(schemas).toStrictEqual([
      ['Name', 'Color'],
      ['Name', 'Color'],
    ])
    expect(warnings).toStrictEqual([])
  })

  it('shares a schema that only some configs define, and lists on each config only the shared schemas it defines', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const address = () => object('Address', { street: string() })
    const pets = makeConfig([name(), address(), object('Pet', { name: ref('Name') })])
    const shop = makeConfig([address(), object('Order', { address: ref('Address') })])
    const components = makeConfig([name()])

    const { schemas } = await detect([pets, shop, components])

    expect(schemas).toStrictEqual([['Name', 'Address'], ['Address'], ['Name']])
  })

  it('shares a schema with the configs that define it the same, and the schemas that reference it, when another defines it differently', async () => {
    const badge = () => object('Badge', { tag: ref('Tag') })
    const pets = makeConfig([object('Tag', { label: string() }), badge()])
    const shop = makeConfig([object('Tag', { label: string() }), badge()])
    const components = makeConfig([object('Tag', { text: string() }), badge()])

    const { schemas, warnings } = await detect([pets, shop, components])

    expect(schemas).toStrictEqual([['Tag', 'Badge'], ['Tag', 'Badge'], []])
    expect(warnings).toStrictEqual(['The specs define these schemas differently: Tag.'])
  })

  it('keeps a schema defined differently, and every shared candidate that references it, in each output', async () => {
    const swatch = () => object('Swatch', { color: ref('Color') })
    const animals = makeConfig([object('Color', { hex: string() }), swatch()])
    const fruits = makeConfig([object('Color', { rgb: string() }), swatch()])

    const { schemas, warnings } = await detect([animals, fruits])

    expect(schemas).toStrictEqual([[], []])
    expect(warnings).toStrictEqual(['The specs define these schemas differently: Color.'])
  })

  it('parses a git input from its checkout, and deletes the checkout afterwards', async () => {
    const animals = { ...makeConfig([string()]), input: 'git+https://github.com/org/api.git#main:spec.yaml' }
    const fruits = makeConfig([string()])

    await detect([animals, fruits])

    expect(animals.adapter!.parse).toHaveBeenCalledWith({ type: 'path', path: checkout.path }, expect.anything())
    expect(checkout.dispose).toHaveBeenCalledOnce()
  })

  it('replaces a schemas list set by hand with the detected one', async () => {
    const name = () => ast.factory.createSchema({ type: 'string', name: 'Name' })
    const animals = makeConfig([name(), object('Animal', {})], { path: './gen/common', schemas: ['Animal'] })
    const fruits = makeConfig([name(), object('Fruit', {})], { path: './gen/common', schemas: ['Fruit'] })

    const { schemas } = await detect([animals, fruits])

    expect(schemas).toStrictEqual([['Name'], ['Name']])
  })

  it('leaves the configs untouched, without parsing, when fewer than two set output.shared', async () => {
    const unshared = { ...makeConfig([string()]), output: { path: './gen/api' } }
    const alone = makeConfig([string()])

    const { result } = await detect([unshared, alone])

    expect(result).toStrictEqual([unshared, alone])
    for (const config of result) expect(config.adapter!.parse).not.toHaveBeenCalled()
  })

  it('shares nothing when a spec fails to parse, and leaves the error to the build', async () => {
    const animals = makeConfig([ast.factory.createSchema({ type: 'string', name: 'Name' })])
    const fruits = makeConfig([ast.factory.createSchema({ type: 'string', name: 'Name' })])
    vi.mocked(fruits.adapter!.parse).mockRejectedValue(new Error('broken'))

    const { result } = await detect([animals, fruits])

    expect(result).toStrictEqual([animals, fruits])
  })

  it('compares the configs of each shared path on their own', async () => {
    const tag = (field: string) => object('Tag', { [field]: string() })
    const a = makeConfig([tag('label')])
    const b = makeConfig([tag('label')])
    const c = makeConfig([tag('text')], { path: './gen/other' })
    const d = makeConfig([tag('text')], { path: './gen/other' })
    const e = makeConfig([tag('text')], { path: './gen/other' })

    const { schemas } = await detect([a, b, c, d, e])

    expect(schemas).toStrictEqual([['Tag'], ['Tag'], ['Tag'], ['Tag'], ['Tag']])
  })

  it('marks the first config of a shared directory to clean it when any config that uses it sets output.clean', async () => {
    const animals = makeConfig([string()])
    const fruits = { ...makeConfig([string()]), output: { path: './gen/fruits', clean: true, shared: { path: './gen/common' } } }
    const alone = { ...makeConfig([string()], { path: './gen/other' }), output: { path: './gen/alone', clean: true, shared: { path: './gen/other' } } }

    const { result } = await detect([animals, fruits, alone])

    expect(result.map((config) => config.output.shared?.clean)).toStrictEqual([true, false, true])
  })
})
