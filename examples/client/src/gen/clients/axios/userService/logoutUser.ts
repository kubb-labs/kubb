import type client from '@kubb/plugin-client/client'
import axios from 'axios'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import type { ResponseConfig } from '@kubb/plugin-client/client'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser(options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<LogoutUserQueryResponse>['data']> {
  return axios.get('/user/logout', options)
}
