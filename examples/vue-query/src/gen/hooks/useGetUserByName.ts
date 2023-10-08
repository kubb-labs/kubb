import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { QueryKey, UseQueryReturnType, UseQueryOptions } from '@tanstack/vue-query'
import { useQuery } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400 } from '../models/GetUserByName'

export const getUserByNameQueryKey = (refUsername: MaybeRef<GetUserByNamePathParams['username']>) => {
  const username = unref(refUsername)

  return [`/user/${username}`] as const
}

export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = GetUserByName400  >(
  refUsername: MaybeRef<GetUserByNamePathParams['username']>,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const username = unref(refUsername)
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

export function useGetUserByName<TData = GetUserByNameQueryResponse, TError = GetUserByName400  >(
  refUsername: MaybeRef<GetUserByNamePathParams['username']>,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(refUsername)

  const query = useQuery<TData, TError>({
    ...getUserByNameQueryOptions<TData, TError>(refUsername, clientOptions),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
