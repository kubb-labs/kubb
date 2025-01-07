import client from '@kubb/plugin-client/clients/fetch'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getCreateUserUrl() {
  return new URL('/user')
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser(data?: CreateUserMutationRequest, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationRequest>({
    method: 'POST',
    url: getCreateUserUrl().toString(),
    data,
    ...config,
  })
  return res.data
}
