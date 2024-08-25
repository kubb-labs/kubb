import type { ResponseConfig } from '@kubb/plugin-client/client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams } from '../../../models/ts/userController/GetUserByName'
import type client from '@kubb/plugin-client/client'
import axios from 'axios'

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
