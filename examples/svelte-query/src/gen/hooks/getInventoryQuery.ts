import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { KubbQueryFactory } from './types'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'

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
type GetInventoryInfinite = KubbQueryFactory<
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
export const getInventoryInfiniteQueryKey = () => [{ url: `/store/inventory` }] as const
export type GetInventoryInfiniteQueryKey = ReturnType<typeof getInventoryInfiniteQueryKey>
export function getInventoryInfiniteQueryOptions<
  TQueryFnData extends GetInventoryInfinite['data'] = GetInventoryInfinite['data'],
  TError = GetInventoryInfinite['error'],
  TData = GetInventoryInfinite['response'],
  TQueryData = GetInventoryInfinite['response'],
>(
  options: GetInventoryInfinite['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<GetInventoryInfinite['unionResponse'], TError, TData, TQueryData, GetInventoryInfiniteQueryKey> {
  const queryKey = getInventoryInfiniteQueryKey()
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
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

export function getInventoryQueryInfinite<
  TQueryFnData extends GetInventoryInfinite['data'] = GetInventoryInfinite['data'],
  TError = GetInventoryInfinite['error'],
  TData = GetInventoryInfinite['response'],
  TQueryData = GetInventoryInfinite['response'],
  TQueryKey extends QueryKey = GetInventoryInfiniteQueryKey,
>(
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetInventoryInfinite['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryInfiniteQueryKey()
  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...getInventoryInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
