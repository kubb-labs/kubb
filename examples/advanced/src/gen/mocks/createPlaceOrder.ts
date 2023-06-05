import { createOrder } from './createOrder'

/**
 * @description Invalid input
 */

export function createPlaceOrder405() {
  return undefined
}

export function createPlaceOrderMutationRequest() {
  return createOrder()
}

/**
 * @description successful operation
 */

export function createPlaceOrderMutationResponse() {
  return createOrder()
}
