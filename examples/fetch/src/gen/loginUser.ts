import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from './models.ts'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({ method: 'GET', url: '/user/login', params, ...config })
  return res.data
}
