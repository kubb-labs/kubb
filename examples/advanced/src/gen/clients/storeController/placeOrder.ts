import client from '../../../client'

import type { PlaceOrderRequest, PlaceOrderResponse } from '../../models/ts/storeController/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function placeOrder<TData = PlaceOrderResponse, TVariables = PlaceOrderRequest>(data: TVariables) {
  return client<TData, TVariables>({
    method: 'post',
    url: `/store/order`,
    data,
  })
}
