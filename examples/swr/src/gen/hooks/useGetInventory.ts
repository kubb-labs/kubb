import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetInventoryQueryResponse } from '../models/GetInventory.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration } from 'swr'

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

export function getInventoryQueryOptions(config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return getInventory(config)
    },
  }
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function useGetInventory<TData = GetInventoryQueryResponse>(
  options: {
    query?: SWRConfiguration<TData, unknown>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const url = '/store/inventory'
  return useSWR<TData, unknown, typeof url | null>(shouldFetch ? url : null, {
    ...getInventoryQueryOptions(config),
    ...queryOptions,
  })
}
