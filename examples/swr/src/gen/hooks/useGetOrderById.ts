import client from '@kubb/swagger-client/client'
import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetOrderById400, GetOrderById404, GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../models/GetOrderById'

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
  options: GetOrderById['client']['parameters'] = {},
): SWRConfiguration<TData, GetOrderById['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, GetOrderById['error']>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
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
