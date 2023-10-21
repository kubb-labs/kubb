import type { QueryKey, QueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { GetUserByName400, GetUserByName404, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../../models/ts/userController/GetUserByName'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: `/user/${username}`, params: { username: username } }] as const
export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<ResponseConfig<TData>, TError> {
  const queryKey = getUserByNameQueryKey(username)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,

        ...options,
      }).then((res) => res)
    },
  }
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByName<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: UseQueryOptions<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = useQuery<ResponseConfig<TData>, TError>({
    ...getUserByNameQueryOptions<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function getUserByNameQueryOptionsInfinite<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
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
      }).then((res) => res)
    },
  }
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByNameInfinite<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: UseInfiniteQueryOptions<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseInfiniteQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = useInfiniteQuery<ResponseConfig<TData>, TError>({
    ...getUserByNameQueryOptionsInfinite<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
