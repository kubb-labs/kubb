import client from '@kubb/plugin-client/client'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, CreateBaseQueryOptions } from '@tanstack/svelte-query'
import { createQuery, queryOptions } from '@tanstack/svelte-query'

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const

export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
async function getOrderById(orderId: GetOrderByIdPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, unknown>({
    method: 'GET',
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
      return getOrderById(orderId, config)
    },
  })
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function createGetOrderById<
  TData = GetOrderByIdQueryResponse,
  TQueryData = GetOrderByIdQueryResponse,
  TQueryKey extends QueryKey = GetOrderByIdQueryKey,
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: Partial<CreateBaseQueryOptions<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)
  const query = createQuery({
    ...(getOrderByIdQueryOptions(orderId, config) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as ReturnType<typeof query> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
