import type { OrderType } from './OrderType.ts'

/**
 * @description successful operation
 */
export type PlaceOrder200Type = OrderType

/**
 * @description Invalid input
 */
export type PlaceOrder405Type = any

export type PlaceOrderMutationRequestType = OrderType

export type PlaceOrderMutationResponseType = PlaceOrder200Type

export type PlaceOrderTypeMutation = {
  Response: PlaceOrder200Type
  Request: PlaceOrderMutationRequestType
  Errors: PlaceOrder405Type
}