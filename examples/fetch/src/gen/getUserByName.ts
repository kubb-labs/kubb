import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams } from './models.ts'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export async function getUserByName(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetUserByNameQueryResponse>({ method: 'get', url: `/user/${username}`, baseURL: 'https://petstore3.swagger.io/api/v3', ...config })
  return res.data
}
