import client from '@kubb/plugin-client/clients/axios'
import useSWR from 'swr'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

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
  return {
    fetcher: async () => {
      return getOrderById(orderId, config)
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export function useGetOrderById(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: Parameters<typeof useSWR<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, GetOrderByIdQueryKey | null, any>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = getOrderByIdQueryKey(orderId)

  return useSWR<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, GetOrderByIdQueryKey | null>(shouldFetch ? queryKey : null, {
    ...getOrderByIdQueryOptions(orderId, config),
    ...queryOptions,
  })
}
