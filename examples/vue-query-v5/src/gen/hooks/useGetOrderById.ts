import { unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { MaybeRef } from 'vue'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from '../models/GetOrderById'

type GetOrderById = KubbQueryFactory<
  GetOrderByIdQueryResponse,
  GetOrderById400 | GetOrderById404,
  never,
  GetOrderByIdPathParams,
  never,
  GetOrderByIdQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getOrderByIdQueryKey = (orderId: MaybeRef<GetOrderByIdPathParams['orderId']>) =>
  [{ url: `/store/order/${unref(orderId)}`, params: { orderId: orderId } }] as const
export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>
export function getOrderByIdQueryOptions<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
>(
  refOrderId: MaybeRef<GetOrderByIdPathParams['orderId']>,
  options: GetOrderById['client']['paramaters'] = {},
): QueryObserverOptions<GetOrderById['unionResponse'], TError, TData, TQueryData, GetOrderByIdQueryKey> {
  const queryKey = getOrderByIdQueryKey(refOrderId)
  return {
    queryKey,
    queryFn: () => {
      const orderId = unref(refOrderId)
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function useGetOrderById<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
  TQueryKey extends QueryKey = GetOrderByIdQueryKey,
>(
  refOrderId: MaybeRef<GetOrderByIdPathParams['orderId']>,
  options: {
    query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetOrderById['client']['paramaters']
  } = {},
): UseQueryReturnType<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(refOrderId)
  const query = useQuery<any, TError, TData, any>({
    ...getOrderByIdQueryOptions<TQueryFnData, TError, TData, TQueryData>(refOrderId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
