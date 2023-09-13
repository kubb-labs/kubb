import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/svelte-query'
import { createQuery } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400 } from '../models/GetOrderById'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [`/store/order/${orderId}`] as const

export function getOrderByIdQueryOptions<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): CreateQueryOptions<TData, TError> {
  const queryKey = getOrderByIdQueryKey(orderId)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,

        ...options,
      })
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function getOrderByIdQuery<TData = GetOrderByIdQueryResponse, TError = GetOrderById400>(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: { query?: CreateQueryOptions<TData, TError> },
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = createQuery<TData, TError>({
    ...getOrderByIdQueryOptions<TData, TError>(orderId),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
