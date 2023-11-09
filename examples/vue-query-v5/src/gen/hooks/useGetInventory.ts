import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import type { KubbQueryFactory } from './types'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type { UseQueryReturnType, QueryObserverOptions, QueryKey } from '@tanstack/vue-query'

type GetInventory = KubbQueryFactory<
  GetInventoryQueryResponse,
  never,
  never,
  never,
  never,
  never,
  GetInventoryQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getInventoryQueryKey = () => [{ url: `/store/inventory` }] as const
export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>
export function getInventoryQueryOptions<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
>(options: GetInventory['client']['paramaters'] = {}): QueryObserverOptions<GetInventory['unionResponse'], TError, TData, TQueryData, GetInventoryQueryKey> {
  const queryKey = getInventoryQueryKey()
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */

export function useGetInventory<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryQueryKey,
>(
  options: {
    query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetInventory['client']['paramaters']
  } = {},
): UseQueryReturnType<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useQuery<any, TError, TData, any>({
    ...getInventoryQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
