import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse, type SchemaObject } from '@kubb/oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, expect, test } from 'vitest'
import { createMockedPlugin, mockedPluginManager } from '#mocks'
import { type GetSchemaGeneratorOptions, SchemaGenerator } from './SchemaGenerator.ts'
import { schemaKeywords } from './SchemaMapper.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('SchemaGenerator core', async () => {
  const fabric = createReactFabric()
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
    {
      name: 'PhoneWithMaxLength',
      input: '../mocks/allOfMaxLength.yaml',
      path: 'PhoneWithMaxLength',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'PhoneWithMaxLengthExplicit',
      input: '../mocks/allOfMaxLength.yaml',
      path: 'PhoneWithMaxLengthExplicit',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'EmptyAnyOf',
      input: '../mocks/anyOfEmpty.yaml',
      path: 'EmptyAnyOf',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'BinaryAnyOf',
      input: '../mocks/binaryAnyOf.yaml',
      path: 'BodyTest',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'ContentMediaTypeBlob',
      input: '../mocks/binaryFormat.yaml',
      path: 'BodyTest',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    // Add discriminator test cases
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    options: Partial<GetSchemaGeneratorOptions<SchemaGenerator>>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))
    const schemas = oas.getDefinition().components?.schemas
    const schema = schemas?.[props.path] as SchemaObject

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      emptySchemaType: 'unknown',
      ...props.options,
    }
    const plugin = createMockedPlugin<any>({ name: 'plugin-oas', options })

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
    const tree = generator.parse({
      schema: schema,
      name: props.name,
      parentName: null,
    })

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
              path: './typescript/src/gen/models.ts',
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

  test('array of enums with malformed schema (enum at array level)', async () => {
    const oas = await parse(path.resolve(__dirname, '../mocks/petStore.yaml'))

    // Malformed schema: enum at same level as type: array
    // This should be normalized to: { type: 'array', items: { type: 'string', enum: [...] } }
    const malformedSchema = {
      type: 'array',
      enum: ['foo', 'bar', 'baz'],
      items: {
        type: 'string',
      },
    } as SchemaObject

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      emptySchemaType: 'unknown',
      dateType: 'date',
      transformers: {},
      unknownType: 'unknown',
    }
    const plugin = createMockedPlugin<any>({ name: 'plugin-oas', options })

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

    const tree = generator.parse({
      schema: malformedSchema,
      name: 'TestArrayEnum',
      parentName: null,
    })

    expect(tree).toMatchSnapshot()
  })

  test('non-component internal $ref (e.g. #/paths/...) should be resolved inline, not named "itemsSchema"', async () => {
    // When `bundle()` deduplicates external schemas that are first encountered as array items,
    // it creates $refs like "#/paths/~1proposals/get/.../schema/items". The last segment "items"
    // must NOT be used as the schema name – it should be resolved inline instead.
    const oasDoc: Record<string, unknown> = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/proposals': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          title: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/drafts': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      // $ref created by bundle() pointing to the items of the first occurrence
                      items: { $ref: '#/paths/~1proposals/get/responses/200/content/application~1json/schema/items' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const oas = await parse(oasDoc as any)

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      emptySchemaType: 'unknown',
      dateType: 'date',
      transformers: {},
      unknownType: 'unknown',
    }
    const plugin = createMockedPlugin<any>({ name: 'plugin-oas', options })

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

    const draftsSchema = (oasDoc.paths as any)['/drafts'].get.responses['200'].content['application/json'].schema as SchemaObject

    const tree = generator.parse({
      schema: draftsSchema,
      name: 'ListDraftsResponse',
      parentName: null,
    })

    // Must NOT contain a ref with name "items" or "itemsSchema" – those are wrong names from path segments
    const refItems = SchemaGenerator.deepSearch(tree, schemaKeywords.ref)
    const hasItemsRef = refItems.some((item) => item.args?.name === 'items' || item.args?.name === 'itemsSchema')
    expect(hasItemsRef).toBe(false)

    // The items should resolve to an inline object schema
    expect(tree).toMatchSnapshot()
  })
})
