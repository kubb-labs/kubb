import client from '@kubb/plugin-client/client'
import { useQuery, queryOptions } from '@tanstack/react-query'
import type { LogoutUserQueryResponse } from '../models/LogoutUser'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'

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
export function useLogoutUserQueryOptions(options: LogoutUser['client']['parameters'] = {}) {
  const queryKey = useLogoutUserQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({
        method: 'get',
        url: '/user/logout',
        ...options,
      })
      return res.data
    },
  })
}
export const useLogoutUserQueryKey = () => ['v5', { url: '/user/logout' }] as const
export type LogoutUserQueryKey = ReturnType<typeof useLogoutUserQueryKey>
/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUser['response'], TQueryData = LogoutUser['response'], TQueryKey extends QueryKey = LogoutUserQueryKey>(
  options: {
    query?: Partial<QueryObserverOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryData, TQueryKey>>
    client?: LogoutUser['client']['parameters']
  } = {},
): UseQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? useLogoutUserQueryKey()
  const query = useQuery({
    ...(useLogoutUserQueryOptions(clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
