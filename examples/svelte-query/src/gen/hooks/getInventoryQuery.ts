import client from '@kubb/plugin-client/client'
import { createQuery, queryOptions, createInfiniteQuery, infiniteQueryOptions } from '@tanstack/svelte-query'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  QueryKey,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/svelte-query'

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
        url: '/store/inventory',
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function getInventoryQuery<TData = GetInventory['response'], TQueryData = GetInventory['response'], TQueryKey extends QueryKey = GetInventoryQueryKey>(
  options: {
    query?: Partial<CreateBaseQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData, TQueryKey>>
    client?: GetInventory['client']['parameters']
  } = {},
): CreateQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = createQuery({
    ...(getInventoryQueryOptions(clientOptions) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, GetInventory['error']> & {
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
        url: '/store/inventory',
        ...options,
      })
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function getInventoryQueryInfinite<
  TData = InfiniteData<GetInventory['response']>,
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryInfiniteQueryKey,
>(
  options: {
    query?: Partial<CreateInfiniteQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData, TQueryKey>>
    client?: GetInventory['client']['parameters']
  } = {},
): CreateInfiniteQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryInfiniteQueryKey()
  const query = createInfiniteQuery({
    ...(getInventoryInfiniteQueryOptions(clientOptions) as unknown as CreateInfiniteQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateInfiniteQueryOptions, 'queryKey'>),
  }) as CreateInfiniteQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
