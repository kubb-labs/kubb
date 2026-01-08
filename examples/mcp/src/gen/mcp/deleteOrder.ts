import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { DeleteOrderPathParams, DeleteOrderResponseData, DeleteOrderStatus400, DeleteOrderStatus404 } from '../models/ts/DeleteOrder.js'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrderHandler({ orderId }: { orderId: DeleteOrderPathParams['orderId'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeleteOrderResponseData, ResponseErrorConfig<DeleteOrderStatus400 | DeleteOrderStatus404>, unknown>({
    method: 'DELETE',
    url: `/store/order/${orderId}`,
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
