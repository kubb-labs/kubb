import path from 'node:path'

import yaml from '@stoplight/yaml'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { petStore } from '../mocks/petStore.ts'
import type { Infer, MethodMap, Model, PathMap, RequestParams, Response } from './infer/index.ts'
import { Oas } from './Oas.ts'
import type { OpenAPIV3, SchemaObject } from './types.ts'
import { parse } from './utils.ts'

describe('swagger Infer', () => {
  const oas = new Oas({ oas: petStore })
  type Oas = Infer<typeof oas.document>
  //   ^?
  type Paths = keyof PathMap<Oas>
  //    ^?
  type Methods = keyof MethodMap<Oas, '/pet'>
  //     ^?
  type UserModel = Model<Oas, 'User'>
  //     ^?
  type UserRequestParams = RequestParams<Oas, '/pet', 'post'>
  type UserResponse = Response<Oas, '/pet', 'post', '200'>
  test('types', () => {
    expectTypeOf<Paths>().not.toBeUndefined()
    expectTypeOf<Methods>().toMatchTypeOf<'post' | 'put'>()
    expectTypeOf<UserModel>().toMatchTypeOf<{
      username?: string | undefined
    }>()
    expectTypeOf<UserRequestParams['json']>().toMatchTypeOf<{
      status?: 'available' | 'pending' | 'sold' | undefined
    }>()
    expectTypeOf<UserResponse>().toMatchTypeOf<{
      status?: 'available' | 'pending' | 'sold' | undefined
    }>()
  })
})

describe('Oas filter', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')

  test('Filtering on operationId', async () => {
    const oas = await parse(petStorePath)

    expect(yaml.safeStringify(oas.api)).toMatchSnapshot()
  })
})

describe('discriminator', () => {
  describe('inherit mode', () => {
    test('sets enum on mapped schemas before parsing', () => {
      const discriminatorSpec: OpenAPIV3.Document = {
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

      const oas = new Oas({ oas: discriminatorSpec })

      oas.setOptions({ discriminator: 'inherit' })

      const catSchema = oas.get('#/components/schemas/Cat') as OpenAPIV3.SchemaObject
      const dogSchema = oas.get('#/components/schemas/Dog') as OpenAPIV3.SchemaObject
      const catTypeProperty = catSchema.properties?.type as OpenAPIV3.SchemaObject | undefined
      const dogTypeProperty = dogSchema.properties?.type as OpenAPIV3.SchemaObject | undefined

      expect(catTypeProperty?.enum).toEqual(['cat'])
      expect(dogTypeProperty?.enum).toEqual(['dog'])
      expect(catSchema.required?.filter((value) => value === 'type')).toEqual(['type'])
      expect(dogSchema.required?.filter((value) => value === 'type')).toEqual(['type'])
    })
  })

  describe('strict mode', () => {
    test('keeps original schemas when discriminator option is strict', () => {
      const discriminatorSpec: OpenAPIV3.Document = {
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

      const oas = new Oas({ oas: discriminatorSpec })

      oas.setOptions({ discriminator: 'strict' })

      const catSchema = oas.get('#/components/schemas/Cat') as OpenAPIV3.SchemaObject
      const dogSchema = oas.get('#/components/schemas/Dog') as OpenAPIV3.SchemaObject
      const catTypeProperty = catSchema.properties?.type as OpenAPIV3.SchemaObject | undefined
      const dogTypeProperty = dogSchema.properties?.type as OpenAPIV3.SchemaObject | undefined

      expect(catTypeProperty?.enum).toBeUndefined()
      expect(dogTypeProperty?.enum).toBeUndefined()
      expect(catSchema.required?.filter((value) => value === 'type')).toEqual(['type'])
      expect(dogSchema.required?.filter((value) => value === 'type')).toEqual(['type'])
    })
  })

  describe('getDiscriminator', () => {
    test('handles inline schemas with extension properties as discriminator values', () => {
      const discriminatorSpec: OpenAPIV3.Document = {
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
                    } as any,
                    {
                      type: 'array',
                      title: 'Stats Unavailable',
                      'x-linode-ref-name': 'Stats Unavailable',
                      items: {
                        type: 'string',
                      },
                    } as any,
                  ],
                } as any,
              },
            },
          },
        },
      }

      const oas = new Oas({ oas: discriminatorSpec })
      const testDataSchema = oas.get('#/components/schemas/TestData') as OpenAPIV3.SchemaObject
      const dataProperty = testDataSchema.properties?.data as OpenAPIV3.SchemaObject

      const discriminator = oas.getDiscriminator(dataProperty)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('x-linode-ref-name')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['Stats Available']).toBe('#inline-0')
      expect(discriminator?.mapping?.['Stats Unavailable']).toBe('#inline-1')
    })

    test('handles inline schemas with const values as discriminator', () => {
      const discriminatorSpec: OpenAPIV3.Document = {
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
            } as any,
          },
        },
      }

      const oas = new Oas({ oas: discriminatorSpec })
      const petSchema = oas.get('#/components/schemas/Pet') as OpenAPIV3.SchemaObject

      const discriminator = oas.getDiscriminator(petSchema)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('petType')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['cat']).toBe('#inline-0')
      expect(discriminator?.mapping?.['dog']).toBe('#inline-1')
    })

    test('handles mixed ref and inline schemas', () => {
      const discriminatorSpec: OpenAPIV3.Document = {
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
            } as any,
          },
        },
      }

      const oas = new Oas({ oas: discriminatorSpec })
      const animalSchema = oas.get('#/components/schemas/Animal') as OpenAPIV3.SchemaObject

      const discriminator = oas.getDiscriminator(animalSchema)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('type')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['cat']).toBe('#/components/schemas/Cat')
      expect(discriminator?.mapping?.['dog']).toBe('#inline-1')
    })

    test('handles Linode API pattern with mixed object and array types', () => {
      const discriminatorSpec: OpenAPIV3.Document = {
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
                    } as any,
                    {
                      type: 'array',
                      title: 'Stats unavailable',
                      'x-linode-ref-name': 'Stats Unavailable',
                      items: {
                        type: 'string',
                      },
                    } as any,
                  ],
                } as any,
              },
            },
          },
        },
      }

      const oas = new Oas({ oas: discriminatorSpec })
      const testDataSchema = oas.get('#/components/schemas/TestData') as OpenAPIV3.SchemaObject
      const dataProperty = testDataSchema.properties?.data as OpenAPIV3.SchemaObject

      const discriminator = oas.getDiscriminator(dataProperty)

      expect(discriminator).toBeDefined()
      expect(discriminator?.propertyName).toBe('x-linode-ref-name')
      expect(discriminator?.mapping).toBeDefined()
      expect(discriminator?.mapping?.['Stats Available']).toBe('#inline-0')
      expect(discriminator?.mapping?.['Stats Unavailable']).toBe('#inline-1')
    })
  })
})

