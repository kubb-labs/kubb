import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName'
import type { QueryObserverOptions, UseQueryResult, QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'

type GetUserByName = KubbQueryFactory<
  GetUserByNameQueryResponse,
  GetUserByName400 | GetUserByName404,
  never,
  GetUserByNamePathParams,
  never,
  never,
  GetUserByNameQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>
export function getUserByNameQueryOptions<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['paramaters'] = {},
): QueryObserverOptions<GetUserByName['unionResponse'], TError, TData, TQueryData, GetUserByNameQueryKey> {
  const queryKey = getUserByNameQueryKey(username)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
} /**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByNameHook<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery<any, TError, TData, any>({
    ...getUserByNameQueryOptions<TQueryFnData, TError, TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type GetUserByNameInfinite = KubbQueryFactory<
  GetUserByNameQueryResponse,
  GetUserByName400 | GetUserByName404,
  never,
  GetUserByNamePathParams,
  never,
  never,
  GetUserByNameQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getUserByNameInfiniteQueryKey = (username: GetUserByNamePathParams['username']) =>
  [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameInfiniteQueryKey = ReturnType<typeof getUserByNameInfiniteQueryKey>
export function getUserByNameInfiniteQueryOptions<
  TQueryFnData extends GetUserByNameInfinite['data'] = GetUserByNameInfinite['data'],
  TError = GetUserByNameInfinite['error'],
  TData = GetUserByNameInfinite['response'],
  TQueryData = GetUserByNameInfinite['response'],
>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByNameInfinite['client']['paramaters'] = {},
): UseInfiniteQueryOptions<GetUserByNameInfinite['unionResponse'], TError, TData, TQueryData, GetUserByNameInfiniteQueryKey> {
  const queryKey = getUserByNameInfiniteQueryKey(username)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then(res => res?.data || res)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  }
} /**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByNameHookInfinite<
  TQueryFnData extends GetUserByNameInfinite['data'] = GetUserByNameInfinite['data'],
  TError = GetUserByNameInfinite['error'],
  TData = GetUserByNameInfinite['response'],
  TQueryData = GetUserByNameInfinite['response'],
  TQueryKey extends QueryKey = GetUserByNameInfiniteQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetUserByNameInfinite['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameInfiniteQueryKey(username)
  const query = useInfiniteQuery<any, TError, TData, any>({
    ...getUserByNameInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
