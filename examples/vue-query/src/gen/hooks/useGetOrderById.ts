import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import type { QueryKey, UseQueryReturnType, WithRequired } from '@tanstack/vue-query'
import type { VueQueryObserverOptions } from '@tanstack/vue-query/build/lib/types'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
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
export const getOrderByIdQueryKey = (orderId: MaybeRef<GetOrderByIdPathParams['orderId']>) =>
  [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>
export function getOrderByIdQueryOptions<TData = GetOrderById['response'], TQueryData = GetOrderById['response']>(
  refOrderId: MaybeRef<GetOrderByIdPathParams['orderId']>,
  options: GetOrderById['client']['parameters'] = {},
): WithRequired<VueQueryObserverOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getOrderByIdQueryKey(refOrderId)
  return {
    queryKey,
    queryFn: async () => {
      const orderId = unref(refOrderId)
      const res = await client<GetOrderById['data'], GetOrderById['error']>({
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
export function useGetOrderById<TData = GetOrderById['response'], TQueryData = GetOrderById['response'], TQueryKey extends QueryKey = GetOrderByIdQueryKey>(
  refOrderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: Partial<VueQueryObserverOptions<GetOrderById['response'], GetOrderById['error'], TData, TQueryKey>>
    client?: GetOrderById['client']['parameters']
  } = {},
): UseQueryReturnType<TData, GetOrderById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(refOrderId)
  const query = useQuery<GetOrderById['data'], GetOrderById['error'], TData, any>({
    ...getOrderByIdQueryOptions<TData, TQueryData>(refOrderId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, GetOrderById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
