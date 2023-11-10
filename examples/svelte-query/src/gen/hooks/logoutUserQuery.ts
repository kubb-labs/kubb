import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { KubbQueryFactory } from './types'
import type { LogoutUserQueryResponse, LogoutUserError } from '../models/LogoutUser'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'

type LogoutUser = KubbQueryFactory<
  LogoutUserQueryResponse,
  LogoutUserError,
  never,
  never,
  never,
  never,
  LogoutUserQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const logoutUserQueryKey = () => [{ url: `/user/logout` }] as const
export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>
export function logoutUserQueryOptions<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
>(options: LogoutUser['client']['paramaters'] = {}): CreateBaseQueryOptions<LogoutUser['unionResponse'], TError, TData, TQueryData, LogoutUserQueryKey> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */

export function logoutUserQuery<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: LogoutUser['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...logoutUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
type LogoutUserInfinite = KubbQueryFactory<
  LogoutUserQueryResponse,
  LogoutUserError,
  never,
  never,
  never,
  never,
  LogoutUserQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const logoutUserInfiniteQueryKey = () => [{ url: `/user/logout` }] as const
export type LogoutUserInfiniteQueryKey = ReturnType<typeof logoutUserInfiniteQueryKey>
export function logoutUserInfiniteQueryOptions<
  TQueryFnData extends LogoutUserInfinite['data'] = LogoutUserInfinite['data'],
  TError = LogoutUserInfinite['error'],
  TData = LogoutUserInfinite['response'],
  TQueryData = LogoutUserInfinite['response'],
>(
  options: LogoutUserInfinite['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<LogoutUserInfinite['unionResponse'], TError, TData, TQueryData, LogoutUserInfiniteQueryKey> {
  const queryKey = logoutUserInfiniteQueryKey()
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */

export function logoutUserQueryInfinite<
  TQueryFnData extends LogoutUserInfinite['data'] = LogoutUserInfinite['data'],
  TError = LogoutUserInfinite['error'],
  TData = LogoutUserInfinite['response'],
  TQueryData = LogoutUserInfinite['response'],
  TQueryKey extends QueryKey = LogoutUserInfiniteQueryKey,
>(
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: LogoutUserInfinite['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserInfiniteQueryKey()
  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...logoutUserInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
