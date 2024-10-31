import client from '@kubb/plugin-client/client'
import type { GetInventoryQueryResponse } from '../models/GetInventory.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/solid-query'
import { queryOptions, createQuery } from '@tanstack/solid-query'

export const getInventoryQueryKey = () => [{ url: '/store/inventory' }] as const

export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, Error, unknown>({ method: 'GET', url: '/store/inventory', ...config })
  return res.data
}

export function getInventoryQueryOptions(config: Partial<RequestConfig> = {}) {
  const queryKey = getInventoryQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getInventory(config)
    },
  })
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function createGetInventory<
  TData = GetInventoryQueryResponse,
  TQueryData = GetInventoryQueryResponse,
  TQueryKey extends QueryKey = GetInventoryQueryKey,
>(
  options: {
    query?: Partial<CreateBaseQueryOptions<GetInventoryQueryResponse, Error, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = createQuery(() => ({
    ...(getInventoryQueryOptions(config) as unknown as CreateBaseQueryOptions),
    queryKey,
    initialData: null,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  })) as CreateQueryResult<TData, Error> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
