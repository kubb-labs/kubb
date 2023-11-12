import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export async function createUser(
  data?: CreateUserMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUserMutationResponse>['data']> {
  const { data: resData } = await client<CreateUserMutationResponse, CreateUserMutationRequest>({
    method: 'post',
    url: `/user`,
    data,
    ...options,
  })
  return resData
}
