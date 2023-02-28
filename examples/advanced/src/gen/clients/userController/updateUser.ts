import client from '../../../client'

import type { UpdateUserRequest, UpdateUserResponse, UpdateUserPathParams } from '../../models/ts/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/{username}
 * @deprecated
 */
export const updateUser = <TData = UpdateUserResponse, TVariables = UpdateUserRequest>(username: UpdateUserPathParams['username'], data: TVariables) => {
  return client<TData, TVariables>({
    method: 'put',
    url: `/user/${username}`,
    data,
  })
}
