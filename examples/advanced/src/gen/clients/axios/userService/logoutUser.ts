import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'

export function getLogoutUserUrl() {
  return 'https://petstore3.swagger.io/api/v3/user/logout' as const
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: getLogoutUserUrl().toString(), ...config })
  return res
}
