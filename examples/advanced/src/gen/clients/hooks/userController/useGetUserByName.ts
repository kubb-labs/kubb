import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import client from '../../../../tanstack-query-client.ts'

import type { QueryKey, UseBaseQueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { GetUserByName400, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../../models/ts/userController/GetUserByName'
import type { KubbQueryFactory } from './types'

type GetUserByName = KubbQueryFactory<
  GetUserByNameQueryResponse,
  GetUserByName400,
  never,
  GetUserByNamePathParams,
  never,
  GetUserByNameQueryResponse,
  {
    dataReturnType: 'full'
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
): UseBaseQueryOptions<GetUserByName['unionResponse'], TError, TData, TQueryData, GetUserByNameQueryKey> {
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
export function useGetUserByName<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...getUserByNameQueryOptions<TQueryFnData, TError, TData, TQueryData>(username, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export function getUserByNameQueryOptionsInfinite<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<ResponseConfig<TData>, TError> {
  const queryKey = getUserByNameQueryKey(username)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then(res => res)
    },
  }
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByNameInfinite<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: UseInfiniteQueryOptions<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseInfiniteQueryResult<ResponseConfig<TData>, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useInfiniteQuery<ResponseConfig<TData>, TError>({
    ...getUserByNameQueryOptionsInfinite<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<ResponseConfig<TData>, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
