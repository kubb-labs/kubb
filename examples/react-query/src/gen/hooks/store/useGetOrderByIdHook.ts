import client from '@kubb/plugin-client/clients/axios'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../../models/GetOrderById.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { queryOptions, useQuery } from '@tanstack/react-query'

export const getOrderByIdQueryKey = ({ orderId }: { orderId: GetOrderByIdPathParams['orderId'] }) =>
  ['v5', { url: '/store/order/:orderId', params: { orderId: orderId } }] as const

export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderByIdHook(
  { orderId }: { orderId: GetOrderByIdPathParams['orderId'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, unknown>({
    method: 'GET',
    url: `/store/order/${orderId}`,
    ...requestConfig,
  })
  return res.data
}

export function getOrderByIdQueryOptionsHook(
  { orderId }: { orderId: GetOrderByIdPathParams['orderId'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const queryKey = getOrderByIdQueryKey({ orderId })
  return queryOptions<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, GetOrderByIdQueryResponse, typeof queryKey>({
    enabled: !!orderId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getOrderByIdHook({ orderId }, config)
    },
  })
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export function useGetOrderByIdHook<
  TData = GetOrderByIdQueryResponse,
  TQueryData = GetOrderByIdQueryResponse,
  TQueryKey extends QueryKey = GetOrderByIdQueryKey,
>(
  { orderId }: { orderId: GetOrderByIdPathParams['orderId'] },
  options: {
    query?: Partial<QueryObserverOptions<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey({ orderId })

  const query = useQuery({
    ...(getOrderByIdQueryOptionsHook({ orderId }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, ResponseErrorConfig<GetOrderById400 | GetOrderById404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
