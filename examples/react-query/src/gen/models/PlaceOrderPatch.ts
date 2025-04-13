// version: 1.0.11
/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { Order } from './Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrderPatch200 = Order

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any

export type PlaceOrderPatchMutationRequest = Order

export type PlaceOrderPatchMutationResponse = PlaceOrderPatch200

export type PlaceOrderPatchMutation = {
  Response: PlaceOrderPatch200
  Request: PlaceOrderPatchMutationRequest
  Errors: PlaceOrderPatch405
}
