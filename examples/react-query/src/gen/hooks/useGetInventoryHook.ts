import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { GetInventoryQueryResponse } from '../models/GetInventory'
import type {
  UseBaseQueryOptions,
  UseQueryResult,
  QueryKey,
  WithRequired,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
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
export function getInventoryQueryOptions<TData = GetInventory['response'], TQueryData = GetInventory['response']>(
  options: GetInventory['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData>, 'queryKey'> {
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
export function useGetInventoryHook<TData = GetInventory['response'], TQueryData = GetInventory['response'], TQueryKey extends QueryKey = GetInventoryQueryKey>(
  options: {
    query?: Partial<UseBaseQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData, TQueryKey>>
    client?: GetInventory['client']['parameters']
  } = {},
): UseQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useQuery<GetInventory['data'], GetInventory['error'], TData, any>({
    ...getInventoryQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getInventoryInfiniteQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryInfiniteQueryKey = ReturnType<typeof getInventoryInfiniteQueryKey>
export function getInventoryInfiniteQueryOptions<TData = GetInventory['response'], TQueryData = GetInventory['response']>(
  options: GetInventory['client']['parameters'] = {},
): WithRequired<UseInfiniteQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData>, 'queryKey'> {
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
export function useGetInventoryHookInfinite<
  TData = InfiniteData<GetInventory['response']>,
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryInfiniteQueryKey,
>(
  options: {
    query?: Partial<UseInfiniteQueryOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData, TQueryKey>>
    client?: GetInventory['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryInfiniteQueryKey()
  const query = useInfiniteQuery<GetInventory['data'], GetInventory['error'], TData, any>({
    ...getInventoryInfiniteQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
