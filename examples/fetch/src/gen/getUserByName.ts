import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams } from './models.ts'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export async function getUserByName(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetUserByNameQueryResponse>['data']> {
  const res = await client<GetUserByNameQueryResponse>({ method: 'get', url: `/user/${username}`, baseURL: 'https://petstore3.swagger.io/api/v3', ...options })
  return res.data
}
