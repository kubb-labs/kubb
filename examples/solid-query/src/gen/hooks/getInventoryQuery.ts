import client from '@kubb/swagger-client/client'
import { createQuery } from '@tanstack/solid-query'
import type { KubbQueryFactory } from './types'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/solid-query'

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
export const getInventoryQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>
export function getInventoryQueryOptions<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
>(options: GetInventory['client']['paramaters'] = {}): CreateBaseQueryOptions<GetInventory['unionResponse'], TError, TData, TQueryData, GetInventoryQueryKey> {
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

export function getInventoryQuery<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryQueryKey,
>(
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetInventory['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...getInventoryQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
