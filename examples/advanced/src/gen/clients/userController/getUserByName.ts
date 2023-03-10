import client from '../../../client'

import type { GetUserByNameResponse, GetUserByNamePathParams, GetUserByNameQueryParams } from '../../models/ts/GetUserByName'

/**
 * @summary Get user by user name
 * @link /user/{username}
 * @deprecated
 */
export function getUserByName<TData = GetUserByNameResponse>(username: GetUserByNamePathParams['username'], params?: GetUserByNameQueryParams) {
  return client<TData>({
    method: 'get',
    url: `/user/${username}`,
    params,
  })
}
