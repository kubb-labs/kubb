import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { Oas } from './Oas.ts'
import type { Document, SchemaObject } from './types.ts'
import { parse } from './utils.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('[oas] filter', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')

  test('Filtering on operationId', async () => {
    const oas = await parse(petStorePath)

    expect(JSON.stringify(oas.api, null, 2)).toMatchSnapshot()
  })
})

describe('[oas] discriminator', () => {
  test('sets enum on mapped schemas before parsing', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: {
        title: 'Discriminator inherit',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {
          Animal: {
            type: 'object',
            required: ['type'],
            oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            properties: {
              type: {
                type: 'string',
              },
            },
            discriminator: {
              propertyName: 'type',
              mapping: {
                cat: '#/components/schemas/Cat',
                dog: '#/components/schemas/Dog',
              },
            },
          },
          Cat: {
            type: 'object',
            required: ['type'],
            properties: {
              type: {
                type: 'string',
              },
            },
          },
          Dog: {
            type: 'object',
            required: ['type'],
            properties: {
              type: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const oas = new Oas(document)

    oas.setOptions({ discriminator: 'inherit' })

    const catSchema = oas.get<SchemaObject>('#/components/schemas/Cat')
    const dogSchema = oas.get<SchemaObject>('#/components/schemas/Dog')
    const catTypeProperty = catSchema?.properties?.type as SchemaObject | undefined
    const dogTypeProperty = dogSchema?.properties?.type as SchemaObject | undefined

    expect(catTypeProperty?.enum).toEqual(['cat'])
    expect(dogTypeProperty?.enum).toEqual(['dog'])
    expect(catSchema?.required).toMatchInlineSnapshot(`
      [
        "type",
      ]
    `)
    expect(dogSchema?.required).toMatchInlineSnapshot(`
      [
        "type",
      ]
    `)
  })

  test('keeps original schemas when discriminator option is strict', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: {
        title: 'Discriminator strict',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {
          Animal: {
            type: 'object',
            required: ['type'],
            oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            properties: {
              type: {
                type: 'string',
              },
            },
            discriminator: {
              propertyName: 'type',
              mapping: {
                cat: '#/components/schemas/Cat',
                dog: '#/components/schemas/Dog',
              },
            },
          },
          Cat: {
            type: 'object',
            required: ['type'],
            properties: {
              type: {
                type: 'string',
              },
            },
          },
          Dog: {
            type: 'object',
            required: ['type'],
            properties: {
              type: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const oas = new Oas(document)

    oas.setOptions({ discriminator: 'strict' })

    const catSchema = oas.get<SchemaObject>('#/components/schemas/Cat')
    const dogSchema = oas.get<SchemaObject>('#/components/schemas/Dog')
    const catTypeProperty = catSchema?.properties?.type as SchemaObject | undefined
    const dogTypeProperty = dogSchema?.properties?.type as SchemaObject | undefined

    expect(catTypeProperty?.enum).toBeUndefined()
    expect(dogTypeProperty?.enum).toBeUndefined()
    expect(catSchema?.required).toMatchInlineSnapshot(`
      [
        "type",
      ]
    `)
    expect(dogSchema?.required).toMatchInlineSnapshot(`
      [
        "type",
      ]
    `)
  })

  describe('getDiscriminator', () => {
    test('handles inline schemas with extension properties as discriminator values', () => {
      const document: Document = {
        openapi: '3.1.0',
        info: {
          title: 'Inline Discriminator with Extension',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            TestData: {
              type: 'object',
              properties: {
                data: {
                  discriminator: {
                    propertyName: 'x-linode-ref-name',
                  },
                  oneOf: [
                    {
                      type: 'object',
                      title: 'Stats Available',
                      'x-linode-ref-name': 'Stats Available',
                      properties: {
                        cpu: {
                          type: 'array',
                          items: {
                            type: 'number',
                          },
                        },
                      },
                    },
                    {
                      type: 'array',
                      title: 'Stats Unavailable',
                      'x-linode-ref-name': 'Stats Unavailable',
                      items: {
                        type: 'string',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      } as unknown as Document

      const oas = new Oas(document)
      const schema = oas.get<SchemaObject>('#/components/schemas/TestData')
      const dataProperty = schema?.properties?.data as SchemaObject

      const discriminator = oas.getDiscriminator(dataProperty)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('x-linode-ref-name')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['Stats Available']).toBe('#kubb-inline-0')
      expect(discriminator?.mapping?.['Stats Unavailable']).toBe('#kubb-inline-1')
    })

    test('handles inline schemas with const values as discriminator', () => {
      const document: Document = {
        openapi: '3.1.0',
        info: {
          title: 'Inline Discriminator with Const',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Pet: {
              discriminator: {
                propertyName: 'petType',
              },
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    petType: {
                      type: 'string',
                      const: 'cat',
                    },
                    meow: {
                      type: 'boolean',
                    },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    petType: {
                      type: 'string',
                      const: 'dog',
                    },
                    bark: {
                      type: 'boolean',
                    },
                  },
                },
              ],
            },
          },
        },
      }

      const oas = new Oas(document)
      const schema = oas.get<SchemaObject>('#/components/schemas/Pet')

      const discriminator = oas.getDiscriminator(schema!)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('petType')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['cat']).toBe('#kubb-inline-0')
      expect(discriminator?.mapping?.['dog']).toBe('#kubb-inline-1')
    })

    test('handles mixed ref and inline schemas', () => {
      const document: Document = {
        openapi: '3.1.0',
        info: {
          title: 'Mixed Discriminator',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Cat: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  const: 'cat',
                },
              },
            },
            Animal: {
              discriminator: {
                propertyName: 'type',
              },
              oneOf: [
                { $ref: '#/components/schemas/Cat' },
                {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      const: 'dog',
                    },
                  },
                },
              ],
            },
          },
        },
      }

      const oas = new Oas(document)
      const schema = oas.get('#/components/schemas/Animal')

      const discriminator = oas.getDiscriminator(schema!)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('type')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['cat']).toBe('#/components/schemas/Cat')
      expect(discriminator?.mapping?.['dog']).toBe('#kubb-inline-1')
    })

    test('handles Linode API pattern with mixed object and array types', () => {
      const document: Document = {
        openapi: '3.1.0',
        info: {
          title: 'Linode Discriminator',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            TestData: {
              type: 'object',
              properties: {
                data: {
                  discriminator: {
                    propertyName: 'x-linode-ref-name',
                  },
                  oneOf: [
                    {
                      type: 'object',
                      title: 'Stats available',
                      'x-linode-ref-name': 'Stats Available',
                      properties: {
                        swap: {
                          type: 'array',
                          items: {
                            type: 'object',
                          },
                        },
                      },
                    },
                    {
                      type: 'array',
                      title: 'Stats unavailable',
                      'x-linode-ref-name': 'Stats Unavailable',
                      items: {
                        type: 'string',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      } as unknown as Document

      const oas = new Oas(document)
      const schema = oas.get<SchemaObject>('#/components/schemas/TestData')
      const dataProperty = schema?.properties?.data as SchemaObject

      const discriminator = oas.getDiscriminator(dataProperty)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('x-linode-ref-name')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['Stats Available']).toBe('#kubb-inline-0')
      expect(discriminator?.mapping?.['Stats Unavailable']).toBe('#kubb-inline-1')
    })

    test('handles discriminator without explicit mapping - infers from schema names', () => {
      const document: Document = {
        openapi: '3.0.3',
        info: {
          title: 'Discriminator No Mapping',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Animal: {
              type: 'object',
              required: ['petType'],
              discriminator: {
                propertyName: 'petType',
              },
              oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            },
            Cat: {
              type: 'object',
              properties: {
                petType: {
                  type: 'string',
                },
              },
            },
            Dog: {
              type: 'object',
              properties: {
                petType: {
                  type: 'string',
                },
              },
            },
          },
        },
      }

      const oas = new Oas(document)
      const schema = oas.get<SchemaObject>('#/components/schemas/Animal')

      const discriminator = oas.getDiscriminator(schema)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('petType')
      expect(discriminator?.mapping).toBeDefined()
      // When no explicit mapping, schema names are used as keys
      expect(discriminator?.mapping?.['Cat']).toBe('#/components/schemas/Cat')
      expect(discriminator?.mapping?.['Dog']).toBe('#/components/schemas/Dog')
    })

    test('handles discriminator with anyOf', () => {
      const document: Document = {
        openapi: '3.1.0',
        info: {
          title: 'Discriminator with anyOf',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Pet: {
              discriminator: {
                propertyName: 'type',
                mapping: {
                  cat: '#/components/schemas/Cat',
                  dog: '#/components/schemas/Dog',
                },
              },
              anyOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            },
            Cat: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                },
              },
            },
            Dog: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                },
              },
            },
          },
        },
      }

      const oas = new Oas(document)
      const schema = oas.get<SchemaObject>('#/components/schemas/Pet')

      const discriminator = oas.getDiscriminator(schema)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('type')
      expect(discriminator?.mapping?.['cat']).toBe('#/components/schemas/Cat')
      expect(discriminator?.mapping?.['dog']).toBe('#/components/schemas/Dog')
    })

    test('handles discriminator with title fallback for inline schemas', () => {
      const document: Document = {
        openapi: '3.1.0',
        info: {
          title: 'Discriminator Title Fallback',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Response: {
              discriminator: {
                propertyName: 'status',
              },
              oneOf: [
                {
                  type: 'object',
                  title: 'Success',
                  properties: {
                    status: { type: 'string' },
                    data: { type: 'object' },
                  },
                },
                {
                  type: 'object',
                  title: 'Error',
                  properties: {
                    status: { type: 'string' },
                    error: { type: 'string' },
                  },
                },
              ],
            },
          },
        },
      }

      const oas = new Oas(document)
      const schema = oas.get<SchemaObject>('#/components/schemas/Response')

      const discriminator = oas.getDiscriminator(schema)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('status')
      // Should use title as fallback when no explicit discriminator value
      expect(discriminator?.mapping?.['Success']).toBe('#kubb-inline-0')
      expect(discriminator?.mapping?.['Error']).toBe('#kubb-inline-1')
    })

    test('handles discriminator with single-value enum', () => {
      const document: Document = {
        openapi: '3.0.3',
        info: {
          title: 'Discriminator Enum',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Animal: {
              discriminator: {
                propertyName: 'petType',
              },
              oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            },
            Cat: {
              type: 'object',
              properties: {
                petType: {
                  type: 'string',
                  enum: ['cat'],
                },
              },
            },
            Dog: {
              type: 'object',
              properties: {
                petType: {
                  type: 'string',
                  enum: ['dog'],
                },
              },
            },
          },
        },
      }

      const oas = new Oas(document)
      const schema = oas.get<SchemaObject>('#/components/schemas/Animal')

      const discriminator = oas.getDiscriminator(schema)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('petType')
      // Should extract enum value for mapping
      expect(discriminator?.mapping?.['cat']).toBe('#/components/schemas/Cat')
      expect(discriminator?.mapping?.['dog']).toBe('#/components/schemas/Dog')
    })
  })
})

