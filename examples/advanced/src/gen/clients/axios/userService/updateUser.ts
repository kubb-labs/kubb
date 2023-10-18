import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export async function updateUser<TData = UpdateUserMutationResponse, TVariables = UpdateUserMutationRequest>(
  { username }: UpdateUserPathParams,
  data?: TVariables,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>> {
  return client<TData, TVariables>({
    method: 'put',
    url: `/user/${username}`,
    data,
    ...options,
  })
}
