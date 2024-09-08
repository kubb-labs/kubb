import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import type { Key, SWRConfiguration } from 'swr'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, unknown, unknown>({
    method: 'get',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return logoutUserQueryResponseSchema.parse(res.data)
}

export function logoutUserQueryOptions(config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return logoutUser(config)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser(
  options: {
    query?: SWRConfiguration<LogoutUserQueryResponse, unknown>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/user/logout'] as const
  return useSWR<LogoutUserQueryResponse, unknown, Key>(shouldFetch ? swrKey : null, {
    ...logoutUserQueryOptions(config),
    ...queryOptions,
  })
}
