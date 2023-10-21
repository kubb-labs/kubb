import client from '@kubb/swagger-client/client'

import { createQuery } from '@tanstack/svelte-query'

import type { CreateQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/svelte-query'
import type { GetOrderById400, GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../models/GetOrderById'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: `/store/order/${orderId}`, params: { orderId: orderId } }] as const
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
      }).then((res) => res.data)
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
  options: {
    query?: CreateQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = createQuery<TData, TError>({
    ...getOrderByIdQueryOptions<TData, TError>(orderId, clientOptions),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
