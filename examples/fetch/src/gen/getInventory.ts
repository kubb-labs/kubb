import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { GetInventoryQueryResponse } from './models.ts'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse>({ method: 'get', url: '/store/inventory', baseURL: 'https://petstore3.swagger.io/api/v3', ...config })
  return res.data
}
