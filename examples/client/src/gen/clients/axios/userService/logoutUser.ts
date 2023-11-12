import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser(options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<LogoutUserQueryResponse>['data']> {
  const { data: resData } = await client<LogoutUserQueryResponse>({
    method: 'get',
    url: `/user/logout`,
    ...options,
  })
  return resData
}
