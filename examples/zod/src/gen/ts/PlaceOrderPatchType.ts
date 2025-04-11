import type { OrderType } from './OrderType.ts'

/**
 * @description successful operation
 */
export type PlaceOrderPatch200Type = OrderType

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405Type = any

export type PlaceOrderPatchMutationRequestType = OrderType

export type PlaceOrderPatchMutationResponseType = PlaceOrderPatch200Type

export type PlaceOrderPatchTypeMutation = {
  Response: PlaceOrderPatch200Type
  Request: PlaceOrderPatchMutationRequestType
  Errors: PlaceOrderPatch405Type
}