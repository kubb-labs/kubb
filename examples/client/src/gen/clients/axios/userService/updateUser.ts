import client from '../../../client'

import type { ResponseConfig } from '../../../client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export async function updateUser<TData = UpdateUserMutationResponse, TVariables = UpdateUserMutationRequest>(
  username: UpdateUserPathParams['username'],
  data?: TVariables,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData, TVariables>({
    method: 'put',
    url: `/user/${username}`,
    data,
    ...options,
  })

  return resData
}
