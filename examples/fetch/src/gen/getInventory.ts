import client from '@kubb/plugin-client/clients/fetch'
import type { GetInventoryQueryResponse } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getGetInventoryUrl() {
  return new URL('/store/inventory')
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: getGetInventoryUrl().toString(), ...config })
  return res.data
}
