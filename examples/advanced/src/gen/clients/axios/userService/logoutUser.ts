import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LogoutUserResponseData } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUserResponseData2Schema } from '../../../zod/userController/logoutUserSchema.ts'

export function getLogoutUserUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/user/logout' as const }
  return res
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LogoutUserResponseData, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getLogoutUserUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: logoutUserResponseData2Schema.parse(res.data) }
}
