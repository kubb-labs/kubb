import client from '@kubb/plugin-client/clients/axios'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import { queryOptions } from '@tanstack/solid-query'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const

export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderById(orderId: GetOrderByIdPathParams['orderId'], config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, unknown>({
    method: 'GET',
    url: `/store/order/${orderId}`,
    ...requestConfig,
  })
  return res.data
}

export function getOrderByIdQueryOptions(orderId: GetOrderByIdPathParams['orderId'], config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = getOrderByIdQueryKey(orderId)
  return queryOptions<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, GetOrderByIdQueryResponse, typeof queryKey>({
    enabled: !!orderId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getOrderById(orderId, config)
    },
  })
}
