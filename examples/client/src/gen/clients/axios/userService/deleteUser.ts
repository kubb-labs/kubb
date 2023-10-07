import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type { DeleteUserMutationResponse, DeleteUserPathParams } from '../../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */

export async function deleteUser<TData = DeleteUserMutationResponse>(
  username: DeleteUserPathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData>({
    method: 'delete',
    url: `/user/${username}`,

    ...options,
  })

  return resData
}
