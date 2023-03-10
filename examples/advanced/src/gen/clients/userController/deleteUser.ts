import client from '../../../client'

import type { DeleteUserRequest, DeleteUserResponse, DeleteUserPathParams } from '../../models/ts/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/{username}
 * @deprecated
 */
export function deleteUser<TData = DeleteUserResponse, TVariables = DeleteUserRequest>(username: DeleteUserPathParams['username']) {
  return client<TData, TVariables>({
    method: 'delete',
    url: `/user/${username}`,
  })
}
