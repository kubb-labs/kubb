import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '@kubb/swagger-client/client'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400 } from '../models/GetOrderById'

export function getOrderByIdQueryOptions<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(
  orderId: GetOrderByIdPathParams['orderId'],
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
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
export function useGetOrderById<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: { query?: SWRConfiguration<TData, TError> },
): SWRResponse<TData, TError> {
  const { query: queryOptions } = options ?? {}

  const query = useSWR<TData, TError, string>(`/store/order/${orderId}`, {
    ...getOrderByIdQueryOptions<TData, TError>(orderId),
    ...queryOptions,
  })

  return query
}
