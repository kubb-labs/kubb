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
export namespace PlaceOrderMutation {
  export type Response = PlaceOrderMutationResponse
  export type Request = PlaceOrderMutationRequest
  export type Errors = PlaceOrder405
}
