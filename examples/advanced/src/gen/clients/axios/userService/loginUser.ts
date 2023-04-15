import client from '../../../../client'

import type { LoginUserResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function loginUser<TData = LoginUserResponse>(params?: LoginUserQueryParams) {
  return client<TData>({
    method: 'get',
    url: `/user/login`,
    params,
  })
}
