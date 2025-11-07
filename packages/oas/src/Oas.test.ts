import path from 'node:path'

import yaml from '@stoplight/yaml'
import type { OpenAPIV3 } from 'openapi-types'
import { expect, expectTypeOf } from 'vitest'

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

describe('discriminator inherit', () => {
  test('sets enum on mapped schemas before parsing', () => {
    const oas = new Oas({ oas: petStore })

    oas.setOptions({ discriminator: 'inherit' })

    const catSchema = oas.get('#/components/schemas/Cat') as OpenAPIV3.SchemaObject
    const dogSchema = oas.get('#/components/schemas/Dog') as OpenAPIV3.SchemaObject

    expect(catSchema.properties?.type?.enum).toEqual(['cat'])
    expect(dogSchema.properties?.type?.enum).toEqual(['dog'])
    expect(catSchema.required?.filter((value) => value === 'type')).toEqual(['type'])
    expect(dogSchema.required?.filter((value) => value === 'type')).toEqual(['type'])
  })
})
