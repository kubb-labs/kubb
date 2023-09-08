import client from '../../../client'
import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function loginUser<TData = LoginUserQueryResponse>(params?: LoginUserQueryParams, options: Partial<Parameters<typeof client>[0]> = {}): Promise<TData> {
  return client<TData>({
    method: 'get',
    url: `/user/login`,
    params,

    ...options,
  })
}
