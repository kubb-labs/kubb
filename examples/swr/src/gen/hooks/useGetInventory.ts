import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetInventoryQueryResponse } from '../models/GetInventory.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { Key, SWRConfiguration } from 'swr'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, Error, unknown>({
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
export function useGetInventory(
  options: {
    query?: SWRConfiguration<GetInventoryQueryResponse, unknown>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/store/inventory'] as const
  return useSWR<GetInventoryQueryResponse, unknown, Key>(shouldFetch ? swrKey : null, {
    ...getInventoryQueryOptions(config),
    ...queryOptions,
  })
}
