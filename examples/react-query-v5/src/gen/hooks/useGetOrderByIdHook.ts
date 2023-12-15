import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions, useInfiniteQuery, infiniteQueryOptions, useSuspenseQuery } from '@tanstack/react-query'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'

type GetOrderByIdClient = typeof client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, never>
type GetOrderById = {
  data: GetOrderByIdQueryResponse
  error: GetOrderById400 | GetOrderById404
  request: never
  pathParams: GetOrderByIdPathParams
  queryParams: never
  headerParams: never
  response: GetOrderByIdQueryResponse
  client: {
    parameters: Partial<Parameters<GetOrderByIdClient>[0]>
    return: Awaited<ReturnType<GetOrderByIdClient>>
  }
}
export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>
export function getOrderByIdQueryOptions(orderId: GetOrderByIdPathParams['orderId'], options: GetOrderById['client']['parameters'] = {}) {
  const queryKey = getOrderByIdQueryKey(orderId)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetOrderById['data'], GetOrderById['error']>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId */
export function useGetOrderByIdHook<TData = GetOrderById['response'], TQueryData = GetOrderById['response'], TQueryKey extends QueryKey = GetOrderByIdQueryKey>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: QueryObserverOptions<GetOrderById['data'], GetOrderById['error'], TData, TQueryData, TQueryKey>
    client?: GetOrderById['client']['parameters']
  } = {},
): UseQueryResult<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)
  const query = useQuery({
    ...getOrderByIdQueryOptions(orderId, clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseQueryResult<TData, GetOrderById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getOrderByIdInfiniteQueryKey = (orderId: GetOrderByIdPathParams['orderId']) =>
  [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdInfiniteQueryKey = ReturnType<typeof getOrderByIdInfiniteQueryKey>
export function getOrderByIdInfiniteQueryOptions(orderId: GetOrderByIdPathParams['orderId'], options: GetOrderById['client']['parameters'] = {}) {
  const queryKey = getOrderByIdInfiniteQueryKey(orderId)
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetOrderById['data'], GetOrderById['error']>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      })
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId */
export function useGetOrderByIdHookInfinite<
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
  TQueryKey extends QueryKey = GetOrderByIdInfiniteQueryKey,
>(orderId: GetOrderByIdPathParams['orderId'], options: {
  query?: InfiniteQueryObserverOptions<GetOrderById['data'], GetOrderById['error'], TData, TQueryData, TQueryKey>
  client?: GetOrderById['client']['parameters']
} = {}): UseInfiniteQueryResult<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdInfiniteQueryKey(orderId)
  const query = useInfiniteQuery({
    ...getOrderByIdInfiniteQueryOptions(orderId, clientOptions),
    queryKey,
    ...queryOptions as InfiniteQueryObserverOptions,
  }) as UseInfiniteQueryResult<TData, GetOrderById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getOrderByIdSuspenseQueryKey = (orderId: GetOrderByIdPathParams['orderId']) =>
  [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdSuspenseQueryKey = ReturnType<typeof getOrderByIdSuspenseQueryKey>
export function getOrderByIdSuspenseQueryOptions(orderId: GetOrderByIdPathParams['orderId'], options: GetOrderById['client']['parameters'] = {}) {
  const queryKey = getOrderByIdSuspenseQueryKey(orderId)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetOrderById['data'], GetOrderById['error']>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId */
export function useGetOrderByIdHookSuspense<TData = GetOrderById['response'], TQueryKey extends QueryKey = GetOrderByIdSuspenseQueryKey>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: UseSuspenseQueryOptions<GetOrderById['data'], GetOrderById['error'], TData, TQueryKey>
    client?: GetOrderById['client']['parameters']
  } = {},
): UseSuspenseQueryResult<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdSuspenseQueryKey(orderId)
  const query = useSuspenseQuery({
    ...getOrderByIdSuspenseQueryOptions(orderId, clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseSuspenseQueryResult<TData, GetOrderById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
