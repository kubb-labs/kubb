import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'

type GetOrderByIdClient = typeof client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, never>
type GetOrderById = {
  data: GetOrderByIdQueryResponse
  error: GetOrderById400 | GetOrderById404
  request: never
  pathParams: GetOrderByIdPathParams
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<GetOrderByIdClient>>['data']
  unionResponse: Awaited<ReturnType<GetOrderByIdClient>> | Awaited<ReturnType<GetOrderByIdClient>>['data']
  client: {
    paramaters: Partial<Parameters<GetOrderByIdClient>[0]>
    return: Awaited<ReturnType<GetOrderByIdClient>>
  }
}
export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>
export function getOrderByIdQueryOptions<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: GetOrderById['client']['paramaters'] = {},
): CreateBaseQueryOptions<GetOrderById['unionResponse'], TError, TData, TQueryData, GetOrderByIdQueryKey> {
  const queryKey = getOrderByIdQueryKey(orderId)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */

export function getOrderByIdQuery<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
  TQueryKey extends QueryKey = GetOrderByIdQueryKey,
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetOrderById['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)
  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...getOrderByIdQueryOptions<TQueryFnData, TError, TData, TQueryData>(orderId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getOrderByIdInfiniteQueryKey = (orderId: GetOrderByIdPathParams['orderId']) =>
  [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdInfiniteQueryKey = ReturnType<typeof getOrderByIdInfiniteQueryKey>
export function getOrderByIdInfiniteQueryOptions<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: GetOrderById['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<GetOrderById['unionResponse'], TError, TData, TQueryData, GetOrderByIdInfiniteQueryKey> {
  const queryKey = getOrderByIdInfiniteQueryKey(orderId)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */

export function getOrderByIdQueryInfinite<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
  TQueryKey extends QueryKey = GetOrderByIdInfiniteQueryKey,
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetOrderById['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdInfiniteQueryKey(orderId)
  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...getOrderByIdInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(orderId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
