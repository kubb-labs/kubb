import { useQuery } from '@tanstack/react-query'

import client from '../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetOrderByIdResponse, GetOrderByIdPathParams } from '../../models/ts/GetOrderById'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [`/store/order/${orderId}`] as const

export function getOrderByIdQueryOptions<TData = GetOrderByIdResponse>(orderId: GetOrderByIdPathParams['orderId']): QueryOptions<TData> {
  const queryKey = getOrderByIdQueryKey(orderId)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/store/order/${orderId}`,
      })
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/{orderId}
 */
export function useGetOrderById<TData = GetOrderByIdResponse>(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData, unknown> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = useQuery<TData>({
    ...getOrderByIdQueryOptions<TData>(orderId),
    ...queryOptions,
  }) as UseQueryResult<TData, unknown> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
