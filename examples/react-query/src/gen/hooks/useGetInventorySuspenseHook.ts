import client from '@kubb/plugin-client/client'
import type { GetInventoryQueryResponse } from '../models/GetInventory.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'

export const getInventorySuspenseQueryKey = () => ['v5', { url: '/store/inventory' }] as const

export type GetInventorySuspenseQueryKey = ReturnType<typeof getInventorySuspenseQueryKey>

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, unknown, unknown>({
    method: 'get',
    url: '/store/inventory',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

export function getInventorySuspenseQueryOptions(config: Partial<RequestConfig> = {}) {
  const queryKey = getInventorySuspenseQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return getInventory(config)
    },
  })
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function useGetInventorySuspenseHook<
  TData = GetInventoryQueryResponse,
  TQueryData = GetInventoryQueryResponse,
  TQueryKey extends QueryKey = GetInventorySuspenseQueryKey,
>(
  options: {
    query?: Partial<UseSuspenseQueryOptions<GetInventoryQueryResponse, unknown, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventorySuspenseQueryKey()
  const query = useSuspenseQuery({
    ...(getInventorySuspenseQueryOptions(config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, unknown> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
