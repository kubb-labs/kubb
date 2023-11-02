import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<LoginUserQueryResponse>['data']> {
  const { data: resData } = await client<LoginUserQueryResponse>({
    method: 'get',
    url: `/user/login`,
    params,
    ...options,
  })

  return resData
}
