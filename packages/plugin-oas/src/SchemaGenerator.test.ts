import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { mockedPluginManager } from '@kubb/core/mocks'
import { parse } from '@kubb/oas'
import { type GetSchemaGeneratorOptions, SchemaGenerator } from './SchemaGenerator.ts'

describe('SchemaGenerator core', async () => {
  const testData = [
    {
      name: 'Pet',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'FullAddress',
      input: '../mocks/petStore.yaml',
      path: 'FullAddress',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'Owner',
      input: '../mocks/petStore.yaml',
      path: 'Owner',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'Pets',
      input: '../mocks/petStore.yaml',
      path: 'Pets',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'Toy',
      input: '../mocks/petStore.yaml',
      path: 'Toy',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'PageSize',
      input: '../mocks/petStore.yaml',
      path: 'PageSize',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    // Add discriminator test cases
  ] as const satisfies Array<{ input: string; name: string; path: string; options: Partial<GetSchemaGeneratorOptions<SchemaGenerator>> }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))
    const schemas = oas.getDefinition().components?.schemas
    const schema = schemas?.[props.path]

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      ...props.options,
    }
    const plugin = { options } as Plugin<any>
    const generator = new SchemaGenerator(options, {
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const tree = generator.parse({ schemaObject: schema, name: props.name })

    expect(tree).toMatchSnapshot()
  })
})
