import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { LogoutUserQueryResponse } from './models.ts'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser(options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<LogoutUserQueryResponse>['data']> {
  const res = await client<LogoutUserQueryResponse>({ method: 'get', url: '/user/logout', baseURL: 'https://petstore3.swagger.io/api/v3', ...options })
  return res.data
}