describe('[oas] flattenSchema', () => {
  test('merges non-structural allOf fragments for OpenAPI 3.0', () => {
    const schema = {
      type: 'string',
      allOf: [{ minLength: 2 }, { pattern: '^[a-z]+$' }, { description: 'letters only' }],
    } as SchemaObject

    const oas = new Oas({
      openapi: '3.0.3',
      info: { title: 'Flatten', version: '1.0.0' },
      paths: {},
      components: { schemas: { Example: schema } },
    } as Document)

    const flattened = oas.flattenSchema(schema)

    expect(flattened).toEqual({
      type: 'string',
      minLength: 2,
      pattern: '^[a-z]+$',
      description: 'letters only',
    })
    expect(flattened?.allOf).toBeUndefined()
  })

  test('merges keyword-only fragments for OpenAPI 3.1', () => {
    const schema = {
      type: 'number',
      allOf: [{ minimum: 1 }, { exclusiveMaximum: 10 }, { description: 'v3.1 merge' }],
    } as SchemaObject

    const oas = new Oas({
      openapi: '3.1.0',
      info: { title: 'Flatten 3.1', version: '1.0.0' },
      paths: {},
      components: { schemas: { Example: schema } },
    } as Document)

    const flattened = oas.flattenSchema(schema)

    expect(flattened).toMatchObject({
      type: 'number',
      minimum: 1,
      exclusiveMaximum: 10,
      description: 'v3.1 merge',
    })
    expect(flattened?.allOf).toBeUndefined()
  })

  test('merges structural allOf fragments with OpenAPI 3.1 applicator keywords', () => {
    const schema = {
      type: 'array',
      allOf: [{ prefixItems: [{ type: 'string' }] }, { minItems: 1 }],
    } as SchemaObject

    const oas = new Oas({
      openapi: '3.1.0',
      info: { title: 'Flatten 3.1 structural', version: '1.0.0' },
      paths: {},
      components: { schemas: { Example: schema } },
    } as Document)

    const flattened = oas.flattenSchema(schema)

    expect(flattened).toEqual({
      type: 'array',
      prefixItems: [{ type: 'string' }],
      minItems: 1,
    })
    expect(flattened?.allOf).toBeUndefined()
  })

  test('preserves inline constraints alongside $ref in allOf', () => {
    const schema = {
      allOf: [{ $ref: '#/components/schemas/PhoneNumber' }, { maxLength: 15 }],
    } as SchemaObject

    const oas = new Oas({
      openapi: '3.0.3',
      info: { title: 'Flatten refs', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          PhoneNumber: {
            type: 'string',
            maxLength: 30,
          },
          PhoneWithMaxLength: schema,
        },
      },
    } as Document)

    const flattened = oas.flattenSchema(schema)

    expect(flattened).toMatchObject({
      allOf: [{ $ref: '#/components/schemas/PhoneNumber' }, { maxLength: 15 }],
    })
  })
})

