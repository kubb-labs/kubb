import client from '../../../../axios-client.js'
import type { RequestConfig } from '../../../../axios-client.js'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.js'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res
}
