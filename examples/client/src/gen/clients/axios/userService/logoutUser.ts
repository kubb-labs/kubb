import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */

export async function logoutUser<TData = LogoutUserQueryResponse>(options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData>({
    method: 'get',
    url: `/user/logout`,

    ...options,
  })

  return resData
}
