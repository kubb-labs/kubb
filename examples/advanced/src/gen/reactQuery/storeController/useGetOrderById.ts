import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetOrderByIdResponse, GetOrderByIdPathParams, GetOrderByIdQueryParams } from '../../models/ts/GetOrderById'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId'], params?: GetOrderByIdQueryParams) =>
  [`/store/order/${orderId}`, ...(params ? [params] : [])] as const

export const getOrderByIdQueryOptions = <TData = GetOrderByIdResponse>(
  orderId: GetOrderByIdPathParams['orderId'],
  params?: GetOrderByIdQueryParams
): QueryOptions<TData> => {
  const queryKey = getOrderByIdQueryKey(orderId, params)

  return {
    queryKey,
    queryFn: () => {
      return axios.get(`/store/order/${orderId}`).then((res) => res.data)
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/{orderId}
 */
export const useGetOrderById = <TData = GetOrderByIdResponse>(
  orderId: GetOrderByIdPathParams['orderId'],
  params?: GetOrderByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId, params)

  const query = useQuery<TData>({
    ...getOrderByIdQueryOptions<TData>(orderId, params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
