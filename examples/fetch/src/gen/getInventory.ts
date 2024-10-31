import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { GetInventoryQueryResponse } from './models.ts'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, Error, unknown>({ method: 'GET', url: '/store/inventory', ...config })
  return res.data
}
