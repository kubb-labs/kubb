import type client from '@kubb/plugin-client/client'
import axios from 'axios'
import type { ResponseConfig } from '@kubb/plugin-client/client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export async function createUser(
  data?: CreateUserMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUserMutationResponse>['data']> {
  return axios.post('/user', data, options)
}
