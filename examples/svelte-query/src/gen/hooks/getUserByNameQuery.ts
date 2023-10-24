import client from '@kubb/swagger-client/client'

import { createQuery } from '@tanstack/svelte-query'

import type { CreateQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/svelte-query'
import type { GetUserByName400, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../models/GetUserByName'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: `/user/${username}`, params: { username: username } }] as const
export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): CreateQueryOptions<TData, TError> {
  const queryKey = getUserByNameQueryKey(username)
  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then((res) => res.data)
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function getUserByNameQuery<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: CreateQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = createQuery<TData, TError>({
    ...getUserByNameQueryOptions<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
