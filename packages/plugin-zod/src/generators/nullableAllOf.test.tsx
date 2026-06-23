import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config, Plugin } from '@kubb/core'
import type { SchemaObject } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildSchema, SchemaGenerator } from '@kubb/plugin-oas'
import { getSchemas } from '@kubb/plugin-oas/utils'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, expect, test } from 'vitest'
import { createMockedPluginManager } from '#mocks'
import type { PluginZod } from '../types.ts'
import { zodGenerator } from './zodGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generate(name: string, mini: boolean): Promise<string> {
  const fabric = createReactFabric()
  const oas = await parse(path.resolve(__dirname, '../../mocks/nullableAllOf.yaml'))

  const options: PluginZod['resolvedOptions'] = {
    dateType: 'date',
    transformers: {},
    inferred: false,
    typed: false,
    unknownType: 'any',
    integerType: 'number',
    mapper: {},
    importPath: mini ? 'zod/mini' : 'zod',
    coercion: false,
    operations: false,
    override: [],
    output: { path: '.' },
    group: undefined,
    wrapOutput: undefined,
    version: '3',
    guidType: 'uuid',
    emptySchemaType: 'unknown',
    mini,
  }
  const plugin = { options } as Plugin<PluginZod>
  const generator = new SchemaGenerator(options, {
    fabric,
    oas,
    pluginManager: createMockedPluginManager(name),
    plugin,
    contentType: 'application/json',
    include: undefined,
    override: undefined,
    mode: 'split',
    output: './gen',
  })

  const { schemas } = getSchemas({ oas })
  const schema = schemas[name] as SchemaObject
  const tree = generator.parse({ schema, name, parentName: null })

  await buildSchema(
    { name, tree, value: schema },
    {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      generator,
      Component: zodGenerator.Schema,
      plugin,
    },
  )

  return fabric.files.flatMap((file) => file.sources?.map((source) => source.value) ?? []).join('\n')
}

// https://github.com/kubb-labs/kubb/issues/3661
describe('nullable allOf (issue #3661)', () => {
  test('a single nullable allOf member wraps the schema in .nullable()', async () => {
    const output = await generate('NullableAllOf', false)

    expect(output).not.toContain('.and(.nullable())')
    expect(output).toContain('z.lazy(() => nullableString).nullable()')
  })

  test('a nullable member of a multi-member allOf wraps the whole intersection', async () => {
    const output = await generate('NullableAllOfMulti', false)

    expect(output).not.toContain('.and(.nullable())')
    expect(output).toContain('z.lazy(() => base).and(z.lazy(() => nullableString)).nullable()')
  })

  test('mini mode wraps the schema with z.nullable()', async () => {
    const output = await generate('NullableAllOf', true)

    expect(output).not.toContain('.and(.nullable())')
    expect(output).toContain('z.nullable(z.lazy(() => nullableString))')
  })
})
