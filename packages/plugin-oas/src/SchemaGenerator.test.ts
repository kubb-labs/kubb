import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { parse, type SchemaObject } from '@kubb/oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, expect, test } from 'vitest'
import { mockedPluginManager } from '#mocks'
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
      name: 'variant (lowercase)',
      input: '../mocks/duplicateCasing.yaml',
      path: 'variant',
      options: {
        dateType: 'date',
        transformers: {},
        unknownType: 'unknown',
      },
    },
    {
      name: 'Variant (uppercase)',
      input: '../mocks/duplicateCasing.yaml',
      path: 'Variant',
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
    const tree = generator.parse({ schema: schema, name: props.name, parentName: null })

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

    const tree = generator.parse({
      schema: malformedSchema,
      name: 'TestArrayEnum',
      parentName: null,
    })

    expect(tree).toMatchSnapshot()
  })

  test('duplicate schema names with different casing should generate unique names', async () => {
    const oas = await parse(path.resolve(__dirname, '../mocks/duplicateCasing.yaml'))
    
    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      emptySchemaType: 'unknown',
      dateType: 'date',
      transformers: {},
      unknownType: 'unknown',
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
    
    // Parse both schemas to ensure they both get registered
    const lowercaseTree = generator.parse({
      schema: { $ref: '#/components/schemas/variant' } as SchemaObject,
      name: null,
      parentName: null,
    })
    
    const uppercaseTree = generator.parse({
      schema: { $ref: '#/components/schemas/Variant' } as SchemaObject,
      name: null,
      parentName: null,
    })
    
    // Extract the ref names from the trees
    const lowercaseRef = lowercaseTree.find((item) => item.keyword === 'ref') as any
    const uppercaseRef = uppercaseTree.find((item) => item.keyword === 'ref') as any
    
    expect(lowercaseRef).toBeDefined()
    expect(uppercaseRef).toBeDefined()
    
    // The refs should have different names (one should have a suffix)
    // Both should normalize to "Variant" but one should get "Variant2" to avoid collision
    expect(lowercaseRef?.args?.name).toBe('Variant')
    expect(uppercaseRef?.args?.name).toBe('Variant2')
  })
})
