import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { PlaceOrderPatchRequestData, PlaceOrderPatchResponseData, PlaceOrderPatchStatus405 } from '../models/ts/PlaceOrderPatch.js'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchHandler({ data }: { data?: PlaceOrderPatchRequestData }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<PlaceOrderPatchResponseData, ResponseErrorConfig<PlaceOrderPatchStatus405>, PlaceOrderPatchRequestData>({
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
