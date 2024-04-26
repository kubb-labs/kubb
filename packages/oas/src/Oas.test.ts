import path from 'node:path'

import yaml from '@stoplight/yaml'
import { expectTypeOf } from 'expect-type'

import { petStore } from '../mocks/petStore.ts'

import { Oas } from './Oas.ts'
import type { Infer, MethodMap, Model, PathMap, RequestParams, Response } from './infer/index.ts'
import { parse } from './parser/index.ts'

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
    const oas = await parse(petStorePath, {
      filterSet: {
        inverseMethods: ['put'],
        operationIds: ['updateUser'],
      },
    })

    expect(yaml.safeStringify(oas.api)).toMatchSnapshot()
  })
})
