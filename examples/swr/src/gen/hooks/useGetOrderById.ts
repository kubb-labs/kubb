import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration } from 'swr'

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
  return {
    fetcher: async () => {
      return getOrderById(orderId, config)
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function useGetOrderById<TData = GetOrderByIdQueryResponse>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: SWRConfiguration<TData, GetOrderById400 | GetOrderById404>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const url = `/store/order/${orderId}`
  return useSWR<TData, GetOrderById400 | GetOrderById404, typeof url | null>(shouldFetch ? url : null, {
    ...getOrderByIdQueryOptions(orderId, config),
    ...queryOptions,
  })
}
