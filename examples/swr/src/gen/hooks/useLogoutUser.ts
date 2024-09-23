import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { Key, SWRConfiguration } from 'swr'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
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
    query?: SWRConfiguration<LogoutUserQueryResponse, Error>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/user/logout'] as const
  return useSWR<LogoutUserQueryResponse, Error, Key>(shouldFetch ? swrKey : null, {
    ...logoutUserQueryOptions(config),
    ...queryOptions,
  })
}
