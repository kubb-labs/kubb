import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({ method: 'GET', url: '/user/logout', ...config })
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
    query?: Parameters<typeof useSWR<LogoutUserQueryResponse, Error, LogoutUserQueryKey | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const queryKey = logoutUserQueryKey()
  return useSWR<LogoutUserQueryResponse, Error, LogoutUserQueryKey | null>(shouldFetch ? queryKey : null, {
    ...logoutUserQueryOptions(config),
    ...queryOptions,
  })
}
