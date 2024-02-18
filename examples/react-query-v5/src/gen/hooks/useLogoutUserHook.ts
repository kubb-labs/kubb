import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import type { LogoutUserQueryResponse, LogoutUserError } from '../models/LogoutUser'
import type { QueryObserverOptions, UseQueryResult, QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, LogoutUserError, never>
type LogoutUser = {
  data: LogoutUserQueryResponse
  error: LogoutUserError
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
export function logoutUserQueryOptions(options: LogoutUser['client']['parameters'] = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function useLogoutUserHook<TData = LogoutUser['response'], TQueryData = LogoutUser['response'], TQueryKey extends QueryKey = LogoutUserQueryKey>(
  options: {
    query?: Partial<QueryObserverOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryData, TQueryKey>>
    client?: LogoutUser['client']['parameters']
  } = {},
): UseQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useQuery({
    ...logoutUserQueryOptions(clientOptions) as QueryObserverOptions,
    queryKey,
    ...queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>,
  }) as UseQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const logoutUserSuspenseQueryKey = () => ['v5', { url: '/user/logout' }] as const
export type LogoutUserSuspenseQueryKey = ReturnType<typeof logoutUserSuspenseQueryKey>
export function logoutUserSuspenseQueryOptions(options: LogoutUser['client']['parameters'] = {}) {
  const queryKey = logoutUserSuspenseQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function useLogoutUserHookSuspense<TData = LogoutUser['response'], TQueryKey extends QueryKey = LogoutUserSuspenseQueryKey>(options: {
  query?: Partial<UseSuspenseQueryOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryKey>>
  client?: LogoutUser['client']['parameters']
} = {}): UseSuspenseQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserSuspenseQueryKey()
  const query = useSuspenseQuery({
    ...logoutUserSuspenseQueryOptions(clientOptions) as QueryObserverOptions,
    queryKey,
    ...queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>,
  }) as UseSuspenseQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
