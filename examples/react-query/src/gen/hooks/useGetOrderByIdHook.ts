import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: `/store/order/${orderId}`, params: { orderId: orderId } }] as const
export function getOrderByIdQueryOptions<TData = GetOrderByIdQueryResponse, TError = GetOrderById400 | GetOrderById404>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getOrderByIdQueryKey(orderId)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,

        ...options,
      }).then(res => res.data)
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */

export function useGetOrderByIdHook<TData = GetOrderByIdQueryResponse, TError = GetOrderById400 | GetOrderById404>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = useQuery<TData, TError>({
    ...getOrderByIdQueryOptions<TData, TError>(orderId, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
