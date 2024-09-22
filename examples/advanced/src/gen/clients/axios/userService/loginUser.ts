import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<LoginUserQueryResponse>> {
  const res = await client<LoginUserQueryResponse>({ method: 'get', url: '/user/login', baseURL: 'https://petstore3.swagger.io/api/v3', params, ...options })
  return res
}
