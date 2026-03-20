import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrderPatch200 = Order

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any

export type PlaceOrderPatchMutationRequest = Order

export type PlaceOrderPatchMutation = {
  Response: PlaceOrderPatch200
  Request: PlaceOrderPatchMutationRequest
  Errors: PlaceOrderPatch405
}

export type PlaceOrderPatchMutationResponse = PlaceOrderPatch200
