import type client from '@kubb/plugin-client/clients/axios'
import type { GetOrderByIdPathParams } from '../models/ts/GetOrderById.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { getOrderById } from '../clients/getOrderById.js'

export async function getOrderByIdHandler(
  orderId: GetOrderByIdPathParams['orderId'],
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await getOrderById(orderId, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
