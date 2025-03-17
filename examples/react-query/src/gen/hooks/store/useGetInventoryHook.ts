import client from '@kubb/plugin-client/clients/axios'
import type { GetInventoryQueryResponse } from '../../models/GetInventory.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import { queryOptions } from '@tanstack/react-query'

export const getInventoryQueryKey = () => ['v5', { url: '/store/inventory' }] as const

export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventoryHook(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: '/store/inventory', ...requestConfig })
  return res.data
}

export function getInventoryQueryOptionsHook(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = getInventoryQueryKey()
  return queryOptions<GetInventoryQueryResponse, ResponseErrorConfig<Error>, GetInventoryQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getInventoryHook(config)
    },
  })
}
