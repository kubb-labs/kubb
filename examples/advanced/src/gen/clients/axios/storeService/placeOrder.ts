import client from '../client'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../../models/ts/storeController/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function placeOrder<TData = PlaceOrderMutationResponse, TVariables = PlaceOrderMutationRequest>(data: TVariables) {
  return client<TData, TVariables>({
    method: 'post',
    url: `/store/order`,
    data,
  })
}
