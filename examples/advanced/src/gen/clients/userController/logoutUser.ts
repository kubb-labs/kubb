import client from '../../../client'

import type { LogoutUserResponse } from '../../models/ts/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function logoutUser<TData = LogoutUserResponse>() {
  return client<TData>({
    method: 'get',
    url: `/user/logout`,
  })
}
