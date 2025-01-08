/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/clients/axios'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export function getLogoutUserUrl() {
  return '/user/logout'
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: getLogoutUserUrl().toString(), ...config })
  return res.data
}
