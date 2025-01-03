import client from '@kubb/plugin-client/clients/axios'
import type { LogoutUserQueryResponse } from '../../models/LogoutUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { queryOptions, useQuery } from '@tanstack/react-query'

export const logoutUserQueryKey = () => ['v5', { url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
async function logoutUserHook(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({ method: 'GET', url: '/user/logout', ...config })
  return res.data
}

export function logoutUserQueryOptionsHook(config: Partial<RequestConfig> = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions<LogoutUserQueryResponse, Error, LogoutUserQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return logoutUserHook(config)
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function useLogoutUserHook<TData = LogoutUserQueryResponse, TQueryData = LogoutUserQueryResponse, TQueryKey extends QueryKey = LogoutUserQueryKey>(
  options: {
    query?: Partial<QueryObserverOptions<LogoutUserQueryResponse, Error, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery({
    ...(logoutUserQueryOptionsHook(config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, Error> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
