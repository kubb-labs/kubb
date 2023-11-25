import { expectTypeOf } from 'expect-type'

import type { oas } from '../../mocks/oas.ts'
import type { Infer, MethodMap, Model, RequestParams, Response } from './index.ts'

describe('swagger infer', () => {
  type Oas = Infer<typeof oas>
  // type Paths = keyof PathMap<Oas>
  type Methods = keyof MethodMap<Oas, '/pet'>

  type UserModel = Model<Oas, 'User'>
  type UserRequestParams = RequestParams<Oas, '/pet', 'post'>
  type UserResponse = Response<Oas, '/pet', 'post', '200'>
  test('types', () => {
    expectTypeOf<Methods>().toMatchTypeOf<'post' | 'put'>()
    expectTypeOf<UserModel>().toMatchTypeOf<{ username?: string | undefined }>()
    expectTypeOf<UserRequestParams['json']>().toMatchTypeOf<{ status?: 'available' | 'pending' | 'sold' | undefined }>()
    expectTypeOf<UserResponse>().toMatchTypeOf<{ status?: 'available' | 'pending' | 'sold' | undefined }>()
  })
})
