import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById'
import type {
  UseBaseQueryOptions,
  UseQueryResult,
  QueryKey,
  WithRequired,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
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
export function getOrderByIdQueryOptions<TData = GetOrderById['response'], TQueryData = GetOrderById['response']>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: GetOrderById['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getOrderByIdQueryKey(orderId)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<GetOrderById['data'], GetOrderById['error']>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function useGetOrderByIdHook<TData = GetOrderById['response'], TQueryData = GetOrderById['response'], TQueryKey extends QueryKey = GetOrderByIdQueryKey>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: Partial<UseBaseQueryOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryData, TQueryKey>>
    client?: GetOrderById['client']['parameters']
  } = {},
): UseQueryResult<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)
  const query = useQuery<GetOrderById['data'], GetOrderById['error'], TData, any>({
    ...getOrderByIdQueryOptions<TData, TQueryData>(orderId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, GetOrderById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getOrderByIdInfiniteQueryKey = (orderId: GetOrderByIdPathParams['orderId']) =>
  [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdInfiniteQueryKey = ReturnType<typeof getOrderByIdInfiniteQueryKey>
export function getOrderByIdInfiniteQueryOptions<TData = GetOrderById['response'], TQueryData = GetOrderById['response']>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: GetOrderById['client']['parameters'] = {},
): WithRequired<UseInfiniteQueryOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getOrderByIdInfiniteQueryKey(orderId)
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetOrderById['data'], GetOrderById['error']>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function useGetOrderByIdHookInfinite<
  TData = InfiniteData<GetOrderById['response']>,
  TQueryData = GetOrderById['response'],
  TQueryKey extends QueryKey = GetOrderByIdInfiniteQueryKey,
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: Partial<UseInfiniteQueryOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryData, TQueryKey>>
    client?: GetOrderById['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdInfiniteQueryKey(orderId)
  const query = useInfiniteQuery<GetOrderById['data'], GetOrderById['error'], TData, any>({
    ...getOrderByIdInfiniteQueryOptions<TData, TQueryData>(orderId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, GetOrderById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
