import client from '../../../client'
import type { DeleteUserMutationResponse, DeleteUserPathParams } from '../../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */

export function deleteUser<TData = DeleteUserMutationResponse>(
  username: DeleteUserPathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData>({
    method: 'delete',
    url: `/user/${username}`,

    ...options,
  })
}
