import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import type { SWRConfiguration } from 'swr'
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
  return { ...res, data: logoutUserQueryResponseSchema.parse(res.data) }
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
export function useLogoutUser<TData = LogoutUserQueryResponse>(
  options: {
    query?: SWRConfiguration<TData, unknown>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const url = '/user/logout'
  return useSWR<TData, unknown, typeof url | null>(shouldFetch ? url : null, {
    ...logoutUserQueryOptions(config),
    ...queryOptions,
  })
}
