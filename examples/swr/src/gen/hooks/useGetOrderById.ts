import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'

type GetOrderByIdClient = typeof client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, never>

type GetOrderById = {
  data: GetOrderByIdQueryResponse
  error: GetOrderById400 | GetOrderById404
  request: never
  pathParams: GetOrderByIdPathParams
  queryParams: never
  headerParams: never
  response: GetOrderByIdQueryResponse
  client: {
    parameters: Partial<Parameters<GetOrderByIdClient>[0]>
    return: Awaited<ReturnType<GetOrderByIdClient>>
  }
}

export function getOrderByIdQueryOptions<TData = GetOrderById['response']>(
  orderId: GetOrderByIdPathParams['orderId'],
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, GetOrderById['error']> {
  return {
    fetcher: async () => {
      const res = await client<GetOrderByIdQueryResponse>({
        method: 'get',
        url: `/store/order/${orderId}`,
        baseURL: 'https://petstore3.swagger.io/api/v3',
        ...config,
      })
      return res.data
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function useGetOrderById<TData = GetOrderById['response']>(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: {
    query?: SWRConfiguration<TData, GetOrderById['error']>
    client?: GetOrderById['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, GetOrderById['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/store/order/${orderId}`
  const query = useSWR<TData, GetOrderById['error'], typeof url | null>(shouldFetch ? url : null, {
    ...getOrderByIdQueryOptions<TData>(orderId, clientOptions),
    ...queryOptions,
  })
  return query
}
