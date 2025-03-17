import client from '@kubb/plugin-client/clients/axios'
import type { LogoutUserQueryResponse } from '../../models/LogoutUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const logoutUserSuspenseQueryKey = () => ['v5', { url: '/user/logout' }] as const

export type LogoutUserSuspenseQueryKey = ReturnType<typeof logoutUserSuspenseQueryKey>

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUserSuspenseHook(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: '/user/logout', ...requestConfig })
  return res.data
}

export function logoutUserSuspenseQueryOptionsHook(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = logoutUserSuspenseQueryKey()
  return queryOptions<LogoutUserQueryResponse, ResponseErrorConfig<Error>, LogoutUserQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return logoutUserSuspenseHook(config)
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function useLogoutUserSuspenseHook<
  TData = LogoutUserQueryResponse,
  TQueryData = LogoutUserQueryResponse,
  TQueryKey extends QueryKey = LogoutUserSuspenseQueryKey,
>(
  options: {
    query?: Partial<UseSuspenseQueryOptions<LogoutUserQueryResponse, ResponseErrorConfig<Error>, TData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserSuspenseQueryKey()

  const query = useSuspenseQuery({
    ...(logoutUserSuspenseQueryOptionsHook(config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
