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

/**
 * @description successful operation
 */
export type PlaceOrderMutationResponseType = OrderType

export type PlaceOrderTypeMutation = {
  Response: PlaceOrderMutationResponseType
  Request: PlaceOrderMutationRequestType
  Errors: PlaceOrder405Type
}
