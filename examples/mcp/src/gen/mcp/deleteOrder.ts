import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/ts/DeleteOrder.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrderHandler({ orderId }: { orderId: DeleteOrderPathParams['orderId'] }): Promise<Promise<CallToolResult>> {
  const res = await client<DeleteOrderMutationResponse, ResponseErrorConfig<DeleteOrder400 | DeleteOrder404>, unknown>({
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
