import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

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

  const res = await request<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getLogoutUserUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: logoutUserQueryResponseSchema.parse(res.data) }
}
