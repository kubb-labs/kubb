import client from '@kubb/plugin-client/clients/fetch'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from './models.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/fetch'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser(data?: CreateUserMutationRequest, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, Error, CreateUserMutationRequest>({ method: 'POST', url: '/user', data, ...config })
  return res.data
}
