import client from '@kubb/plugin-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse>({ method: 'get', url: '/user/login', baseURL: 'https://petstore3.swagger.io/api/v3', params, ...config })
  return res.data
}
