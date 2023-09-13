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
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

export const logoutUserQueryKey = () => [`/user/logout`] as const
export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUserQueryResponse, TError = unknown>(options?: {
  query?: UseQueryOptions<TData, TError>
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useQuery<TData, TError>({
    ...logoutUserQueryOptions<TData, TError>(),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }
  query.queryKey = queryKey as QueryKey
  return query
}

export function logoutUserQueryOptionsInfinite<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUserInfinite<TData = LogoutUserQueryResponse, TError = unknown>(options?: {
  query?: UseInfiniteQueryOptions<TData, TError>
}): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useInfiniteQuery<TData, TError>({
    ...logoutUserQueryOptionsInfinite<TData, TError>(),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }
  query.queryKey = queryKey as QueryKey
  return query
}
