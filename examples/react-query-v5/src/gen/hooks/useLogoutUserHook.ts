import client from '@kubb/swagger-client/client'

import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  QueryKey,
  QueryObserverOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import type { LogoutUserQueryResponse } from '../models/LogoutUser'

export const logoutUserQueryKey = () => [{ url: `/user/logout` }] as const
export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = logoutUserQueryKey()
  return queryOptions<TData, TError>({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUserHook<TData = LogoutUserQueryResponse, TError = unknown>(options: {
  query?: QueryObserverOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useQuery<TData, TError>({
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}

export function logoutUserQueryOptionsInfinite<
  TData = LogoutUserQueryResponse,
  TError = unknown,
  TInfiniteDate = InfiniteData<LogoutUserQueryResponse extends [] ? LogoutUserQueryResponse[number] : LogoutUserQueryResponse>,
>(options: Partial<Parameters<typeof client>[0]> = {}): UseInfiniteQueryOptions<TData, TError, TInfiniteDate> {
  const queryKey = logoutUserQueryKey()
  return infiniteQueryOptions<TData, TError, TInfiniteDate>({
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res.data)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUserHookInfinite<
  TData = LogoutUserQueryResponse,
  TError = unknown,
  TInfiniteDate = InfiniteData<LogoutUserQueryResponse extends [] ? LogoutUserQueryResponse[number] : LogoutUserQueryResponse>,
>(options: {
  query?: InfiniteQueryObserverOptions<TData, TError, TInfiniteDate>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useInfiniteQuery<TData, TError, TInfiniteDate>({
    ...logoutUserQueryOptionsInfinite<TData, TError, TInfiniteDate>(clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
