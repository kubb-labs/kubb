import type { ResponseConfig } from '@kubb/plugin-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser'
import type client from '@kubb/plugin-client/client'
import axios from 'axios'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<LoginUserQueryResponse>['data']> {
  return axios.get('/user/login', options)
}
