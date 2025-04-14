import client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/ts/PlaceOrderPatch.js'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchHandler({ data }: { data?: PlaceOrderPatchMutationRequest }): Promise<Promise<CallToolResult>> {
  const res = await client<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, PlaceOrderPatchMutationRequest>({
    method: 'PATCH',
    url: '/store/order',
    baseURL: 'https://petstore.swagger.io/v2',
    data,
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
