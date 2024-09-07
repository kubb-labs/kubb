import client from '@kubb/plugin-client/client'
import type { GetInventoryQueryResponse } from '../models/GetInventory.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

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

export const getInventoryQueryKey = () => ['v5', { url: '/store/inventory' }] as const

export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>

export function getInventoryQueryOptions(options: Partial<Parameters<typeof client>[0]> = {}) {
  const queryKey = getInventoryQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetInventory['data'], GetInventory['error']>({ method: 'get', url: '/store/inventory', ...options })
      return res.data
    },
  })
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function useGetInventoryHook<
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryQueryKey,
>(options?: {
  query?: Partial<QueryObserverOptions<GetInventory['response'], GetInventory['error'], TData, TQueryData, TQueryKey>>
  client?: GetInventory['client']['parameters']
}): UseQueryResult<TData, GetInventory['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useQuery({
    ...(getInventoryQueryOptions(clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, GetInventory['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
