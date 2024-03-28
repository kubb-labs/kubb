import type client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import axios from 'axios'
import type { DeleteUserMutationResponse, DeleteUserPathParams } from '../../../models/ts/userController/DeleteUser'

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
