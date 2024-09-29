import client from '../../../../axios-client.js'
import type { RequestConfig } from '../../../../axios-client.js'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.js'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({
    method: 'GET',
    url: '/user/login',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res
}
