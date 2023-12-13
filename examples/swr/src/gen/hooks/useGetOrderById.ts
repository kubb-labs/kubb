import useSWR from 'swr'
import client from '@kubb/swagger-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById'

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
    paramaters: Partial<Parameters<GetOrderByIdClient>[0]>
    return: Awaited<ReturnType<GetOrderByIdClient>>
  }
}
export function getOrderByIdQueryOptions<TData extends GetOrderById['response'] = GetOrderById['response'], TError = GetOrderById['error']>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: GetOrderById['client']['paramaters'] = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: async () => {
      const res = await client<TData, TError>({
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
 * @link /store/order/:orderId */
export function useGetOrderById<TData extends GetOrderById['response'] = GetOrderById['response'], TError = GetOrderById['error']>(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: GetOrderById['client']['paramaters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/store/order/${orderId}` as const
  const query = useSWR<TData, TError, typeof url | null>(shouldFetch ? url : null, {
    ...getOrderByIdQueryOptions<TData, TError>(orderId, clientOptions),
    ...queryOptions,
  })
  return query
}
