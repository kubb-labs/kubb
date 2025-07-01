import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

export function getLogoutUserUrl() {
  return 'https://petstore3.swagger.io/api/v3/user/logout' as const
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getLogoutUserUrl().toString(),
    ...requestConfig,
  })
  return { ...res, data: logoutUserQueryResponseSchema.parse(res.data) }
}
