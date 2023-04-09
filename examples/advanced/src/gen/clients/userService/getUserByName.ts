import client from '../../../client'

import type { GetUserByNameResponse, GetUserByNamePathParams } from '../../models/ts/userController/GetUserByName'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function getUserByName<TData = GetUserByNameResponse>(username: GetUserByNamePathParams['username']) {
  return client<TData>({
    method: 'get',
    url: `/user/${username}`,
  })
}
