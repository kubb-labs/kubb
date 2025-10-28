import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { GetInventoryQueryResponse } from '../models/ts/GetInventory.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventoryHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/store/inventory',
    baseURL: 'https://petstore.swagger.io/v2',
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
