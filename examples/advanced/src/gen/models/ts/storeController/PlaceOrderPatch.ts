import { Order } from '../Order'

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any

/**
 * @description successful operation
 */
export type PlaceOrderPatch200 = Order

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