describe('[oas] getParametersSchema with explode and style form', () => {
  test('flattens object with additionalProperties when explode=true and style=form', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/systems': {
          get: {
            operationId: 'systems',
            parameters: [
              {
                name: 'customFields',
                in: 'query',
                description: 'Custom fields',
                style: 'form',
                explode: true,
                schema: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                  example: {
                    'cf-department': 'IT',
                    'cf-costCenter': '102030',
                  },
                },
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    }

    const oas = new Oas(document)
    const operation = oas.operation('/systems', 'get')
    const querySchema = oas.getParametersSchema(operation, 'query')

    // Should flatten the object to root level with additionalProperties
    expect(querySchema?.type).toBe('object')
    expect(querySchema?.additionalProperties).toEqual({ type: 'string' })
    expect(querySchema?.properties).toEqual({})
    expect(querySchema?.description).toBe('Custom fields')
  })

  test('does not flatten object with properties when explode=true', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/systems': {
          get: {
            operationId: 'systems',
            parameters: [
              {
                name: 'filter',
                in: 'query',
                style: 'form',
                explode: true,
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    age: { type: 'number' },
                  },
                },
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    }

    const oas = new Oas(document)
    const operation = oas.operation('/systems', 'get')
    const querySchema = oas.getParametersSchema(operation, 'query')

    // Should NOT flatten when there are defined properties
    expect(querySchema?.type).toBe('object')
    expect(querySchema?.properties?.filter).toBeDefined()
    expect(querySchema?.properties?.filter).toMatchObject({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    })
  })

  test('does not flatten when explode=false', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/systems': {
          get: {
            operationId: 'systems',
            parameters: [
              {
                name: 'customFields',
                in: 'query',
                style: 'form',
                explode: false,
                schema: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    }

    const oas = new Oas(document)
    const operation = oas.operation('/systems', 'get')
    const querySchema = oas.getParametersSchema(operation, 'query')

    // Should NOT flatten when explode is false
    expect(querySchema?.type).toBe('object')
    expect(querySchema?.properties?.customFields).toBeDefined()
    expect(querySchema?.properties?.customFields).toMatchObject({
      type: 'object',
      additionalProperties: { type: 'string' },
    })
  })

  test('handles multiple parameters with one exploded additionalProperties', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/systems': {
          get: {
            operationId: 'systems',
            parameters: [
              {
                name: 'limit',
                in: 'query',
                description: 'Limit results',
                schema: {
                  type: 'integer',
                },
              },
              {
                name: 'customFields',
                in: 'query',
                description: 'Custom fields',
                style: 'form',
                explode: true,
                schema: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
              },
              {
                name: 'offset',
                in: 'query',
                description: 'Offset results',
                schema: {
                  type: 'integer',
                },
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    }

    const oas = new Oas(document)
    const operation = oas.operation('/systems', 'get')
    const querySchema = oas.getParametersSchema(operation, 'query')

    // Should preserve all parameters while flattening the exploded one
    expect(querySchema?.type).toBe('object')
    expect(querySchema?.properties?.limit).toBeDefined()
    expect(querySchema?.properties?.offset).toBeDefined()
    expect(querySchema?.additionalProperties).toEqual({ type: 'string' })
  })
})

describe('[oas] getSchemas x-ext', () => {
  test('should collect schemas from x-ext when included', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: '#/x-ext/abc123' },
                  },
                },
              },
            },
          },
        },
      },
      'x-ext': {
        abc123: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
      'x-ext-urls': {
        'https://example.com/schemas/users.yaml': 'abc123',
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas, nameMapping } = oas.getSchemas({ includes: ['schemas', 'x-ext'] })

    expect(schemas['users']).toBeDefined()
    expect(schemas['users']?.type).toBe('object')
    expect(nameMapping.get('#/x-ext/abc123')).toBe('users')
  })

  test('should fall back to hash as name when no URL mapping exists', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      'x-ext': {
        deadbeef: {
          type: 'object',
          properties: { id: { type: 'number' } },
        },
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas, nameMapping } = oas.getSchemas({ includes: ['x-ext'] })

    expect(schemas['deadbeef']).toBeDefined()
    expect(nameMapping.get('#/x-ext/deadbeef')).toBe('deadbeef')
  })

  test('should not include x-ext schemas by default', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Foo: { type: 'object' },
        },
      },
      'x-ext': {
        abc123: { type: 'object' },
      },
      'x-ext-urls': {
        'https://example.com/bar.yaml': 'abc123',
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas } = oas.getSchemas()

    expect(Object.keys(schemas)).toEqual(['Foo'])
    expect(schemas['bar']).toBeUndefined()
  })

  test('should resolve collisions between x-ext and components schemas', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          users: { type: 'object', description: 'local' },
        },
      },
      'x-ext': {
        abc123: { type: 'object', description: 'external' },
      },
      'x-ext-urls': {
        'https://example.com/schemas/users.yaml': 'abc123',
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas, nameMapping } = oas.getSchemas({ includes: ['schemas', 'x-ext'], collisionDetection: true })

    // Both should exist with semantic suffixes
    expect(schemas['usersSchema']).toBeDefined()
    expect(schemas['usersExt']).toBeDefined()
    expect(nameMapping.get('#/components/schemas/users')).toBe('usersSchema')
    expect(nameMapping.get('#/x-ext/abc123')).toBe('usersExt')
  })
})

