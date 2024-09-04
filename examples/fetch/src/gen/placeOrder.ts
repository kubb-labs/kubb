import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse } from './models.ts'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export async function placeOrder(
  data?: PlaceOrderMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<PlaceOrderMutationResponse>['data']> {
  const res = await client<PlaceOrderMutationResponse, PlaceOrderMutationRequest>({
    method: 'post',
    url: '/store/order',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...options,
  })
  return res.data
}
