import client from '../../../client'

import type { LoginUserResponse, LoginUserQueryParams } from '../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function loginUser<TData = LoginUserResponse, TParams = LoginUserQueryParams>(params?: TParams) {
  return client<TData>({
    method: 'get',
    url: `/user/login`,
    params,
  })
}
