import { useQuery } from '@tanstack/react-query'

import client from '../../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetOrderByIdResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../../../models/ts/storeController/GetOrderById'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [`/store/order/${orderId}`] as const

export function getOrderByIdQueryOptions<TData = GetOrderByIdResponse, TError = GetOrderById400 | GetOrderById404>(
  orderId: GetOrderByIdPathParams['orderId']
): QueryOptions<TData, TError> {
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
 * @link /store/order/:orderId
 */
export function useGetOrderById<TData = GetOrderByIdResponse, TError = GetOrderById400 | GetOrderById404>(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: { query?: UseQueryOptions<TData, TError> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = useQuery<TData, TError>({
    ...getOrderByIdQueryOptions<TData, TError>(orderId),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
