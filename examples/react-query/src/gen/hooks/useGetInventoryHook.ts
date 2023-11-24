import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'

type GetInventoryClient = typeof client<GetInventoryQueryResponse, never, never>
type GetInventory = {
  data: GetInventoryQueryResponse
  error: never
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<GetInventoryClient>>['data']
  unionResponse: Awaited<ReturnType<GetInventoryClient>> | Awaited<ReturnType<GetInventoryClient>>['data']
  client: {
    paramaters: Partial<Parameters<GetInventoryClient>[0]>
    return: Awaited<ReturnType<GetInventoryClient>>
  }
}
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
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory */
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
export const getInventoryInfiniteQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryInfiniteQueryKey = ReturnType<typeof getInventoryInfiniteQueryKey>
export function getInventoryInfiniteQueryOptions<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
>(
  options: GetInventory['client']['paramaters'] = {},
): UseInfiniteQueryOptions<GetInventory['unionResponse'], TError, TData, TQueryData, GetInventoryInfiniteQueryKey> {
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
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory */
export function useGetInventoryHookInfinite<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryInfiniteQueryKey,
>(options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetInventory['client']['paramaters']
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
