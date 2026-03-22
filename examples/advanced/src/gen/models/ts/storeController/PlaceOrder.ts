import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrder200 = Order

/**
 * @description Invalid input
 */
export type PlaceOrder405 = any

export type PlaceOrderMutationRequest = Order

export type PlaceOrderMutationResponse = PlaceOrder200

export type PlaceOrderMutation = {
  /**
   * @type object
   */
  Response: PlaceOrder200
  /**
   * @type object
   */
  Request: PlaceOrderMutationRequest
  /**
   * @type object
   */
  Errors: PlaceOrder405
}
