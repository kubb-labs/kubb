import { createOrder } from './createOrder'

import type { PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/PlaceOrder'

/**
 * @description Invalid input
 */

export function createPlaceOrder405(): PlaceOrder405 {
  return undefined
}

export function createPlaceOrderMutationRequest(): PlaceOrderMutationRequest {
  return createOrder()
}

/**
 * @description successful operation
 */

export function createPlaceOrderMutationResponse(): PlaceOrderMutationResponse {
  return createOrder()
}
