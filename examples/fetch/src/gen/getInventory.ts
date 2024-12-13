import client from '@kubb/plugin-client/clients/fetch'
import type { GetInventoryQueryResponse } from './models.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/fetch'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, Error, unknown>({ method: 'GET', url: '/store/inventory', ...config })
  return res.data
}