describe('flattenSchema', () => {
  test('merges non-structural allOf fragments for OpenAPI 3.0', () => {
    const schema = {
      type: 'string',
      allOf: [{ minLength: 2 }, { pattern: '^[a-z]+$' }, { description: 'letters only' }],
    } as SchemaObject

    const oas = new Oas({
      oas: {
        openapi: '3.0.3',
        info: { title: 'Flatten', version: '1.0.0' },
        paths: {},
        components: { schemas: { Example: schema } },
      },
    })

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
      oas: {
        openapi: '3.1.0',
        info: { title: 'Flatten 3.1', version: '1.0.0' },
        paths: {},
        components: { schemas: { Example: schema } },
      },
    })

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
      oas: {
        openapi: '3.1.0',
        info: { title: 'Flatten 3.1 structural', version: '1.0.0' },
        paths: {},
        components: { schemas: { Example: schema } },
      },
    })

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
      oas: {
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
      },
    })

    const flattened = oas.flattenSchema(schema)

    expect(flattened).toMatchObject({
      allOf: [{ $ref: '#/components/schemas/PhoneNumber' }, { maxLength: 15 }],
    })
  })
})

describe('getParametersSchema with explode and style form', () => {
  test('flattens object with additionalProperties when explode=true and style=form', () => {
    const spec: OpenAPIV3.Document = {
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

    const oas = new Oas({ oas: spec })
    const operation = oas.operation('/systems', 'get')
    const querySchema = oas.getParametersSchema(operation, 'query')

    // Should flatten the object to root level with additionalProperties
    expect(querySchema?.type).toBe('object')
    expect(querySchema?.additionalProperties).toEqual({ type: 'string' })
    expect(querySchema?.properties).toEqual({})
    expect(querySchema?.description).toBe('Custom fields')
  })

  test('does not flatten object with properties when explode=true', () => {
    const spec: OpenAPIV3.Document = {
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

    const oas = new Oas({ oas: spec })
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
    const spec: OpenAPIV3.Document = {
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

    const oas = new Oas({ oas: spec })
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
    const spec: OpenAPIV3.Document = {
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

    const oas = new Oas({ oas: spec })
    const operation = oas.operation('/systems', 'get')
    const querySchema = oas.getParametersSchema(operation, 'query')

    // Should preserve all parameters while flattening the exploded one
    expect(querySchema?.type).toBe('object')
    expect(querySchema?.properties?.limit).toBeDefined()
    expect(querySchema?.properties?.offset).toBeDefined()
    expect(querySchema?.additionalProperties).toEqual({ type: 'string' })
  })
})
