import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/ts/PlaceOrder.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrderHandler({ data }: { data?: PlaceOrderMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data
  const res = await fetch<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, PlaceOrderMutationRequest>({
    method: 'POST',
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
