import type client from '@kubb/plugin-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser'
import axios from 'axios'
import type { ResponseConfig } from '@kubb/plugin-client/client'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export async function updateUser(
  username: UpdateUserPathParams['username'],
  data?: UpdateUserMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdateUserMutationResponse>['data']> {
  return axios.put(`/user/${username}`, data, options)
}
