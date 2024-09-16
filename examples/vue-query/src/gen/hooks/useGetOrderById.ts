import client from '@kubb/plugin-client/client'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useQuery, queryOptions } from '@tanstack/vue-query'
import { unref } from 'vue'

export const getOrderByIdQueryKey = (orderId: MaybeRef<GetOrderByIdPathParams['orderId']>) =>
  [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const

export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
async function getOrderById(orderId: GetOrderByIdPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, unknown>({
    method: 'get',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

export function getOrderByIdQueryOptions(orderId: GetOrderByIdPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const queryKey = getOrderByIdQueryKey(orderId)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return getOrderById(unref(orderId), unref(config))
    },
  })
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function useGetOrderById<TData = GetOrderByIdQueryResponse, TQueryData = GetOrderByIdQueryResponse, TQueryKey extends QueryKey = GetOrderByIdQueryKey>(
  orderId: MaybeRef<GetOrderByIdPathParams['orderId']>,
  options: {
    query?: Partial<QueryObserverOptions<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)
  const query = useQuery({
    ...(getOrderByIdQueryOptions(orderId, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, GetOrderById400 | GetOrderById404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
