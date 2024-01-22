import type { Order } from '../Order'

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any | null

export type PlaceOrderPatchMutationRequest = Order

/**
 * @description successful operation
 */
export type PlaceOrderPatchMutationResponse = Order
export type PlaceOrderPatchMutation = {
  Response: PlaceOrderPatchMutationResponse
  Request: PlaceOrderPatchMutationRequest
  Errors: PlaceOrderPatch405
}
