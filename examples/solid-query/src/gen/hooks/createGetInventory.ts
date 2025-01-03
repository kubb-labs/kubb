import client from '@kubb/plugin-client/clients/axios'
import type { GetInventoryQueryResponse } from '../models/GetInventory.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import { queryOptions } from '@tanstack/solid-query'

export const getInventoryQueryKey = () => [{ url: '/store/inventory' }] as const

export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, Error, unknown>({ method: 'GET', url: '/store/inventory', ...config })
  return res.data
}

export function getInventoryQueryOptions(config: Partial<RequestConfig> = {}) {
  const queryKey = getInventoryQueryKey()
  return queryOptions<GetInventoryQueryResponse, Error, GetInventoryQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getInventory(config)
    },
  })
}
