import path from 'node:path'

import yaml from '@stoplight/yaml'
import { expectTypeOf } from 'vitest'

import { petStore } from '../mocks/petStore.ts'
import type { Infer, MethodMap, Model, PathMap, RequestParams, Response } from './infer/index.ts'
import { Oas } from './Oas.ts'
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

describe('Oas discriminator', () => {
  const animalSchema = {
    openapi: '3.0.3',
    components: {
      schemas: {
        Animal: {
          title: 'Animal',
          required: ['type'],
          type: 'object',
          oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
          properties: {
            type: {
              type: 'string',
              enum: ['cat', 'dog'],
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
          title: 'Cat',
          type: 'object',
          required: ['indoor', 'type'],
          properties: {
            type: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            indoor: {
              type: 'boolean',
            },
          },
        },
        Dog: {
          title: 'Dog',
          type: 'object',
          required: ['name', 'type'],
          properties: {
            type: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
          },
        },
      },
    },
  }

  test('discriminator with strict mode should not modify child schemas', () => {
    const oas = new Oas({ oas: animalSchema })
    oas.setOptions({ discriminator: 'strict' })

    const discriminator = oas.getDiscriminator(oas.get('#/components/schemas/Animal'))

    expect(discriminator).toEqual({
      propertyName: 'type',
      mapping: {
        cat: '#/components/schemas/Cat',
        dog: '#/components/schemas/Dog',
      },
    })

    // Check that child schemas are NOT modified in strict mode
    const catSchema = oas.get('#/components/schemas/Cat')
    const dogSchema = oas.get('#/components/schemas/Dog')

    // In strict mode, the type property should remain as string (not enum)
    expect(catSchema.properties?.type).toEqual({ type: 'string' })
    expect(dogSchema.properties?.type).toEqual({ type: 'string' })

    // Should not have enum added
    expect(catSchema.properties?.type.enum).toBeUndefined()
    expect(dogSchema.properties?.type.enum).toBeUndefined()
  })

  test('discriminator with inherit mode should modify child schemas with enum', () => {
    const oas = new Oas({ oas: JSON.parse(JSON.stringify(animalSchema)) })
    oas.setOptions({ discriminator: 'inherit' })

    const discriminator = oas.getDiscriminator(oas.get('#/components/schemas/Animal'))

    expect(discriminator).toEqual({
      propertyName: 'type',
      mapping: {
        cat: '#/components/schemas/Cat',
        dog: '#/components/schemas/Dog',
      },
    })

    // Check that child schemas ARE modified in inherit mode
    const catSchema = oas.get('#/components/schemas/Cat')
    const dogSchema = oas.get('#/components/schemas/Dog')

    // In inherit mode, the type property should have enum with the discriminator value
    expect(catSchema.properties?.type).toEqual({
      type: 'string',
      enum: ['cat'],
    })
    expect(dogSchema.properties?.type).toEqual({
      type: 'string',
      enum: ['dog'],
    })

    // Should have the discriminator property as required
    expect(catSchema.required).toContain('type')
    expect(dogSchema.required).toContain('type')
  })

  test('discriminator should handle mapping generation from oneOf when not defined', () => {
    const schemaWithoutMapping = {
      openapi: '3.0.3',
      components: {
        schemas: {
          Animal: {
            title: 'Animal',
            required: ['type'],
            type: 'object',
            oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            properties: {
              type: {
                type: 'string',
              },
            },
            discriminator: {
              propertyName: 'type',
            },
          },
          Cat: {
            title: 'Cat',
            type: 'object',
            properties: {
              type: { type: 'string' },
            },
          },
          Dog: {
            title: 'Dog',
            type: 'object',
            properties: {
              type: { type: 'string' },
            },
          },
        },
      },
    }

    const oas = new Oas({ oas: schemaWithoutMapping })
    const discriminator = oas.getDiscriminator(oas.get('#/components/schemas/Animal'))

    // Should auto-generate mapping from schema keys
    expect(discriminator?.mapping).toEqual({
      Cat: '#/components/schemas/Cat',
      Dog: '#/components/schemas/Dog',
    })
  })
})
