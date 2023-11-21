import type client from '@kubb/swagger-client/client'
import axios from 'axios'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export async function loginUser(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<LoginUserQueryResponse>['data']> {
  return axios.get(`/user/login`, options)
}
