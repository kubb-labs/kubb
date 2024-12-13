import client from '@kubb/plugin-client/clients/fetch'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from './models.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/fetch'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrder(data?: PlaceOrderMutationRequest, config: Partial<RequestConfig<PlaceOrderMutationRequest>> = {}) {
  const res = await client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>({ method: 'POST', url: '/store/order', data, ...config })
  return res.data
}
