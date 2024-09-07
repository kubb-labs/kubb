import client from '../../../../axios-client.ts'
import type { RequestConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse>({ method: 'get', url: '/user/logout', baseURL: 'https://petstore3.swagger.io/api/v3', ...config })
  return res
}
