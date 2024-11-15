import client from '@kubb/plugin-client/client'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const getOrderByIdSuspenseQueryKey = ({
  orderId,
}: {
  orderId: GetOrderByIdPathParams['orderId']
}) => ['v5', { url: '/store/order/:orderId', params: { orderId: orderId } }] as const

export type GetOrderByIdSuspenseQueryKey = ReturnType<typeof getOrderByIdSuspenseQueryKey>

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
async function getOrderByIdHook(
  {
    orderId,
  }: {
    orderId: GetOrderByIdPathParams['orderId']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, unknown>({ method: 'GET', url: `/store/order/${orderId}`, ...config })
  return res.data
}

export function getOrderByIdSuspenseQueryOptionsHook(
  {
    orderId,
  }: {
    orderId: GetOrderByIdPathParams['orderId']
  },
  config: Partial<RequestConfig> = {},
) {
  const queryKey = getOrderByIdSuspenseQueryKey({ orderId })
  return queryOptions({
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
 * @link /store/order/:orderId
 */
export function useGetOrderByIdSuspenseHook<
  TData = GetOrderByIdQueryResponse,
  TQueryData = GetOrderByIdQueryResponse,
  TQueryKey extends QueryKey = GetOrderByIdSuspenseQueryKey,
>(
  {
    orderId,
  }: {
    orderId: GetOrderByIdPathParams['orderId']
  },
  options: {
    query?: Partial<UseSuspenseQueryOptions<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdSuspenseQueryKey({ orderId })
  const query = useSuspenseQuery({
    ...(getOrderByIdSuspenseQueryOptionsHook({ orderId }, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, GetOrderById400 | GetOrderById404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
