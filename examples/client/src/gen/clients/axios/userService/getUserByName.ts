import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type { GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../../models/ts/userController/GetUserByName'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export async function getUserByName<TData = GetUserByNameQueryResponse>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData>({
    method: 'get',
    url: `/user/${username}`,
    ...options,
  })

  return resData
}
