import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import client from '../../../../tanstack-query-client.ts'

import type { QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

export const logoutUserQueryKey = () => [{ url: `/user/logout` }] as const
export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<ResponseConfig<TData>, TError> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUserQueryResponse, TError = unknown>(options: {
  query?: UseQueryOptions<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<ResponseConfig<TData>, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useQuery<ResponseConfig<TData>, TError>({
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as UseQueryResult<ResponseConfig<TData>, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}

export function logoutUserQueryOptionsInfinite<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<ResponseConfig<TData>, TError> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUserInfinite<TData = LogoutUserQueryResponse, TError = unknown>(options: {
  query?: UseInfiniteQueryOptions<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<ResponseConfig<TData>, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useInfiniteQuery<ResponseConfig<TData>, TError>({
    ...logoutUserQueryOptionsInfinite<TData, TError>(clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<ResponseConfig<TData>, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
