import client from '../../../client'

import type { ResponseConfig } from '../../../client'
import type { LoginUserQueryParams, LoginUserQueryResponse } from '../../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser<TData = LoginUserQueryResponse>(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData>({
    method: 'get',
    url: `/user/login`,
    params,
    ...options,
  })

  return resData
}
