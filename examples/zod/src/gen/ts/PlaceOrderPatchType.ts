import type { OrderType } from './OrderType'

/**
 * @description successful operation
 */
export type PlaceOrderPatch200Type = OrderType
/**
 * @description Invalid input
 */
export type PlaceOrderPatch405Type = any
export type PlaceOrderPatchMutationRequestType = OrderType
/**
 * @description successful operation
 */
export type PlaceOrderPatchMutationResponseType = OrderType
export type PlaceOrderPatchTypeMutation = {
  Response: PlaceOrderPatchMutationResponseType
  Request: PlaceOrderPatchMutationRequestType
  Errors: PlaceOrderPatch405Type
}
