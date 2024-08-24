import type client from '@kubb/plugin-client/client'
import type { DeleteUserMutationResponse, DeleteUserPathParams } from '../../../models/ts/userController/DeleteUser'
import axios from 'axios'
import type { ResponseConfig } from '@kubb/plugin-client/client'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export async function deleteUser(
  username: DeleteUserPathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<DeleteUserMutationResponse>['data']> {
  return axios.delete(`/user/${username}`, options)
}
