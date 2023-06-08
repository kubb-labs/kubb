import client from '../../../../client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function updateUser<TData = UpdateUserMutationResponse, TVariables = UpdateUserMutationRequest>(
  username: UpdateUserPathParams['username'],
  data: TVariables
) {
  return client<TData, TVariables>({
    method: 'put',
    url: `/user/${username}`,
    data,
  })
}
