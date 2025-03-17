import client from '@kubb/plugin-client/clients/axios'
import useSWR from 'swr'
import type { GetInventoryQueryResponse } from '../models/GetInventory.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const getInventoryQueryKey = () => [{ url: '/store/inventory' }] as const

export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventory(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: '/store/inventory', ...requestConfig })
  return res.data
}

export function getInventoryQueryOptions(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  return {
    fetcher: async () => {
      return getInventory(config)
    },
  }
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export function useGetInventory(
  options: {
    query?: Parameters<typeof useSWR<GetInventoryQueryResponse, ResponseErrorConfig<Error>, GetInventoryQueryKey | null, any>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = getInventoryQueryKey()

  return useSWR<GetInventoryQueryResponse, ResponseErrorConfig<Error>, GetInventoryQueryKey | null>(shouldFetch ? queryKey : null, {
    ...getInventoryQueryOptions(config),
    ...queryOptions,
  })
}
