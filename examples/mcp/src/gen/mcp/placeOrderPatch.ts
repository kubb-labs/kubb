import type client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderPatchMutationRequest } from '../models/ts/PlaceOrderPatch.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { placeOrderPatch } from '../clients/placeOrderPatch.js'

export async function placeOrderPatchHandler(
  data?: PlaceOrderPatchMutationRequest,
  config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await placeOrderPatch(data, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
