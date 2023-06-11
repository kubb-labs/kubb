import client from '../client'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function logoutUser<TData = LogoutUserQueryResponse>() {
  return client<TData>({
    method: 'get',
    url: `/user/logout`,
  })
}
