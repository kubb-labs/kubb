/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/client'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.js'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({ method: 'GET', url: '/user/logout', ...config })
  return res.data
}
