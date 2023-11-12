import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'

type GetInventory = KubbQueryFactory<GetInventoryQueryResponse, never, never, never, never, never, GetInventoryQueryResponse, {
  dataReturnType: 'data'
  type: 'query'
}>
export const getInventoryQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>
export function getInventoryQueryOptions<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
>(options: GetInventory['client']['paramaters'] = {}): UseBaseQueryOptions<GetInventory['unionResponse'], TError, TData, TQueryData, GetInventoryQueryKey> {
  const queryKey = getInventoryQueryKey()
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
} /**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */

export function useGetInventoryHook<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryQueryKey,
>(options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetInventory['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...getInventoryQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type GetInventoryInfinite = KubbQueryFactory<GetInventoryQueryResponse, never, never, never, never, never, GetInventoryQueryResponse, {
  dataReturnType: 'data'
  type: 'query'
}>
export const getInventoryInfiniteQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryInfiniteQueryKey = ReturnType<typeof getInventoryInfiniteQueryKey>
export function getInventoryInfiniteQueryOptions<
  TQueryFnData extends GetInventoryInfinite['data'] = GetInventoryInfinite['data'],
  TError = GetInventoryInfinite['error'],
  TData = GetInventoryInfinite['response'],
  TQueryData = GetInventoryInfinite['response'],
>(
  options: GetInventoryInfinite['client']['paramaters'] = {},
): UseInfiniteQueryOptions<GetInventoryInfinite['unionResponse'], TError, TData, TQueryData, GetInventoryInfiniteQueryKey> {
  const queryKey = getInventoryInfiniteQueryKey()
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
} /**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */

export function useGetInventoryHookInfinite<
  TQueryFnData extends GetInventoryInfinite['data'] = GetInventoryInfinite['data'],
  TError = GetInventoryInfinite['error'],
  TData = GetInventoryInfinite['response'],
  TQueryData = GetInventoryInfinite['response'],
  TQueryKey extends QueryKey = GetInventoryInfiniteQueryKey,
>(options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetInventoryInfinite['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryInfiniteQueryKey()
  const query = useInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...getInventoryInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
