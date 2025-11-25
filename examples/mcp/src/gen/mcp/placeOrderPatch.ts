import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { PlaceOrderPatch405, PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../models/ts/PlaceOrderPatch.js'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchHandler({ data }: { data?: PlaceOrderPatchMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, PlaceOrderPatchMutationRequest>({
    method: 'PATCH',
    url: '/store/order',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
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
