import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { LogoutUserQueryResponse } from './models.ts'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, unknown, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}
