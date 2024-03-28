import type client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import axios from 'axios'
import type { GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../../models/ts/userController/GetUserByName'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export async function getUserByName(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetUserByNameQueryResponse>['data']> {
  return axios.get(`/user/${username}`, options)
}
