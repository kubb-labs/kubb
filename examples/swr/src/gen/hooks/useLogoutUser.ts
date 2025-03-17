import client from '@kubb/plugin-client/clients/axios'
import useSWR from 'swr'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: '/user/logout', ...requestConfig })
  return res.data
}

export function logoutUserQueryOptions(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  return {
    fetcher: async () => {
      return logoutUser(config)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function useLogoutUser(
  options: {
    query?: Parameters<typeof useSWR<LogoutUserQueryResponse, ResponseErrorConfig<Error>, LogoutUserQueryKey | null, any>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = logoutUserQueryKey()

  return useSWR<LogoutUserQueryResponse, ResponseErrorConfig<Error>, LogoutUserQueryKey | null>(shouldFetch ? queryKey : null, {
    ...logoutUserQueryOptions(config),
    ...queryOptions,
  })
}
