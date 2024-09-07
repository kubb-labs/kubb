import client from '@kubb/plugin-client/client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams } from '../../../models/ts/userController/GetUserByName.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export async function getUserByName(
  {
    username,
  }: {
    username: GetUserByNamePathParams['username']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<GetUserByNameQueryResponse>({ method: 'get', url: `/user/${username}`, baseURL: 'https://petstore3.swagger.io/api/v3', ...config })
  return res.data
}
