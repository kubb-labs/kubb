import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { QueryKey, QueryObserverOptions, UseQueryResult, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName'

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
export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: `/user/${username}`, params: { username: username } }] as const
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
}
/**
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

export function getUserByNameQueryOptionsInfinite<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['paramaters'] = {},
): UseInfiniteQueryOptions<GetUserByName['unionResponse'], TError, TData, TQueryData, GetUserByNameQueryKey> {
  const queryKey = getUserByNameQueryKey(username)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then(res => res?.data || res)
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage['id'],
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByNameHookInfinite<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = useInfiniteQuery<any, TError, TData, any>({
    ...getUserByNameQueryOptionsInfinite<TQueryFnData, TError, TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }

  query.queryKey = queryKey as TQueryKey

  return query
}
