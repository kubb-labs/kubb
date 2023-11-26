import type { Order } from '../../models'

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any | null

export type PlaceOrderPatchMutationRequest = Order

/**
 * @description successful operation
 */
export type PlaceOrderPatchMutationResponse = Order
export namespace PlaceOrderPatchMutation {
  export type Response = PlaceOrderPatchMutationResponse
  export type Request = PlaceOrderPatchMutationRequest
  export type Errors = PlaceOrderPatch405
}
