import client from '@kubb/swagger-client/client'
import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
import type {
  CreateBaseQueryOptions,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  CreateQueryResult,
  InfiniteData,
  QueryKey,
  WithRequired,
} from '@tanstack/svelte-query'
import type { GetInventoryQueryResponse } from '../models/GetInventory'

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
export function getInventoryQueryOptions<TData = GetInventory['response'], TQueryData = GetInventory['response']>(
  options: GetInventory['client']['parameters'] = {},
): WithRequired<CreateBaseQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getInventoryQueryKey()
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<GetInventory['data'], GetInventory['error']>({
        method: 'get',
        url: '/store/inventory',
        ...options,
      })
      return res.data
    },
  }
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
  const query = createQuery<GetInventory['data'], GetInventory['error'], TData, any>({
    ...getInventoryQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getInventoryInfiniteQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryInfiniteQueryKey = ReturnType<typeof getInventoryInfiniteQueryKey>
export function getInventoryInfiniteQueryOptions<TData = GetInventory['response'], TQueryData = GetInventory['response']>(
  options: GetInventory['client']['parameters'] = {},
): WithRequired<CreateInfiniteQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getInventoryInfiniteQueryKey()
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetInventory['data'], GetInventory['error']>({
        method: 'get',
        url: '/store/inventory',
        ...options,
      })
      return res.data
    },
  }
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
  const query = createInfiniteQuery<GetInventory['data'], GetInventory['error'], TData, any>({
    ...getInventoryInfiniteQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
