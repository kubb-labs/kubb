import type client from '@kubb/plugin-client/clients/axios'
import type { DeleteOrderPathParams } from '../models/ts/DeleteOrder.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { deleteOrder } from '../clients/deleteOrder.js'

export async function deleteOrderHandler(
  orderId: DeleteOrderPathParams['orderId'],
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await deleteOrder(orderId, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
