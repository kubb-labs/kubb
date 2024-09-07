import client from '@kubb/plugin-client/client'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, never, never>

type LogoutUser = {
  data: LogoutUserQueryResponse
  error: never
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: LogoutUserQueryResponse
  client: {
    parameters: Partial<Parameters<LogoutUserClient>[0]>
    return: Awaited<ReturnType<LogoutUserClient>>
  }
}

export const logoutUserQueryKey = () => ['v5', { url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

export function logoutUserQueryOptions(options: Partial<Parameters<typeof client>[0]> = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({ method: 'get', url: '/user/logout', ...options })
      return res.data
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUserHook<
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(options?: {
  query?: Partial<QueryObserverOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryData, TQueryKey>>
  client?: LogoutUser['client']['parameters']
}): UseQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useQuery({
    ...(logoutUserQueryOptions(clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
