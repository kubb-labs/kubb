import type client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderMutationRequest } from '../models/ts/PlaceOrder.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { placeOrder } from '../clients/placeOrder.js'

export async function placeOrderHandler(
  data?: PlaceOrderMutationRequest,
  config: Partial<RequestConfig<PlaceOrderMutationRequest>> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await placeOrder(data, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
