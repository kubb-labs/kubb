import { expectTypeOf } from 'vitest'

import type { petStore } from '../../mocks/petStore.ts'
import type { Infer, MethodMap, Model, PathMap, RequestParams, Response } from './index.ts'

describe('swagger Infer', () => {
  type Oas = Infer<typeof petStore>
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
