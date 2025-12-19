import path from 'node:path'

import yaml from '@stoplight/yaml'

import { petStore } from '../mocks/petStore.ts'
import type { Infer, MethodMap, Model, PathMap, RequestParams, Response } from './infer/index.ts'
import { Oas } from './Oas.ts'
import type { OpenAPIV3 } from './types.ts'
import { parse } from './utils.ts'
import { describe, expect, expectTypeOf, test } from 'vitest'


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
describe('discriminator inherit', () => {
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
