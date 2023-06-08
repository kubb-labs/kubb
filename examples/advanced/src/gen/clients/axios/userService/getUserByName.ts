import client from '../../../../client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams } from '../../../models/ts/userController/GetUserByName'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function getUserByName<TData = GetUserByNameQueryResponse>(username: GetUserByNamePathParams['username']) {
  return client<TData>({
    method: 'get',
    url: `/user/${username}`,
  })
}
