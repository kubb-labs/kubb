import type { ResponseConfig } from '../../../../axios-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser'
import client from '../../../../axios-client.ts'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<LoginUserQueryResponse>> {
  const res = await client<LoginUserQueryResponse>({ method: 'get', url: '/user/login', params, ...options })
  return res
}
