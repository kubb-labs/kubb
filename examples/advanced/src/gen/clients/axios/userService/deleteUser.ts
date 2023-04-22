import client from '../../../../client'

import type { DeleteUserResponse, DeleteUserPathParams } from '../../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function deleteUser<TData = DeleteUserResponse>(username: DeleteUserPathParams['username']) {
  return client<TData>({
    method: 'delete',
    url: `/user/${username}`,
  })
}
