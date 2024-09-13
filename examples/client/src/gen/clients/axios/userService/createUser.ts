/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export async function createUser(data?: CreateUserMutationRequest, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, unknown, CreateUserMutationRequest>({
    method: 'post',
    url: '/user',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}
