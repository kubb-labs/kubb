import client from '@kubb/swagger-client/client'

import { queryOptions, useQuery } from '@tanstack/react-query'

import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import type { GetUserByName400, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../models/GetUserByName'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: `/user/${username}`, params: { username: username } }] as const
export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getUserByNameQueryKey(username)

  return queryOptions({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,

        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByNameHook<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(username: GetUserByNamePathParams['username'], options: {
  query?: UseQueryOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = useQuery<TData, TError>({
    ...getUserByNameQueryOptions<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
