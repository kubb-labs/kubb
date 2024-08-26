import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  QueryKey,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/svelte-query'
import client from '@kubb/plugin-client/client'
import { createQuery, queryOptions, createInfiniteQuery, infiniteQueryOptions } from '@tanstack/svelte-query'

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
 * @link /store/order/:orderId
 */
export function getOrderByIdQuery<TData = GetOrderById['response'], TQueryData = GetOrderById['response'], TQueryKey extends QueryKey = GetOrderByIdQueryKey>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: Partial<CreateBaseQueryOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryData, TQueryKey>>
    client?: GetOrderById['client']['parameters']
  } = {},
): CreateQueryResult<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)
  const query = createQuery({
    ...(getOrderByIdQueryOptions(orderId, clientOptions) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, GetOrderById['error']> & {
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
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function getOrderByIdQueryInfinite<
  TData = InfiniteData<GetOrderById['response']>,
  TQueryData = GetOrderById['response'],
  TQueryKey extends QueryKey = GetOrderByIdInfiniteQueryKey,
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: Partial<CreateInfiniteQueryOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryData, TQueryKey>>
    client?: GetOrderById['client']['parameters']
  } = {},
): CreateInfiniteQueryResult<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdInfiniteQueryKey(orderId)
  const query = createInfiniteQuery({
    ...(getOrderByIdInfiniteQueryOptions(orderId, clientOptions) as unknown as CreateInfiniteQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateInfiniteQueryOptions, 'queryKey'>),
  }) as CreateInfiniteQueryResult<TData, GetOrderById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
