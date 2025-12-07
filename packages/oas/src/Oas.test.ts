import path from 'node:path'

import yaml from '@stoplight/yaml'
import { expectTypeOf } from 'vitest'

import { petStore } from '../mocks/petStore.ts'
import type { Infer, MethodMap, Model, PathMap, RequestParams, Response } from './infer/index.ts'
import { Oas } from './Oas.ts'
import type { OpenAPIV3 } from './types.ts'
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

describe('Oas multiple content types', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')

  test('getRequestContentTypes returns all content types', async () => {
    const oas = await parse(petStorePath)
    await oas.dereference()

    const paths = oas.getPaths()
    const operation = paths['/pet']?.post

    const contentTypes = oas.getRequestContentTypes(operation)

    expect(contentTypes).toContain('application/json')
    expect(contentTypes).toContain('application/xml')
    expect(contentTypes).toContain('application/x-www-form-urlencoded')
    expect(contentTypes.length).toBeGreaterThan(0)
  })

  test('getResponseContentTypes returns all content types', async () => {
    const oas = await parse(petStorePath)
    await oas.dereference()

    const paths = oas.getPaths()
    const operation = paths['/pet']?.post

    const contentTypes = oas.getResponseContentTypes(operation, '200')

    expect(contentTypes).toContain('application/json')
    expect(contentTypes).toContain('application/xml')
    expect(contentTypes.length).toBeGreaterThan(0)
  })

  test('getRequestSchemasByContentType returns schemas for all content types', async () => {
    const oas = await parse(petStorePath)
    await oas.dereference()

    const paths = oas.getPaths()
    const operation = paths['/pet']?.post

    const schemas = oas.getRequestSchemasByContentType(operation)

    expect(schemas['application/json']).toBeDefined()
    expect(schemas['application/xml']).toBeDefined()
    expect(schemas['application/x-www-form-urlencoded']).toBeDefined()
    expect(Object.keys(schemas).length).toBeGreaterThan(0)
  })

  test('getResponseSchemasByContentType returns schemas for all content types', async () => {
    const oas = await parse(petStorePath)
    await oas.dereference()

    const paths = oas.getPaths()
    const operation = paths['/pet']?.post

    const schemas = oas.getResponseSchemasByContentType(operation, '200')

    expect(schemas['application/json']).toBeDefined()
    expect(schemas['application/xml']).toBeDefined()
    expect(Object.keys(schemas).length).toBeGreaterThan(0)
  })
})
