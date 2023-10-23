import client from '@kubb/swagger-client/client'

import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'

import type { QueryKey, QueryObserverOptions, UseQueryOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { GetOrderById400, GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../models/GetOrderById'

export const getOrderByIdQueryKey = (orderId: MaybeRef<GetOrderByIdPathParams['orderId']>) =>
  [{ url: `/store/order/${unref(orderId)}`, params: { orderId: orderId } }] as const
export function getOrderByIdQueryOptions<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(
  refOrderId: MaybeRef<GetOrderByIdPathParams['orderId']>,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getOrderByIdQueryKey(refOrderId)

  return {
    queryKey,
    queryFn: () => {
      const orderId = unref(refOrderId)
      return client<TData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */

export function useGetOrderById<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(
  refOrderId: MaybeRef<GetOrderByIdPathParams['orderId']>,
  options: {
    query?: QueryObserverOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(refOrderId)

  const query = useQuery<TData, TError>({
    ...getOrderByIdQueryOptions<TData, TError>(refOrderId, clientOptions),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
