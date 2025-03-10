import client from '@kubb/plugin-client/clients/axios'
import type { GetInventoryQueryResponse } from '../../models/GetInventory.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const getInventorySuspenseQueryKey = () => ['v5', { url: '/store/inventory' }] as const

export type GetInventorySuspenseQueryKey = ReturnType<typeof getInventorySuspenseQueryKey>

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventorySuspenseHook(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/store/inventory`, ...requestConfig })
  return res.data
}

export function getInventorySuspenseQueryOptionsHook(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = getInventorySuspenseQueryKey()
  return queryOptions<GetInventoryQueryResponse, ResponseErrorConfig<Error>, GetInventoryQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getInventorySuspenseHook(config)
    },
  })
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export function useGetInventorySuspenseHook<
  TData = GetInventoryQueryResponse,
  TQueryData = GetInventoryQueryResponse,
  TQueryKey extends QueryKey = GetInventorySuspenseQueryKey,
>(
  options: {
    query?: Partial<UseSuspenseQueryOptions<GetInventoryQueryResponse, ResponseErrorConfig<Error>, TData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventorySuspenseQueryKey()

  const query = useSuspenseQuery({
    ...(getInventorySuspenseQueryOptionsHook(config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}