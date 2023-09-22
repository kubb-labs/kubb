import {
  useQuery,
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
  QueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query'
import client from '../../../../client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, Getuserbyname400, Getuserbyname404 } from '../../../models/ts/userController/GetUserByName'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [`/user/${username}`] as const

export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = Getuserbyname400 | Getuserbyname404>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getUserByNameQueryKey(username)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,

        ...options,
      })
    },
  }
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetuserbyname<TData = GetUserByNameQueryResponse, TError = Getuserbyname400 | Getuserbyname404>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = useQuery<TData, TError>({
    ...getUserByNameQueryOptions<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function getUserByNameQueryOptionsInfinite<TData = GetUserByNameQueryResponse, TError = Getuserbyname400 | Getuserbyname404>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = getUserByNameQueryKey(username)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,

        ...options,
      })
    },
  }
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetuserbynameInfinite<TData = GetUserByNameQueryResponse, TError = Getuserbyname400 | Getuserbyname404>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: UseInfiniteQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = useInfiniteQuery<TData, TError>({
    ...getUserByNameQueryOptionsInfinite<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
