import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'

export function getCreateUserUrl() {
  return new URL('/user', 'https://petstore3.swagger.io/api/v3')
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser({ data }: { data?: CreateUserMutationRequest }, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationRequest>({
    method: 'POST',
    url: getCreateUserUrl().toString(),
    data,
    ...config,
  })
  return res
}
