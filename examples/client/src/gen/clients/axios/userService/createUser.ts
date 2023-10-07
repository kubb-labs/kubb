import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */

export async function createUser<TData = CreateUserMutationResponse, TVariables = CreateUserMutationRequest>(
  data?: TVariables,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData, TVariables>({
    method: 'post',
    url: `/user`,

    data,

    ...options,
  })

  return resData
}
