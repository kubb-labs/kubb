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
import type { GetInventoryQueryResponse } from '../models/GetInventory'

export const getInventoryQueryKey = () => [{ url: `/store/inventory` }] as const
export function getInventoryQueryOptions<TData = GetInventoryQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getInventoryQueryKey()
  return queryOptions<TData, TError>({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function useGetInventoryHook<TData = GetInventoryQueryResponse, TError = unknown>(options: {
  query?: QueryObserverOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useQuery<TData, TError>({
    ...getInventoryQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}

export function getInventoryQueryOptionsInfinite<
  TData = GetInventoryQueryResponse,
  TError = unknown,
  TInfiniteDate = InfiniteData<GetInventoryQueryResponse extends [] ? GetInventoryQueryResponse[number] : GetInventoryQueryResponse>,
>(options: Partial<Parameters<typeof client>[0]> = {}): UseInfiniteQueryOptions<TData, TError, TInfiniteDate> {
  const queryKey = getInventoryQueryKey()
  return infiniteQueryOptions<TData, TError, TInfiniteDate>({
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      }).then(res => res.data)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function useGetInventoryHookInfinite<
  TData = GetInventoryQueryResponse,
  TError = unknown,
  TInfiniteDate = InfiniteData<GetInventoryQueryResponse extends [] ? GetInventoryQueryResponse[number] : GetInventoryQueryResponse>,
>(options: {
  query?: InfiniteQueryObserverOptions<TData, TError, TInfiniteDate>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useInfiniteQuery<TData, TError, TInfiniteDate>({
    ...getInventoryQueryOptionsInfinite<TData, TError, TInfiniteDate>(clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
