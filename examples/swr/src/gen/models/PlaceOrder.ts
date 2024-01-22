import type { Order } from './Order'

/**
 * @description Invalid input
 */
export type PlaceOrder405 = any | null

export type PlaceOrderMutationRequest = Order

/**
 * @description successful operation
 */
export type PlaceOrderMutationResponse = Order
export type PlaceOrderMutation = {
  Response: PlaceOrderMutationResponse
  Request: PlaceOrderMutationRequest
  Errors: PlaceOrder405
}