describe('[oas] getSchemas parameters', () => {
  test('should collect schemas from components.parameters when included', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        parameters: {
          limitParam: {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
          offsetParam: {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', minimum: 0 },
          },
        },
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas, nameMapping } = oas.getSchemas({ includes: ['parameters'] })

    expect(schemas['limitParam']).toBeDefined()
    expect(schemas['limitParam']?.type).toBe('integer')
    expect(schemas['offsetParam']).toBeDefined()
    expect(nameMapping.get('#/components/parameters/limitParam')).toBe('limitParam')
    expect(nameMapping.get('#/components/parameters/offsetParam')).toBe('offsetParam')
  })

  test('should skip parameters whose schema is a bare $ref', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: { LimitSchema: { type: 'integer' } },
        parameters: {
          refParam: {
            name: 'limit',
            in: 'query',
            schema: { $ref: '#/components/schemas/LimitSchema' },
          },
          inlineParam: {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer' },
          },
        },
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas } = oas.getSchemas({ includes: ['parameters'] })

    // refParam should be skipped (bare $ref schema)
    expect(schemas['refParam']).toBeUndefined()
    // inlineParam should be included
    expect(schemas['inlineParam']).toBeDefined()
  })

  test('should not include parameters by default', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: { Foo: { type: 'object' } },
        parameters: {
          barParam: { name: 'bar', in: 'query', schema: { type: 'string' } },
        },
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas } = oas.getSchemas()

    expect(Object.keys(schemas)).toEqual(['Foo'])
    expect(schemas['barParam']).toBeUndefined()
  })

  test('should resolve collisions between parameters and schemas with semantic suffixes', () => {
    const document: Document = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: { limit: { type: 'object', description: 'schema' } },
        parameters: {
          limit: { name: 'limit', in: 'query', schema: { type: 'integer', description: 'param' } },
        },
      },
    } as unknown as Document

    const oas = new Oas(document)
    const { schemas, nameMapping } = oas.getSchemas({ includes: ['schemas', 'parameters'], collisionDetection: true })

    expect(schemas['limitSchema']).toBeDefined()
    expect(schemas['limitParameter']).toBeDefined()
    expect(nameMapping.get('#/components/schemas/limit')).toBe('limitSchema')
    expect(nameMapping.get('#/components/parameters/limit')).toBe('limitParameter')
  })
})
