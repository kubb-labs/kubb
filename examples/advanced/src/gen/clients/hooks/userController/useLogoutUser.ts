import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { KubbQueryFactory } from './types'
import type { QueryKey, UseBaseQueryOptions, UseQueryResult, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

type LogoutUser = KubbQueryFactory<LogoutUserQueryResponse, never, never, never, never, never, LogoutUserQueryResponse, {
  dataReturnType: 'full'
  type: 'query'
}>
export const logoutUserQueryKey = () => [{ url: `/user/logout` }] as const
export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>
export function logoutUserQueryOptions<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
>(options: LogoutUser['client']['paramaters'] = {}): UseBaseQueryOptions<LogoutUser['unionResponse'], TError, TData, TQueryData, LogoutUserQueryKey> {
  const queryKey = logoutUserQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LogoutUser['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...logoutUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }

  query.queryKey = queryKey as TQueryKey

  return query
}

export function logoutUserQueryOptionsInfinite<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
>(options: LogoutUser['client']['paramaters'] = {}): UseInfiniteQueryOptions<LogoutUser['unionResponse'], TError, TData, TQueryData, LogoutUserQueryKey> {
  const queryKey = logoutUserQueryKey()

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUserInfinite<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LogoutUser['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...logoutUserQueryOptionsInfinite<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }

  query.queryKey = queryKey as TQueryKey

  return query
}
