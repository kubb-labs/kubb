import client from '@kubb/plugin-client/client'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'

export const logoutUserSuspenseQueryKey = () => ['v5', { url: '/user/logout' }] as const

export type LogoutUserSuspenseQueryKey = ReturnType<typeof logoutUserSuspenseQueryKey>

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, unknown, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

export function logoutUserSuspenseQueryOptions(config: Partial<RequestConfig> = {}) {
  const queryKey = logoutUserSuspenseQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return logoutUser(config)
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUserSuspenseHook<
  TData = LogoutUserQueryResponse,
  TQueryData = LogoutUserQueryResponse,
  TQueryKey extends QueryKey = LogoutUserSuspenseQueryKey,
>(
  options: {
    query?: Partial<UseSuspenseQueryOptions<LogoutUserQueryResponse, unknown, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserSuspenseQueryKey()
  const query = useSuspenseQuery({
    ...(logoutUserSuspenseQueryOptions(config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, unknown> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
