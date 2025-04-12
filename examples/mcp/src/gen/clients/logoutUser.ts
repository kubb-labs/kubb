import client from '@kubb/plugin-client/clients/axios'
import type { LogoutUserQueryResponse } from '../models/ts/LogoutUser.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

function getLogoutUserUrl() {
  return 'https://petstore.swagger.io/v2/user/logout' as const
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
  return res.data
}
