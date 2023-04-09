import client from '../../../client'

import type { DeleteUserRequest, DeleteUserResponse, DeleteUserPathParams } from '../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function deleteUser<TData = DeleteUserResponse, TVariables = DeleteUserRequest>(username: DeleteUserPathParams['username'], data: TVariables) {
  return client<TData, TVariables>({
    method: 'delete',
    url: `/user/${username}`,
    data,
  })
}
