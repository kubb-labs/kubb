import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions, useInfiniteQuery, infiniteQueryOptions, useSuspenseQuery } from '@tanstack/react-query'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'

type GetInventoryClient = typeof client<GetInventoryQueryResponse, never, never>
type GetInventory = {
  data: GetInventoryQueryResponse
  error: never
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: GetInventoryQueryResponse
  client: {
    parameters: Partial<Parameters<GetInventoryClient>[0]>
    return: Awaited<ReturnType<GetInventoryClient>>
  }
}
export const getInventoryQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>
export function getInventoryQueryOptions(options: GetInventory['client']['parameters'] = {}) {
  const queryKey = getInventoryQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetInventory['data'], GetInventory['error']>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory */
export function useGetInventoryHook<TData = GetInventory['response'], TQueryData = GetInventory['response'], TQueryKey extends QueryKey = GetInventoryQueryKey>(
  options: {
    query?: QueryObserverOptions<GetInventory['data'], GetInventory['error'], TData, TQueryData, TQueryKey>
    client?: GetInventory['client']['parameters']
  } = {},
): UseQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useQuery({
    ...getInventoryQueryOptions(clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getInventoryInfiniteQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryInfiniteQueryKey = ReturnType<typeof getInventoryInfiniteQueryKey>
export function getInventoryInfiniteQueryOptions(options: GetInventory['client']['parameters'] = {}) {
  const queryKey = getInventoryInfiniteQueryKey()
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetInventory['data'], GetInventory['error']>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      })
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory */
export function useGetInventoryHookInfinite<
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryInfiniteQueryKey,
>(options: {
  query?: InfiniteQueryObserverOptions<GetInventory['data'], GetInventory['error'], TData, TQueryData, TQueryKey>
  client?: GetInventory['client']['parameters']
} = {}): UseInfiniteQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryInfiniteQueryKey()
  const query = useInfiniteQuery({
    ...getInventoryInfiniteQueryOptions(clientOptions),
    queryKey,
    ...queryOptions as InfiniteQueryObserverOptions,
  }) as UseInfiniteQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getInventorySuspenseQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventorySuspenseQueryKey = ReturnType<typeof getInventorySuspenseQueryKey>
export function getInventorySuspenseQueryOptions(options: GetInventory['client']['parameters'] = {}) {
  const queryKey = getInventorySuspenseQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetInventory['data'], GetInventory['error']>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory */
export function useGetInventoryHookSuspense<TData = GetInventory['response'], TQueryKey extends QueryKey = GetInventorySuspenseQueryKey>(options: {
  query?: UseSuspenseQueryOptions<GetInventory['data'], GetInventory['error'], TData, TQueryKey>
  client?: GetInventory['client']['parameters']
} = {}): UseSuspenseQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventorySuspenseQueryKey()
  const query = useSuspenseQuery({
    ...getInventorySuspenseQueryOptions(clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseSuspenseQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
