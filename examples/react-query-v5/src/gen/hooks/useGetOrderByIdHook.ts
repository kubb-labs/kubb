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
import type { GetOrderById400, GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../models/GetOrderById'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: `/store/order/${orderId}`, params: { orderId: orderId } }] as const
export function getOrderByIdQueryOptions<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getOrderByIdQueryKey(orderId)

  return queryOptions<TData, TError>({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,

        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */

export function useGetOrderByIdHook<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(orderId: GetOrderByIdPathParams['orderId'], options: {
  query?: QueryObserverOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = useQuery<TData, TError>({
    ...getOrderByIdQueryOptions<TData, TError>(orderId, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

export function getOrderByIdQueryOptionsInfinite<
  TData = GetOrderByIdQueryResponse,
  TError = GetOrderById400,
  TInfiniteDate = InfiniteData<GetOrderByIdQueryResponse extends [] ? GetOrderByIdQueryResponse[number] : GetOrderByIdQueryResponse>,
>(orderId: GetOrderByIdPathParams['orderId'], options: Partial<Parameters<typeof client>[0]> = {}): UseInfiniteQueryOptions<TData, TError, TInfiniteDate> {
  const queryKey = getOrderByIdQueryKey(orderId)

  return infiniteQueryOptions<TData, TError, TInfiniteDate>({
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,

        ...options,
      }).then(res => res.data)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */

export function useGetOrderByIdHookInfinite<
  TData = GetOrderByIdQueryResponse,
  TError = GetOrderById400,
  TInfiniteDate = InfiniteData<GetOrderByIdQueryResponse extends [] ? GetOrderByIdQueryResponse[number] : GetOrderByIdQueryResponse>,
>(orderId: GetOrderByIdPathParams['orderId'], options: {
  query?: InfiniteQueryObserverOptions<TData, TError, TInfiniteDate>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = useInfiniteQuery<TData, TError, TInfiniteDate>({
    ...getOrderByIdQueryOptionsInfinite<TData, TError, TInfiniteDate>(orderId, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
