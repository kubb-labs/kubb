import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { mockedPluginManager } from '#mocks'
import { parse } from '@kubb/oas'
import { createReactFabric } from '@kubb/react-fabric'
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
      emptySchemaType: 'unknown',
      ...props.options,
    }
    const plugin = { options } as Plugin<any>
    const fabric = createReactFabric()

    const generator = new SchemaGenerator(options, {
      fabric,
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

  test('combineObjects', () => {
    const input = [
      {
        keyword: 'and',
        args: [
          {
            keyword: 'ref',
            args: {
              name: 'EventBase',
              $ref: '#/components/schemas/EventBase',
              path: '/Users/stijnvanhullem/Git/external/kubb/examples/typescript/src/gen/models.ts',
              isImportable: true,
            },
          },
          {
            keyword: 'object',
            args: {
              properties: {
                text: [
                  {
                    keyword: 'string',
                  },
                  {
                    keyword: 'schema',
                    args: {
                      type: 'string',
                    },
                  },
                  {
                    keyword: 'name',
                    args: 'text',
                  },
                  {
                    keyword: 'optional',
                  },
                ],
                verified: [
                  {
                    keyword: 'boolean',
                  },
                  {
                    keyword: 'schema',
                    args: {
                      type: 'boolean',
                    },
                  },
                  {
                    keyword: 'name',
                    args: 'verified',
                  },
                  {
                    keyword: 'optional',
                  },
                ],
              },
              additionalProperties: [],
            },
          },
          {
            keyword: 'object',
            args: {
              properties: {
                id: [
                  {
                    keyword: 'uuid',
                  },
                  {
                    keyword: 'schema',
                    args: {
                      type: 'string',
                      format: 'uuid',
                    },
                  },
                  {
                    keyword: 'name',
                    args: 'id',
                  },
                ],
              },
              additionalProperties: [],
            },
          },
          {
            keyword: 'schema',
            args: {
              type: 'object',
            },
          },
          {
            keyword: 'object',
            args: {
              properties: {
                text: [
                  {
                    keyword: 'string',
                  },
                  {
                    keyword: 'schema',
                    args: {
                      type: 'string',
                    },
                  },
                  {
                    keyword: 'name',
                    args: 'text',
                  },
                ],
              },
              additionalProperties: [],
            },
          },
          {
            keyword: 'schema',
            args: {
              type: 'object',
            },
          },
          {
            keyword: 'object',
            args: {
              properties: {
                ts: [
                  {
                    keyword: 'datetime',
                    args: {
                      offset: false,
                    },
                  },
                  {
                    keyword: 'schema',
                    args: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                  {
                    keyword: 'name',
                    args: 'ts',
                  },
                ],
              },
              additionalProperties: [],
            },
          },
          {
            keyword: 'schema',
            args: {
              type: 'object',
            },
          },
        ],
      },
      {
        keyword: 'schema',
        args: {},
      },
    ]

    expect(SchemaGenerator.combineObjects(input)).toMatchSnapshot()
  })
})
