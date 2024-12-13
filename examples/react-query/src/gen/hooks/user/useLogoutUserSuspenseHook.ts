import client from '@kubb/plugin-client/clients/axios'
import type { LogoutUserQueryResponse } from '../../models/LogoutUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const logoutUserSuspenseQueryKey = () => ['v5', { url: '/user/logout' }] as const

export type LogoutUserSuspenseQueryKey = ReturnType<typeof logoutUserSuspenseQueryKey>

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
async function logoutUserHook(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({ method: 'GET', url: '/user/logout', ...config })
  return res.data
}

export function logoutUserSuspenseQueryOptionsHook(config: Partial<RequestConfig> = {}) {
  const queryKey = logoutUserSuspenseQueryKey()
  return queryOptions({
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
export function useLogoutUserSuspenseHook<
  TData = LogoutUserQueryResponse,
  TQueryData = LogoutUserQueryResponse,
  TQueryKey extends QueryKey = LogoutUserSuspenseQueryKey,
>(
  options: {
    query?: Partial<UseSuspenseQueryOptions<LogoutUserQueryResponse, Error, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserSuspenseQueryKey()

  const query = useSuspenseQuery({
    ...(logoutUserSuspenseQueryOptionsHook(config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, Error> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
