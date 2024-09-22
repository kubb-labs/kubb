/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/client'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({
    method: 'get',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}
